
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { getSupabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuspended: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<{ message?: string }>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  refreshUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega estado inicial de forma síncrona do localStorage para evitar telas de login piscando
  useEffect(() => {
    const savedUser = authService.getCurrentUser();
    const savedToken = authService.getToken();

    if (savedUser && savedToken && savedToken !== 'undefined' && savedToken !== 'pending_confirmation') {
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
      authService.checkFreshUserStatus().then(freshUser => {
        if (freshUser) {
          setUser(freshUser);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
            role: meta.role || appMeta.role || 'user'
          };
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
      setUser(freshUser);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    setToken(result.token);
  };

  const register = async (email: string, password: string, name?: string) => {
    const result = await authService.register(email, password, name);
    if (result.token !== 'pending_confirmation') {
      setUser(result.user);
      setToken(result.token);
    }
    return { message: result.message };
  };

  const loginAsDemo = async () => {
    const result = await authService.loginAsDemo();
    setUser(result.user);
    setToken(result.token);
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const isSuspended = user?.status === 'suspended';

  const value = {
    user,
    token,
    isAuthenticated: !!token && token !== 'undefined' && token !== 'pending_confirmation',
    isSuspended,
    isLoading,
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
