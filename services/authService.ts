
import { User, UserSubscription } from '../types';
import { apiService } from './api.service';
import { getSupabase, isSupabaseConfigured } from './supabase';

const TOKEN_KEY = 'orcafacil_jwt_token';
const USER_KEY = 'orcafacil_user';

const mapSupabaseUser = (sbUser: any, token: string, profile?: any): { token: string; user: User } => {
  const meta = sbUser.user_metadata || {};
  const appMeta = sbUser.app_metadata || {};
  const companyId = profile?.company_id || meta.company_id || sbUser.id;
  const name = profile?.name || meta.name || (sbUser.email ? sbUser.email.split('@')[0] : 'Prestador');

  const role = profile?.role || meta.role || appMeta.role || 'user';
  const plan: 'basic' | 'pro' | 'premium' = profile?.plan || meta.plan || 'pro';
  const billingCycle: 'monthly' | 'annual' = profile?.billing_cycle || meta.billing_cycle || 'monthly';
  const partnerCompany = profile?.partner_company || meta.partner_company || undefined;
  const partnerCode = profile?.partner_code || meta.partner_code || undefined;

  // Suporte a status de suspensão ou bloqueio vindo do profiles, metadata ou app_metadata
  const isExplicitlySuspended = 
    profile?.status === 'blocked' ||
    profile?.status === 'suspended' ||
    meta.status === 'suspended' || 
    meta.is_active === false || 
    meta.disabled === true ||
    appMeta.status === 'suspended' ||
    appMeta.is_active === false ||
    appMeta.disabled === true;

  // Status da assinatura e vigência vindos da tabela profiles (autoridade)
  let subscriptionStatus: 'trial' | 'active' | 'expired' | 'partner' = 
    profile?.subscription_status || meta.subscription_status || (plan === 'premium' ? 'expired' : 'trial');

  const trialEndsAt = profile?.trial_ends_at || meta.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const subscriptionValidUntil = profile?.subscription_valid_until || meta.subscription_valid_until || undefined;

  const now = Date.now();
  let daysRemaining = 0;
  let hoursRemaining = 0;
  let isExpired = false;
  const isAdminUser = role === 'admin' || (sbUser.email && sbUser.email.toLowerCase() === 'damasceno1871@gmail.com');

  if (isAdminUser) {
    subscriptionStatus = 'active';
    daysRemaining = 9999;
    hoursRemaining = 999999;
    isExpired = false;
  } else if (subscriptionStatus === 'partner') {
    if (subscriptionValidUntil) {
      const validUntilTime = new Date(subscriptionValidUntil).getTime();
      if (now <= validUntilTime) {
        const diff = validUntilTime - now;
        daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
        hoursRemaining = Math.ceil(diff / (1000 * 60 * 60));
        isExpired = false;
      } else {
        subscriptionStatus = 'expired';
        daysRemaining = 0;
        hoursRemaining = 0;
        isExpired = true;
      }
    } else {
      // Parceria vitalícia (sem expiração)
      daysRemaining = 9999;
      hoursRemaining = 999999;
      isExpired = false;
    }
  } else if (subscriptionStatus === 'active') {
    if (subscriptionValidUntil) {
      const validUntilTime = new Date(subscriptionValidUntil).getTime();
      if (now <= validUntilTime) {
        const diff = validUntilTime - now;
        daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
        hoursRemaining = Math.ceil(diff / (1000 * 60 * 60));
        isExpired = false;
      } else {
        subscriptionStatus = 'expired';
        daysRemaining = 0;
        hoursRemaining = 0;
        isExpired = true;
      }
    } else {
      daysRemaining = 30;
      hoursRemaining = 720;
      isExpired = false;
    }
  } else if (plan === 'premium') {
    // Plano Premium sem pagamento confirmado: sem dias gratuitos
    subscriptionStatus = 'expired';
    daysRemaining = 0;
    hoursRemaining = 0;
    isExpired = true;
  } else {
    // Período de teste (Trial de 7 dias)
    const trialEndTime = new Date(trialEndsAt).getTime();
    if (now <= trialEndTime) {
      const diff = trialEndTime - now;
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      hoursRemaining = Math.ceil(diff / (1000 * 60 * 60));
      isExpired = false;
    } else {
      subscriptionStatus = 'expired';
      daysRemaining = 0;
      hoursRemaining = 0;
      isExpired = true;
    }
  }

  // Preço e nome do plano
  const planPrices: Record<string, number> = { basic: 29.90, pro: 59.90, premium: 199.90 };
  const planNames: Record<string, string> = { basic: 'Básico', pro: 'Profissional', premium: 'Premium' };
  const planPrice = planPrices[plan] || 59.90;
  const planName = planNames[plan] || 'Profissional';

  // Objeto autoritativo completo de assinatura
  const subscription: UserSubscription = {
    status: subscriptionStatus,
    plan,
    billingCycle,
    trialEndsAt,
    subscriptionValidUntil,
    validUntil: subscriptionValidUntil,
    daysRemaining,
    hoursRemaining,
    isExpired,
    isPartner: subscriptionStatus === 'partner' || !!partnerCompany,
    partnerCompany,
    partnerCode,
    price: planPrice,
    planName
  };

  // Status autoritativo do usuário:
  // Se estiver bloqueado ou suspenso na autoridade (profiles), reflete imediatamente.
  // Se não estiver suspenso mas o plano expirou, o status reflete 'expired' (em vez de simplesmente 'active').
  // Caso contrário, reflete o status registrado em profiles (ou 'active' se regular).
  let status: 'active' | 'suspended' | 'blocked' | 'expired' | 'pending' | string = 'active';
  if (isExplicitlySuspended) {
    status = 'suspended';
  } else if (profile?.status && profile.status !== 'active') {
    status = profile.status;
  } else if (isExpired && !isAdminUser) {
    status = 'expired';
  } else {
    status = profile?.status || 'active';
  }

  const statusReason = profile?.status_reason || meta.status_reason || meta.statusReason || appMeta.status_reason || (
    isExplicitlySuspended 
      ? 'Sua conta foi suspensa ou bloqueada pelo administrador.' 
      : (isExpired && !isAdminUser ? 'Seu período de teste ou assinatura expirou. Regularize seu plano para continuar emitindo orçamentos.' : undefined)
  );

  const user: User = {
    id: sbUser.id,
    email: sbUser.email || profile?.email || '',
    name,
    companyId,
    status,
    statusReason,
    role,
    plan,
    billingCycle,
    subscriptionStatus,
    trialEndsAt,
    subscriptionValidUntil,
    partnerCompany,
    partnerCode,
    createdAt: profile?.created_at || sbUser.created_at,
    subscription,
    assinatura: subscription
  };

  // O localStorage funciona APENAS como CACHE temporário de leitura rápida, NUNCA como autoridade
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { token, user };
};

export const authService = {
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  },

  getCurrentUserAsync: async (timeoutMs: number = 2500): Promise<User | null> => {
    const supabase = getSupabase();
    if (!supabase) return authService.getCurrentUser();
    
    try {
      // 1. Consulta a sessão no Supabase de forma rápida e segura
      const sessionPromise = supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const timeoutPromise = new Promise<any>((res) => 
        setTimeout(() => res({ data: { session: null } }), timeoutMs)
      );

      const sessionResult: any = await Promise.race([sessionPromise, timeoutPromise]);
      const session = sessionResult?.data?.session || null;

      // Se não houver sessão ativa no Supabase:
      if (!session || !session.user) {
        // Se for o usuário de demonstração em memória/cache, mantém a sessão demo
        const cachedUser = authService.getCurrentUser();
        if (cachedUser && (cachedUser.isDemo || cachedUser.companyId === 'comp_demo_eletro')) {
          return cachedUser;
        }

        // Sem sessão ativa: limpa o cache local e retorna null
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }

      const activeToken = session.access_token || localStorage.getItem(TOKEN_KEY) || '';

      // 2. Busca o registro completo na tabela profiles (AUTORIDADE MÁXIMA de perfil, status e assinatura)
      let profile: any = null;
      try {
        const { data: pById } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        profile = pById;

        if (!profile && session.user.email) {
          const { data: pByEmail } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', session.user.email.trim())
            .maybeSingle();
          profile = pByEmail;
        }

        // Se o usuário está autenticado no Supabase Auth mas ainda não possui linha na tabela profiles,
        // auto-provisiona a linha na tabela profiles para manter a integridade autoritativa
        if (!profile && session.user.id && session.user.email) {
          const isOwner = session.user.email.trim().toLowerCase() === 'damasceno1871@gmail.com';
          const defaultProfile = {
            id: session.user.id,
            email: session.user.email.trim().toLowerCase(),
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            company_id: session.user.user_metadata?.company_id || 'comp_' + session.user.id.substring(0, 8),
            role: session.user.user_metadata?.role || (isOwner ? 'admin' : 'user'),
            plan: session.user.user_metadata?.plan || 'pro',
            billing_cycle: session.user.user_metadata?.billing_cycle || 'monthly',
            subscription_status: isOwner ? 'active' : (session.user.user_metadata?.plan === 'premium' ? 'expired' : 'trial'),
            trial_ends_at: isOwner ? new Date(2099, 11, 31).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          };

          try {
            const { data: insertedProfile } = await supabase
              .from('profiles')
              .upsert(defaultProfile, { onConflict: 'id' })
              .select('*')
              .maybeSingle();
            profile = insertedProfile || defaultProfile;
          } catch {
            profile = defaultProfile;
          }
        }
      } catch (profileErr) {
        console.warn('Aviso ao buscar dados em profiles:', profileErr);
      }

      // 3. Mapeia o usuário com todas as informações autoritativas de profiles (inclusive assinatura)
      const mapped = mapSupabaseUser(session.user, activeToken, profile);
      return mapped.user;
    } catch (err) {
      console.warn('Erro na validação autoritativa no Supabase:', err);
    }

    // Se estiver offline ou falhar rede, usa o cache local temporariamente como fallback
    const localUser = authService.getCurrentUser();
    if (localUser) return localUser;

    return null;
  },

  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 0. Usuário de teste/demonstração para apresentação do sistema (não é dono, dados modelos prontos)
    if (cleanEmail === 'teste@orcafacil.com.br' || cleanEmail === 'demo@orcafacil.com.br') {
      return authService.loginAsDemo();
    }

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
        let profile: any = null;
        try {
          const { data: p } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          profile = p;
        } catch {}

        return mapSupabaseUser(data.user, data.session.access_token, profile);
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

  register: async (
    email: string, 
    password: string, 
    name?: string,
    plan: 'basic' | 'pro' | 'premium' = 'pro',
    billingCycle: 'monthly' | 'annual' = 'monthly'
  ): Promise<{ token: string; user: User; message?: string }> => {
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
            company_id: safeCompanyId,
            plan,
            billing_cycle: billingCycle
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('Este e-mail já está cadastrado. Faça login ou recupere sua senha.');
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        } else if (error.message.includes('Database error saving new user')) {
          throw new Error('Erro no banco de dados do Supabase ao salvar novo usuário (conflito no gatilho de criação ou tabela profiles). Execute o script de correção do gatilho no SQL Editor do Supabase.');
        }
        throw new Error(error.message);
      }

      // Garante a inserção/atualização direta do perfil na tabela profiles (caso o gatilho esteja desativado)
      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0],
            company_id: safeCompanyId,
            plan,
            billing_cycle: billingCycle,
            subscription_status: plan === 'premium' ? 'expired' : 'trial',
            trial_ends_at: plan === 'premium' ? new Date().toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }, { onConflict: 'id' });
        } catch (profileSyncErr) {
          console.warn('Tentativa de upsert direto em profiles:', profileSyncErr);
        }
      }

      // Se a confirmação de e-mail estiver desabilitada no Supabase, a sessão já vem pronta
      if (data.session && data.user) {
        let profile: any = null;
        try {
          const { data: p } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          profile = p;
        } catch {}

        return mapSupabaseUser(data.user, data.session.access_token, profile);
      }

      // Se exigir confirmação de e-mail por link
      if (data.user && !data.session) {
        return {
          token: 'pending_confirmation',
          user: {
            id: data.user.id,
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0],
            companyId: safeCompanyId,
            plan,
            billingCycle
          },
          message: 'Conta criada com sucesso! Verifique seu e-mail para confirmar seu cadastro ou desative a confirmação no painel do Supabase.'
        };
      }
    }

    // Modo local / sem Supabase configurado
    const loginRes = await authService.login(cleanEmail, password);
    loginRes.user.plan = plan;
    loginRes.user.billingCycle = billingCycle;
    localStorage.setItem(USER_KEY, JSON.stringify(loginRes.user));
    return loginRes;
  },

  loginAsDemo: async (): Promise<{ token: string; user: User }> => {
    const demoUser: User = {
      id: 'usr_teste_apresentacao',
      email: 'teste@orcafacil.com.br',
      name: 'Carlos Silva (Demonstração / Teste)',
      companyId: 'comp_demo_eletro',
      role: 'user', // Explicitamente 'user' (NÃO é dono/admin)
      status: 'active',
      isDemo: true
    };

    const token = 'demo_jwt_token_active_presentation';
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

  checkFreshUserStatus: async (): Promise<User | null> => {
    return authService.getCurrentUserAsync();
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token && token !== 'undefined' && token !== 'null' && token !== 'pending_confirmation';
  }
};
