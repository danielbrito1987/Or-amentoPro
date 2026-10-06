
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabase();

    // Trava de segurança máxima: garante que isLoading nunca fique travado em true
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 1200);

    const initAuth = async () => {
      try {
        // 1. Carrega dados do localStorage apenas como CACHE inicial para evitar telas em branco
        const cachedUser = authService.getCurrentUser();
        const cachedToken = authService.getToken();

        if (cachedUser && cachedToken && cachedToken !== 'undefined' && cachedToken !== 'pending_confirmation') {
          if (isMounted) {
            setUser(cachedUser);
            setToken(cachedToken);
          }
        }

        // 2. Consulta a AUTORIDADE REAL (Supabase Auth + tabela profiles)
        const authoritativeUser = await authService.getCurrentUserAsync();
        if (authoritativeUser && isMounted) {
          saasService.registerNewUser(authoritativeUser);
          setUser(authoritativeUser);
          setToken(authService.getToken());
        } else if (!authoritativeUser && isMounted) {
          // Se o Supabase responder que não há sessão ativa, o cache local é invalidado imediatamente!
          // Preserva apenas se for sessão de demonstração local explícita
          if (!cachedUser?.isDemo && cachedUser?.companyId !== 'comp_demo_eletro') {
            setUser(null);
            setToken(null);
            localStorage.removeItem('orcafacil_jwt_token');
            localStorage.removeItem('orcafacil_user');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão autoritativa:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // 3. Ouve alterações de autenticação no Supabase (login, logout, renovação de token)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          // Sempre busca o perfil autoritativo completo da tabela profiles
          const authoritativeUser = await authService.getCurrentUserAsync();
          if (authoritativeUser && isMounted) {
            saasService.registerNewUser(authoritativeUser);
            setUser(authoritativeUser);
            setToken(session.access_token);
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('orcafacil_jwt_token');
            localStorage.removeItem('orcafacil_user');
          }
        }
      });

      return () => {
        isMounted = false;
        clearTimeout(safetyTimer);
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const refreshUserStatus = async () => {
    const authoritativeUser = await authService.getCurrentUserAsync();
    if (authoritativeUser) {
      saasService.registerNewUser(authoritativeUser);
      setUser(authoritativeUser);
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

  const subscriptionInfo = user?.subscription
    ? {
        status: user.subscription.status === 'partner' ? ('active' as const) : (user.subscription.status as any),
        daysRemaining: user.subscription.daysRemaining,
        hoursRemaining: user.subscription.hoursRemaining,
        expiresAt: new Date(user.subscription.subscriptionValidUntil || user.subscription.trialEndsAt || Date.now()),
        isExpired: user.subscription.isExpired,
        isPartner: user.subscription.isPartner,
        partnerCompany: user.subscription.partnerCompany
      }
    : (user 
        ? saasService.getUserSubscriptionStatus(user)
        : {
            status: 'expired' as const,
            daysRemaining: 0,
            hoursRemaining: 0,
            expiresAt: new Date(),
            isExpired: true
          });

  // Usuário é suspenso se seu status manual for suspended/blocked OU se não for admin e seu plano tiver expirado (passaram os 7 dias ou a mensalidade)
  const isSuspended = !isAdmin && (user?.status === 'suspended' || user?.status === 'blocked' || subscriptionInfo.isExpired);

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
