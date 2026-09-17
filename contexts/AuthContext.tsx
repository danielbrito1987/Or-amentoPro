
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { getSupabase } from '../services/supabase';
import { saasService, SubscriptionPlanId, BillingCycle } from '../services/saasService';
import { partnerService } from '../services/partnerService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuspended: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  subscriptionInfo: {
    status: 'trial' | 'active' | 'expired';
    daysRemaining: number;
    hoursRemaining: number;
    expiresAt: Date;
    isExpired: boolean;
    isPartner?: boolean;
    partnerCompany?: string;
  };
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string, 
    password: string, 
    name?: string, 
    partnerCode?: string,
    plan?: SubscriptionPlanId,
    billingCycle?: BillingCycle
  ) => Promise<{ message?: string }>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  refreshUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verifica se a função existe antes de chamar
        if (typeof authService?.getCurrentUserAsync === 'function') {
          const currentUser = await authService.getCurrentUserAsync();
          if (currentUser) {
            setUser(currentUser);
          }
        } else if (typeof authService?.getCurrentUser === 'function') {
          const local = authService.getCurrentUser();
          if (local) {
            setUser(local);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Carrega estado inicial de forma síncrona do localStorage para evitar telas de login piscando
  useEffect(() => {
    const savedUser = authService.getCurrentUser();
    const savedToken = authService.getToken();

    if (savedUser && savedToken && savedToken !== 'undefined' && savedToken !== 'pending_confirmation') {
      // Registra/sincroniza no SaaS
      saasService.registerNewUser(savedUser);
      setUser(savedUser);
      setToken(savedToken);
    } else {
      authService.logout();
    }
    setIsLoading(false);

    // Ouve alterações de autenticação no Supabase se configurado
    const supabase = getSupabase();
    if (supabase) {
      // Faz verificação do usuário atual na inicialização
      authService.checkFreshUserStatus().then(async (freshUser) => {
        if (freshUser) {
          // Consulta se houve atualização de assinatura ou parceria remota no Supabase profiles
          await saasService.fetchRemoteSubscriptionStatus(freshUser.email);
          saasService.registerNewUser(freshUser);
          setUser(freshUser);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          const meta = session.user.user_metadata || {};
          const appMeta = session.user.app_metadata || {};
          const isSuspended = 
            meta.status === 'suspended' || 
            meta.is_active === false || 
            meta.disabled === true ||
            appMeta.status === 'suspended' ||
            appMeta.is_active === false ||
            appMeta.disabled === true;

          const usr: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: meta.name || (session.user.email ? session.user.email.split('@')[0] : 'Prestador'),
            companyId: meta.company_id || session.user.id,
            status: isSuspended ? 'suspended' : 'active',
            statusReason: meta.status_reason || meta.statusReason || appMeta.status_reason || 'Sua assinatura ou período de acesso expirou. Entre em contato com o administrador para regularizar seu plano.',
            role: (session.user.email?.toLowerCase() === saasService.getAdminEmail().toLowerCase()) 
              ? 'admin' 
              : (meta.role || appMeta.role || 'user')
          };

          // Atualiza status remoto do banco de dados (ex: se o dono marcou como parceiro)
          await saasService.fetchRemoteSubscriptionStatus(usr.email);
          saasService.registerNewUser(usr);
          setUser(usr);
          setToken(session.access_token);
          localStorage.setItem('orcafacil_jwt_token', session.access_token);
          localStorage.setItem('orcafacil_user', JSON.stringify(usr));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const refreshUserStatus = async () => {
    const freshUser = await authService.checkFreshUserStatus();
    if (freshUser) {
      await saasService.fetchRemoteSubscriptionStatus(freshUser.email);
      saasService.registerNewUser(freshUser);
      setUser(freshUser);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    
    // Se este e-mail for a conta do próprio parceiro credenciado pelo admin, garante o acesso VIP gratuito
    const matchingPartner = partnerService.findPartnerByEmail(email);
    if (matchingPartner && matchingPartner.active) {
      result.user.subscriptionStatus = 'partner';
      result.user.partnerCompany = matchingPartner.name;
      result.user.partnerCode = matchingPartner.code;
      await saasService.setPartnerAccessForUser(
        email, 
        matchingPartner.name, 
        matchingPartner.code, 
        matchingPartner.accessType === 'dias' ? matchingPartner.accessDays : undefined
      );
    }

    saasService.registerNewUser(result.user, {
      isPartnerSelf: !!(matchingPartner && matchingPartner.active),
      partnerCompany: matchingPartner?.name,
      partnerCode: matchingPartner?.code
    });
    setUser(result.user);
    setToken(result.token);
  };

  const register = async (
    email: string, 
    password: string, 
    name?: string, 
    partnerCode?: string,
    plan: SubscriptionPlanId = 'pro',
    billingCycle: BillingCycle = 'monthly'
  ) => {
    let partnerInfo: { name: string; code: string; isPartnerSelf: boolean; days?: number } | null = null;

    if (partnerCode && partnerCode.trim()) {
      const validation = partnerService.validateCode(partnerCode, email);
      if (!validation.valid || !validation.partner) {
        throw new Error(validation.message || 'Código de indicação de parceiro inválido.');
      }
      partnerInfo = {
        name: validation.partner.name,
        code: validation.partner.code,
        isPartnerSelf: validation.isPartnerAccount === true,
        days: validation.partner.accessType === 'dias' ? validation.partner.accessDays : undefined
      };
    } else {
      // Se não digitou código, verifica se o próprio e-mail já foi pré-cadastrado como parceiro no painel admin
      const matchingPartner = partnerService.findPartnerByEmail(email);
      if (matchingPartner && matchingPartner.active) {
        partnerInfo = {
          name: matchingPartner.name,
          code: matchingPartner.code,
          isPartnerSelf: true,
          days: matchingPartner.accessType === 'dias' ? matchingPartner.accessDays : undefined
        };
      }
    }

    const result = await authService.register(email, password, name, plan, billingCycle);
    if (result.token !== 'pending_confirmation') {
      const userToRegister = { 
        ...result.user,
        plan,
        billingCycle
      };

      if (partnerInfo) {
        userToRegister.partnerCompany = partnerInfo.name;
        userToRegister.partnerCode = partnerInfo.code;

        if (partnerInfo.isPartnerSelf) {
          // É a conta do PRÓPRIO profissional parceiro: acesso VIP 100% gratuito liberado!
          userToRegister.subscriptionStatus = 'partner';
        } else {
          // É empresa/cliente indicada pelo parceiro: paga normalmente, começa em trial de 7 dias
          partnerService.incrementUsage(partnerInfo.code);
        }
      }

      saasService.registerNewUser(userToRegister, { 
        plan, 
        billingCycle,
        partnerCompany: partnerInfo?.name,
        partnerCode: partnerInfo?.code,
        isPartnerSelf: partnerInfo?.isPartnerSelf
      });

      if (partnerInfo && partnerInfo.isPartnerSelf) {
        saasService.setPartnerAccessForUser(
          userToRegister.email,
          partnerInfo.name,
          partnerInfo.code,
          partnerInfo.days
        );
      }

      setUser(userToRegister);
      setToken(result.token);
    }
    return { message: result.message };
  };

  const loginAsDemo = async () => {
    const result = await authService.loginAsDemo();
    saasService.registerNewUser(result.user);
    setUser(result.user);
    setToken(result.token);
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const isAdmin = saasService.isAdmin(user);

  const subscriptionInfo = user 
    ? saasService.getUserSubscriptionStatus(user)
    : {
        status: 'expired' as const,
        daysRemaining: 0,
        hoursRemaining: 0,
        expiresAt: new Date(),
        isExpired: true
      };

  // Usuário é suspenso se seu status manual for suspended OU se não for admin e seu plano tiver expirado (passaram os 7 dias ou a mensalidade)
  const isSuspended = !isAdmin && (user?.status === 'suspended' || subscriptionInfo.isExpired);

  const value = {
    user,
    token,
    isAuthenticated: !!token && token !== 'undefined' && token !== 'pending_confirmation',
    isSuspended,
    isLoading,
    isAdmin,
    subscriptionInfo,
    login,
    register,
    loginAsDemo,
    logout,
    refreshUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
