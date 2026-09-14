
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { getSupabase } from '../services/supabase';
import { saasService } from '../services/saasService';
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
  register: (email: string, password: string, name?: string, partnerCode?: string) => Promise<{ message?: string }>;
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
    saasService.registerNewUser(result.user);
    setUser(result.user);
    setToken(result.token);
  };

  const register = async (email: string, password: string, name?: string, partnerCode?: string) => {
    let partnerInfo: { name: string; code: string; days?: number } | null = null;

    if (partnerCode && partnerCode.trim()) {
      const validation = partnerService.validateCode(partnerCode);
      if (!validation.valid || !validation.partner) {
        throw new Error(validation.message || 'Código de parceria inválido.');
      }
      partnerInfo = {
        name: validation.partner.name,
        code: validation.partner.code,
        days: validation.partner.accessType === 'dias' ? validation.partner.accessDays : undefined
      };
    }

    const result = await authService.register(email, password, name);
    if (result.token !== 'pending_confirmation') {
      const userToRegister = { ...result.user };

      if (partnerInfo) {
        userToRegister.subscriptionStatus = 'partner';
        userToRegister.partnerCompany = partnerInfo.name;
        userToRegister.partnerCode = partnerInfo.code;
        partnerService.incrementUsage(partnerInfo.code);
      }

      saasService.registerNewUser(userToRegister);

      if (partnerInfo) {
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
