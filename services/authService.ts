
import { User } from '../types';
import { apiService } from './api.service';
import { getSupabase, isSupabaseConfigured } from './supabase';

const TOKEN_KEY = 'orcafacil_jwt_token';
const USER_KEY = 'orcafacil_user';

const mapSupabaseUser = (sbUser: any, token: string): { token: string; user: User } => {
  const meta = sbUser.user_metadata || {};
  const appMeta = sbUser.app_metadata || {};
  const companyId = meta.company_id || sbUser.id;
  const name = meta.name || (sbUser.email ? sbUser.email.split('@')[0] : 'Prestador');

  // Suporte a status de suspensão configurado pelo Supabase (metadata ou app_metadata)
  const isSuspended = 
    meta.status === 'suspended' || 
    meta.is_active === false || 
    meta.disabled === true ||
    appMeta.status === 'suspended' ||
    appMeta.is_active === false ||
    appMeta.disabled === true;

  const status: 'active' | 'suspended' = isSuspended ? 'suspended' : 'active';
  const statusReason = meta.status_reason || meta.statusReason || appMeta.status_reason || 'Sua assinatura ou período de acesso expirou. Entre em contato com o administrador para regularizar seu plano.';

  const user: User = {
    id: sbUser.id,
    email: sbUser.email || '',
    name,
    companyId,
    status,
    statusReason,
    role: meta.role || appMeta.role || 'user'
  };

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { token, user };
};

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabase();

    // 1. Se o Supabase estiver configurado, usa a autenticação oficial do Supabase
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('E-mail ou senha incorretos no Supabase.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('E-mail ainda não confirmado. Verifique sua caixa de entrada ou desative "Confirm email" no painel do Supabase (Authentication > Providers > Email).');
        }
        throw new Error(error.message);
      }

      if (data.session && data.user) {
        return mapSupabaseUser(data.user, data.session.access_token);
      }
    }

    // 2. Se a API legada estiver configurada, tenta autenticar por ela
    try {
      const response = await apiService.post<any>('/auth/login', { 
        email: cleanEmail, 
        password 
      });

      const token = response.token || response.accessToken || response.jwt || (response.data && (response.data.token || response.data.accessToken));
      const user = response.user || response.data?.user || response;

      if (token && user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return { token, user };
      }
    } catch {
      // API legada indisponível
    }

    // 3. Fallback seguro para modo de testes / offline local
    const safeCompanyId = 'comp_' + (cleanEmail.split('@')[0] || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'comp_default';
    const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = namePart
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Prestador de Serviços';

    const localUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      name: formattedName,
      companyId: safeCompanyId,
    };

    const localToken = 'local_jwt_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem(TOKEN_KEY, localToken);
    localStorage.setItem(USER_KEY, JSON.stringify(localUser));

    return { token: localToken, user: localUser };
  },

  register: async (email: string, password: string, name?: string): Promise<{ token: string; user: User; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabase();

    if (supabase) {
      const safeCompanyId = 'comp_' + Math.random().toString(36).substring(2, 10);
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: name || cleanEmail.split('@')[0],
            company_id: safeCompanyId
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('Este e-mail já está cadastrado. Faça login ou recupere sua senha.');
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        throw new Error(error.message);
      }

      // Se a confirmação de e-mail estiver desabilitada no Supabase, a sessão já vem pronta
      if (data.session && data.user) {
        return mapSupabaseUser(data.user, data.session.access_token);
      }

      // Se exigir confirmação de e-mail por link
      if (data.user && !data.session) {
        return {
          token: 'pending_confirmation',
          user: {
            id: data.user.id,
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0],
            companyId: safeCompanyId
          },
          message: 'Conta criada com sucesso! Verifique seu e-mail para confirmar seu cadastro ou desative a confirmação no painel do Supabase.'
        };
      }
    }

    // Modo local / sem Supabase configurado
    return authService.login(cleanEmail, password);
  },

  loginAsDemo: async (): Promise<{ token: string; user: User }> => {
    const demoUser: User = {
      id: 'usr_demo_1',
      email: 'demo@orcafacil.com.br',
      name: 'Carlos Silva (Eletricista & Manutenções)',
      companyId: 'comp_demo_eletro',
    };

    const token = 'demo_jwt_token_active';
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser));

    return { token, user: demoUser };
  },

  logout: async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: (): User | null => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  checkFreshUserStatus: async (): Promise<User | null> => {
    const supabase = getSupabase();
    if (!supabase) return authService.getCurrentUser();

    try {
      const { data: { user: sbUser }, error } = await supabase.auth.getUser();
      if (error || !sbUser) return null;

      const token = authService.getToken() || '';
      const mapped = mapSupabaseUser(sbUser, token);
      return mapped.user;
    } catch {
      return authService.getCurrentUser();
    }
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token && token !== 'undefined' && token !== 'null' && token !== 'pending_confirmation';
  }
};
