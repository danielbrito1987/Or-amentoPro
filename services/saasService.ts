import { getSupabase } from './supabase';
import { User } from '../types';

export const ADMIN_EMAIL = 'damasceno1871@gmail.com';
export const PIX_KEY = 'damasceno1871@gmail.com';
export const PLAN_BASIC_PRICE = 29.90;
export const PLAN_BASIC_ANNUAL_PRICE = 299.90;
export const PLAN_PRO_PRICE = 59.90;
export const PLAN_PRO_ANNUAL_PRICE = 599.90;
export const PLAN_PREMIUM_PRICE = 199.90;
export const PLAN_PREMIUM_ANNUAL_PRICE = 1999.90;
export const MONTHLY_PRICE = PLAN_PRO_PRICE;
export const TRIAL_DAYS = 7;
export const BASIC_MONTHLY_QUOTES_LIMIT = 20;

export type SubscriptionPlanId = 'basic' | 'pro' | 'premium';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanConfig {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  annualPrice: number;
  hasFreeTrial: boolean;
  monthlyQuotesLimit: number | null; // null = sem limite
  hasAiConsultant: boolean;
  description: string;
  badge?: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, PlanConfig> = {
  basic: {
    id: 'basic',
    name: 'Plano Básico',
    price: PLAN_BASIC_PRICE,
    annualPrice: PLAN_BASIC_ANNUAL_PRICE,
    hasFreeTrial: true,
    monthlyQuotesLimit: BASIC_MONTHLY_QUOTES_LIMIT,
    hasAiConsultant: false,
    description: 'Para profissionais autônomos que buscam organizar propostas com custo reduzido.',
    badge: 'Econômico',
    features: [
      `Até ${BASIC_MONTHLY_QUOTES_LIMIT} orçamentos profissionais por mês`,
      'Envio rápido em PDF pelo WhatsApp',
      'Catálogo de serviços e materiais',
      'Sua logo, CNPJ/CPF e chave Pix na proposta',
      'Sincronização em nuvem e modo offline',
      'Suporte via WhatsApp'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Plano Pro Completo',
    price: PLAN_PRO_PRICE,
    annualPrice: PLAN_PRO_ANNUAL_PRICE,
    hasFreeTrial: true,
    monthlyQuotesLimit: null, // Ilimitado
    hasAiConsultant: true,
    description: 'Acesso total e irrestrito para fechar mais negócios e nunca errar nos preços.',
    badge: 'Mais Escolhido',
    features: [
      'Orçamentos ilimitados em PDF',
      'Consultor de Preços com Inteligência Artificial (SINAPI e médias)',
      'Envio rápido em PDF pelo WhatsApp em 1 clique',
      'Catálogo de serviços e materiais sem limites',
      'Sua logo, CNPJ/CPF e chave Pix na proposta',
      'Sincronização em nuvem e modo offline',
      'Suporte prioritário via WhatsApp'
    ]
  },
  premium: {
    id: 'premium',
    name: 'Plano Premium',
    price: PLAN_PREMIUM_PRICE,
    annualPrice: PLAN_PREMIUM_ANNUAL_PRICE,
    hasFreeTrial: false, // O Plano Premium NÃO possui 7 dias grátis
    monthlyQuotesLimit: null, // Ilimitado
    hasAiConsultant: true,
    description: 'Gestão completa de orçamentos, contratos com assinatura digital e validade jurídica.',
    badge: 'Mais Completo',
    features: [
      'Geração automática de Contratos a partir de Orçamentos',
      'Assinatura Eletrônica no sistema (Prestador e Cliente)',
      'Envio do contrato direto por WhatsApp e E-mail',
      'Validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020)',
      'Orçamentos ILIMITADOS em PDF com sua marca',
      'Consultor de Preços com Inteligência Artificial',
      'Sincronização em nuvem no Supabase e modo offline',
      'Suporte VIP via WhatsApp'
    ]
  }
};

const USERS_REGISTRY_KEY = 'orcafacil_registered_users_registry';

export interface SaaSUserRecord {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  trialEndsAt: string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'partner';
  subscriptionValidUntil?: string;
  plan?: SubscriptionPlanId;
  billingCycle?: BillingCycle;
  lastPaymentNote?: string;
  role: 'admin' | 'user';
  companyId: string;
  quotesCount?: number;
  partnerCompany?: string; // Nome da empresa parceira associada
  partnerCode?: string; // Código utilizado
  isPartnerAccount?: boolean; // Verdadeiro se for a conta DO PRÓPRIO parceiro (acesso VIP gratuito)
  referredByPartner?: string; // Nome do parceiro que indicou este cliente pagante
}

export const saasService = {
  getAdminEmail: () => ADMIN_EMAIL,
  getPixKey: () => PIX_KEY,
  getMonthlyPrice: () => MONTHLY_PRICE,
  getBasicPrice: () => PLAN_BASIC_PRICE,
  getBasicAnnualPrice: () => PLAN_BASIC_ANNUAL_PRICE,
  getProPrice: () => PLAN_PRO_PRICE,
  getProAnnualPrice: () => PLAN_PRO_ANNUAL_PRICE,
  getPremiumPrice: () => PLAN_PREMIUM_PRICE,
  getPremiumAnnualPrice: () => PLAN_PREMIUM_ANNUAL_PRICE,
  getBasicQuotesLimit: () => BASIC_MONTHLY_QUOTES_LIMIT,
  getTrialDays: () => TRIAL_DAYS,
  getPlanConfig: (planId: SubscriptionPlanId = 'pro') => SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.pro,
  getPlanPrice: (planId: SubscriptionPlanId = 'pro', cycle: BillingCycle = 'monthly'): number => {
    const config = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.pro;
    return cycle === 'annual' ? config.annualPrice : config.price;
  },
  hasPlanTrial: (planId: SubscriptionPlanId): boolean => {
    return planId !== 'premium';
  },
  getUserBillingCycle: (user?: User | null): BillingCycle => {
    if (!user || !user.email) return 'monthly';
    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (record && record.billingCycle) return record.billingCycle;
    if (user.billingCycle) return user.billingCycle;
    return 'monthly';
  },
  switchToTrialPlan: async (email: string, targetPlan: 'basic' | 'pro'): Promise<void> => {
    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    if (record) {
      record.plan = targetPlan;
      record.subscriptionStatus = 'trial';
      record.trialEndsAt = trialEnd;
      delete record.subscriptionValidUntil;
      record.lastPaymentNote = `Migrado para ${targetPlan.toUpperCase()} com 7 dias de teste grátis`;
      saasService.saveUserRecord(record);
    }

    try {
      const currentSaved = localStorage.getItem('orcafacil_user');
      if (currentSaved) {
        const u = JSON.parse(currentSaved);
        if (u.email?.toLowerCase() === email.toLowerCase()) {
          u.plan = targetPlan;
          u.subscriptionStatus = 'trial';
          u.trialEndsAt = trialEnd;
          delete u.subscriptionValidUntil;
          localStorage.setItem('orcafacil_user', JSON.stringify(u));
        }
      }
    } catch {}

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({
            plan: targetPlan,
            subscription_status: 'trial',
            trial_ends_at: trialEnd
          })
          .ilike('email', email.trim());
      } catch {}
    }
  },

  getUserPlan: (user?: User | null): SubscriptionPlanId => {
    if (!user || !user.email) return 'pro';
    if (saasService.isAdmin(user)) return 'premium';

    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (record && record.plan) return record.plan;
    if (user.plan) return user.plan;
    return 'pro';
  },

  /**
   * Determina se o usuário assinou o Plano Premium (ou é admin/demo/parceiro com plano premium ativo).
   * Restringe as funcionalidades exclusivas de minutas dinâmicas e cláusulas contratuais por item.
   */
  isPremiumUser: (user?: User | null): boolean => {
    if (!user || !user.email) return false;
    if (saasService.isAdmin(user)) return true;

    const cleanEmail = user.email.trim().toLowerCase();
    if (cleanEmail === 'teste@orcafacil.com.br' || cleanEmail === 'demo@orcafacil.com.br') {
      return true;
    }

    const plan = saasService.getUserPlan(user);
    if (plan !== 'premium') return false;

    const status = saasService.getUserSubscriptionStatus(user);
    return status.status === 'active' || status.isPartner === true;
  },

  canUseDynamicContractClauses: (user?: User | null): boolean => {
    return saasService.isPremiumUser(user);
  },

  canUseAiConsultant: (user?: User | null): { allowed: boolean; reason?: string } => {
    if (!user) return { allowed: false, reason: 'Usuário não autenticado.' };
    if (saasService.isAdmin(user)) return { allowed: true };

    const plan = saasService.getUserPlan(user);
    // No plano básico não tem o consultor de preços por IA (mesmo em período de trial)
    if (plan === 'basic') {
      return {
        allowed: false,
        reason: 'O Consultor de Preços com Inteligência Artificial não está disponível no Plano Básico. Faça o upgrade para o Plano Pro (R$ 59,90/mês) ou Premium para consultar tabelas do mercado com IA!'
      };
    }

    const status = saasService.getUserSubscriptionStatus(user);
    // Durante o trial de 7 dias ou para parceiros: liberado para experimentar (Planos Pro e Premium)
    if (status.status === 'trial' || status.isPartner) {
      return { allowed: true };
    }

    if (status.status === 'active') {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Sua assinatura expirou. Renove seu plano para continuar usando o Consultor de Preços com IA.'
    };
  },

  canUseContracts: (user?: User | null): { allowed: boolean; reason?: string } => {
    if (!user) return { allowed: false, reason: 'Usuário não autenticado.' };
    if (saasService.isAdmin(user)) return { allowed: true };

    const cleanUserEmail = user.email ? user.email.trim().toLowerCase() : '';
    if (cleanUserEmail === 'teste@orcafacil.com.br' || cleanUserEmail === 'demo@orcafacil.com.br') {
      return { allowed: true };
    }

    const plan = saasService.getUserPlan(user);
    // Os planos Básico e Pro NÃO podem ter acesso ao módulo de contratos. Esse módulo é exclusivo para o plano Premium.
    if (plan !== 'premium') {
      return {
        allowed: false,
        reason: 'O Módulo de Gestão de Contratos e Assinatura Digital é exclusivo do Plano Premium (R$ 199,90/mês). Os planos Básico e Pro não têm acesso ao módulo de contratos. Faça o upgrade para formalizar seus orçamentos com validade jurídica!'
      };
    }

    const status = saasService.getUserSubscriptionStatus(user);
    if (status.status === 'active' || status.isPartner) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Sua assinatura do Plano Premium não está ativa. Realize a ativação para continuar gerando contratos.'
    };
  },

  getQuotesCreatedThisMonth: (quotes: { date?: string }[] = []): number => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return quotes.filter(q => {
      if (!q.date) return false;
      try {
        const qDate = new Date(q.date);
        return qDate.getFullYear() === currentYear && qDate.getMonth() === currentMonth;
      } catch {
        return false;
      }
    }).length;
  },

  checkQuoteCreationLimit: (user: User | null, quotes: { date?: string }[] = []): {
    allowed: boolean;
    count: number;
    limit: number | null;
    plan: SubscriptionPlanId;
    message?: string;
  } => {
    if (!user || saasService.isAdmin(user)) {
      return { allowed: true, count: 0, limit: null, plan: 'pro' };
    }

    const status = saasService.getUserSubscriptionStatus(user);
    // Durante o período de teste de 7 dias ou parceiros: orçamentos liberados
    if (status.status === 'trial' || status.isPartner) {
      return { allowed: true, count: 0, limit: null, plan: 'pro' };
    }

    const plan = saasService.getUserPlan(user);
    if (plan === 'pro' || plan === 'premium') {
      return { allowed: true, count: 0, limit: null, plan };
    }

    // Plano Básico: validação de limite mensal
    const count = saasService.getQuotesCreatedThisMonth(quotes);
    const limit = BASIC_MONTHLY_QUOTES_LIMIT;

    if (count >= limit) {
      return {
        allowed: false,
        count,
        limit,
        plan: 'basic',
        message: `Você atingiu o limite de ${limit} orçamentos deste mês no Plano Básico. Faça o upgrade para o Plano Pro para criar orçamentos ilimitados!`
      };
    }

    return { allowed: true, count, limit, plan: 'basic' };
  },

  isAdmin: (user?: User | null): boolean => {
    if (!user || !user.email) return false;
    const cleanEmail = user.email.trim().toLowerCase();
    return cleanEmail === ADMIN_EMAIL.toLowerCase() || user.role === 'admin';
  },

  // Determina dinamicamente o status real e atualizado de qualquer registro de usuário (inclusive se expirou o trial ou validade)
  getEffectiveUserStatus: (u: SaaSUserRecord): 'active' | 'trial' | 'expired' | 'partner' => {
    const cleanEmail = u.email ? u.email.trim().toLowerCase() : '';
    const isMasterAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase() || u.role === 'admin';
    if (isMasterAdmin) return 'active';

    if (cleanEmail === 'teste@orcafacil.com.br' || cleanEmail === 'demo@orcafacil.com.br') {
      return 'active';
    }

    const now = Date.now();

    // 1. Se for parceiro (conta VIP ou convênio liberado)
    if (u.subscriptionStatus === 'partner' || u.isPartnerAccount) {
      if (u.subscriptionValidUntil) {
        const validUntil = new Date(u.subscriptionValidUntil).getTime();
        if (now > validUntil) return 'expired';
      }
      return 'partner';
    }

    // 2. Se for assinante ativo com data de validade paga
    if (u.subscriptionStatus === 'active') {
      if (u.subscriptionValidUntil) {
        const validUntil = new Date(u.subscriptionValidUntil).getTime();
        if (now > validUntil) return 'expired';
      }
      return 'active';
    }

    // 3. Se for plano Premium sem data de validade ativa
    if (u.plan === 'premium' && !u.subscriptionValidUntil) {
      return 'expired';
    }

    // 4. Período de teste (trial de 7 dias)
    if (u.trialEndsAt) {
      const trialEndTime = new Date(u.trialEndsAt).getTime();
      if (now > trialEndTime) {
        return 'expired';
      }
      return 'trial';
    }

    return u.subscriptionStatus === 'expired' ? 'expired' : 'trial';
  },

  getAllUsers: (): SaaSUserRecord[] => {
    try {
      const raw = localStorage.getItem(USERS_REGISTRY_KEY);
      let list: SaaSUserRecord[] = raw ? JSON.parse(raw) : [];

      // Garante que o ADMIN sempre existe na lista com acesso vitalício
      const adminExists = list.some(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      if (!adminExists) {
        const adminRecord: SaaSUserRecord = {
          id: 'admin_master',
          email: ADMIN_EMAIL,
          name: 'Administrador Geral',
          createdAt: new Date(2025, 0, 1).toISOString(),
          trialEndsAt: new Date(2099, 11, 31).toISOString(),
          subscriptionStatus: 'active',
          subscriptionValidUntil: new Date(2099, 11, 31).toISOString(),
          role: 'admin',
          companyId: 'comp_admin_master'
        };
        list.unshift(adminRecord);
      }

      // Atualiza o status de cada usuário dinamicamente com base nas datas de expiração
      let hasChanges = false;
      list.forEach(u => {
        const currentEffective = saasService.getEffectiveUserStatus(u);
        if (u.subscriptionStatus !== currentEffective) {
          u.subscriptionStatus = currentEffective;
          hasChanges = true;
        }
      });

      if (hasChanges || !adminExists) {
        localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(list));
      }

      return list;
    } catch {
      return [];
    }
  },

  saveUserRecord: (record: SaaSUserRecord) => {
    const users = saasService.getAllUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === record.email.toLowerCase());
    if (index >= 0) {
      users[index] = { ...users[index], ...record };
    } else {
      users.push(record);
    }
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
  },

  registerNewUser: (
    user: User, 
    options?: { 
      plan?: SubscriptionPlanId; 
      billingCycle?: BillingCycle;
      partnerCompany?: string;
      partnerCode?: string;
      isPartnerSelf?: boolean;
    }
  ): SaaSUserRecord => {
    const users = saasService.getAllUsers();
    const existing = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());

    const isSystemAdmin = user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const isTestDemo = user.email.trim().toLowerCase() === 'teste@orcafacil.com.br' || user.email.trim().toLowerCase() === 'demo@orcafacil.com.br';

    const chosenPlan: SubscriptionPlanId = options?.plan || user.plan || 'pro';
    const chosenCycle: BillingCycle = options?.billingCycle || user.billingCycle || 'monthly';
    const isPartnerSelf = options?.isPartnerSelf || user.subscriptionStatus === 'partner';
    const partnerCompany = options?.partnerCompany || user.partnerCompany;
    const partnerCode = options?.partnerCode || user.partnerCode;

    if (existing) {
      if (isSystemAdmin) {
        existing.role = 'admin';
        existing.subscriptionStatus = 'active';
      } else if (isTestDemo) {
        existing.role = 'user';
        existing.subscriptionStatus = 'active';
        existing.subscriptionValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      } else if (isPartnerSelf) {
        existing.subscriptionStatus = 'partner';
        existing.isPartnerAccount = true;
        if (partnerCompany) existing.partnerCompany = partnerCompany;
        if (partnerCode) existing.partnerCode = partnerCode;
      }
      if (options?.plan) existing.plan = options.plan;
      if (options?.billingCycle) existing.billingCycle = options.billingCycle;
      if (partnerCompany && !existing.partnerCompany) existing.partnerCompany = partnerCompany;
      if (partnerCode && !existing.partnerCode) existing.partnerCode = partnerCode;
      if (!isPartnerSelf && partnerCompany) existing.referredByPartner = partnerCompany;
      saasService.saveUserRecord(existing);
      return existing;
    }

    const now = new Date();
    // Básico e Pro têm 7 dias de teste grátis; Premium NÃO tem período de teste grátis (ativação direta via PIX)
    const isPremium = chosenPlan === 'premium';
    const hasTrial = !isPremium;
    const trialDaysToAdd = hasTrial ? TRIAL_DAYS : 0;
    const trialEnd = new Date(now.getTime() + trialDaysToAdd * 24 * 60 * 60 * 1000);

    let initialStatus: 'trial' | 'active' | 'expired' | 'partner' = 'trial';
    if (isSystemAdmin || isTestDemo) {
      initialStatus = 'active';
    } else if (isPartnerSelf) {
      // Conta do PRÓPRIO parceiro (acesso VIP gratuito liberado)
      initialStatus = 'partner';
    } else if (isPremium) {
      // Plano Premium: sem período de teste grátis, requer pagamento para ativação
      initialStatus = 'expired';
    } else {
      // Clientes indicados pelo parceiro entram em TRIAL normalmente para testar 7 dias grátis
      initialStatus = 'trial';
    }

    const record: SaaSUserRecord = {
      id: user.id || 'usr_' + Math.random().toString(36).substring(2, 9),
      email: user.email,
      name: user.name || user.email.split('@')[0],
      createdAt: now.toISOString(),
      trialEndsAt: trialEnd.toISOString(),
      subscriptionStatus: initialStatus,
      subscriptionValidUntil: isSystemAdmin 
        ? new Date(2099, 11, 31).toISOString() 
        : (isTestDemo ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() 
        : (isPartnerSelf ? new Date(2099, 11, 31).toISOString() : undefined)),
      plan: chosenPlan,
      billingCycle: chosenCycle,
      lastPaymentNote: isPartnerSelf 
        ? `Acesso VIP concedido ao profissional parceiro (${partnerCompany || 'Parceria'})` 
        : (isPremium ? 'Plano Premium selecionado no cadastro - aguardando ativação via PIX' : undefined),
      role: isSystemAdmin ? 'admin' : 'user', // O usuário de teste é estritamente 'user' (não-dono)
      companyId: user.companyId || 'comp_' + Math.random().toString(36).substring(2, 9),
      partnerCompany: partnerCompany,
      partnerCode: partnerCode,
      isPartnerAccount: isPartnerSelf,
      referredByPartner: !isPartnerSelf && partnerCompany ? partnerCompany : undefined
    };

    users.push(record);
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));

    // Atualiza também objeto em memória se for o usuário salvo atualmente
    try {
      const currentSaved = localStorage.getItem('orcafacil_user');
      if (currentSaved) {
        const u = JSON.parse(currentSaved);
        if (u.email?.toLowerCase() === user.email.toLowerCase()) {
          u.plan = chosenPlan;
          u.billingCycle = chosenCycle;
          u.subscriptionStatus = initialStatus;
          localStorage.setItem('orcafacil_user', JSON.stringify(u));
        }
      }
    } catch {}

    // Sincroniza plano e status no Supabase profiles se disponível
    const supabase = getSupabase();
    if (supabase) {
      try {
        supabase
          .from('profiles')
          .update({
            plan: chosenPlan,
            billing_cycle: chosenCycle,
            subscription_status: initialStatus,
            trial_ends_at: trialEnd.toISOString()
          })
          .ilike('email', user.email.trim())
          .then(() => {});
      } catch {}
    }

    return record;
  },

  getUserSubscriptionStatus: (user?: User | null): {
    status: 'trial' | 'active' | 'expired';
    daysRemaining: number;
    hoursRemaining: number;
    expiresAt: Date;
    isExpired: boolean;
    isPartner?: boolean;
    partnerCompany?: string;
  } => {
    if (!user || !user.email) {
      return {
        status: 'expired',
        daysRemaining: 0,
        hoursRemaining: 0,
        expiresAt: new Date(),
        isExpired: true
      };
    }

    // Administrador tem acesso infinito
    if (saasService.isAdmin(user)) {
      return {
        status: 'active',
        daysRemaining: 9999,
        hoursRemaining: 999999,
        expiresAt: new Date(2099, 11, 31),
        isExpired: false
      };
    }

    // Usuário de teste/apresentação (não-dono): sempre ativo para demonstração perfeita
    const cleanUserEmail = user.email ? user.email.trim().toLowerCase() : '';
    if (cleanUserEmail === 'teste@orcafacil.com.br' || cleanUserEmail === 'demo@orcafacil.com.br') {
      return {
        status: 'active',
        daysRemaining: 30,
        hoursRemaining: 720,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isExpired: false
      };
    }

    const users = saasService.getAllUsers();
    let record = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());

    if (!record) {
      record = saasService.registerNewUser(user);
    }

    const now = new Date().getTime();

    // 1. Caso de Parceria / Convênio Liberado
    if (record.subscriptionStatus === 'partner') {
      // Se tiver data de validade (ex: 1 ano)
      if (record.subscriptionValidUntil) {
        const validUntilTime = new Date(record.subscriptionValidUntil).getTime();
        if (now <= validUntilTime) {
          const diffMs = validUntilTime - now;
          const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const hours = Math.ceil(diffMs / (1000 * 60 * 60));
          return {
            status: 'active',
            daysRemaining: days,
            hoursRemaining: hours,
            expiresAt: new Date(validUntilTime),
            isExpired: false,
            isPartner: true,
            partnerCompany: record.partnerCompany
          };
        } else {
          // Venceu o convênio
          record.subscriptionStatus = 'expired';
          saasService.saveUserRecord(record);
          return {
            status: 'expired',
            daysRemaining: 0,
            hoursRemaining: 0,
            expiresAt: new Date(validUntilTime),
            isExpired: true,
            isPartner: true,
            partnerCompany: record.partnerCompany
          };
        }
      }

      // Parceria Vitalícia (sem expiração)
      return {
        status: 'active',
        daysRemaining: 9999,
        hoursRemaining: 999999,
        expiresAt: new Date(2099, 11, 31),
        isExpired: false,
        isPartner: true,
        partnerCompany: record.partnerCompany || 'Empresa Parceira'
      };
    }

    // Se já foi ativado com pagamento mensal
    if (record.subscriptionStatus === 'active' && record.subscriptionValidUntil) {
      const validUntilTime = new Date(record.subscriptionValidUntil).getTime();
      if (now <= validUntilTime) {
        const diffMs = validUntilTime - now;
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.ceil(diffMs / (1000 * 60 * 60));
        return {
          status: 'active',
          daysRemaining: days,
          hoursRemaining: hours,
          expiresAt: new Date(validUntilTime),
          isExpired: false
        };
      } else {
        // Venceu a mensalidade
        record.subscriptionStatus = 'expired';
        saasService.saveUserRecord(record);
        return {
          status: 'expired',
          daysRemaining: 0,
          hoursRemaining: 0,
          expiresAt: new Date(validUntilTime),
          isExpired: true
        };
      }
    }

    // 2. Se for Plano Premium sem pagamento ativo: não possui 7 dias grátis
    if (record.plan === 'premium' && record.subscriptionStatus !== 'active') {
      return {
        status: 'expired',
        daysRemaining: 0,
        hoursRemaining: 0,
        expiresAt: new Date(record.trialEndsAt || now),
        isExpired: true
      };
    }

    // Caso de Período de Teste (Trial de 7 dias)
    const trialEndTime = new Date(record.trialEndsAt).getTime();
    if (now <= trialEndTime) {
      const diffMs = trialEndTime - now;
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.ceil(diffMs / (1000 * 60 * 60));
      return {
        status: 'trial',
        daysRemaining: days,
        hoursRemaining: hours,
        expiresAt: new Date(trialEndTime),
        isExpired: false
      };
    }

    // Expirou o período de 7 dias grátis
    if (record.subscriptionStatus !== 'expired') {
      record.subscriptionStatus = 'expired';
      saasService.saveUserRecord(record);
    }

    return {
      status: 'expired',
      daysRemaining: 0,
      hoursRemaining: 0,
      expiresAt: new Date(trialEndTime),
      isExpired: true
    };
  },

  resetTrialForUser: async (email: string, days: number = 7) => {
    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const now = new Date();
    const newTrialEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    if (record) {
      record.trialEndsAt = newTrialEnd;
      record.subscriptionStatus = 'trial';
      delete record.subscriptionValidUntil;
      saasService.saveUserRecord(record);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'trial',
            trial_ends_at: newTrialEnd
          })
          .ilike('email', email.trim());
      } catch (e) {
        console.warn('Erro ao atualizar trial no Supabase:', e);
      }
    }
  },

  // Concede acesso de parceria/convênio a um usuário (vitalício ou com prazo)
  setPartnerAccessForUser: async (email: string, partnerName: string, partnerCode: string, days?: number) => {
    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    const expiry = (days && days > 0)
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      : new Date(2099, 11, 31).toISOString(); // Vitalício

    if (record) {
      record.subscriptionStatus = 'partner';
      record.isPartnerAccount = true;
      record.partnerCompany = partnerName;
      record.partnerCode = partnerCode.toUpperCase();
      record.lastPaymentNote = `Acesso VIP liberado para o profissional parceiro: ${partnerName} (Código: ${partnerCode.toUpperCase()})`;
      record.subscriptionValidUntil = expiry;

      saasService.saveUserRecord(record);

      // Atualiza também se for o usuário salvo atualmente
      try {
        const currentSaved = localStorage.getItem('orcafacil_user');
        if (currentSaved) {
          const u = JSON.parse(currentSaved);
          if (u.email?.toLowerCase() === email.toLowerCase()) {
            u.subscriptionStatus = 'partner';
            u.partnerCompany = partnerName;
            u.partnerCode = partnerCode;
            localStorage.setItem('orcafacil_user', JSON.stringify(u));
          }
        }
      } catch {}
    }

    // Persiste também no Supabase (se tabela profiles existir ou metadata)
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'partner',
            partner_company: partnerName,
            partner_code: partnerCode.toUpperCase(),
            subscription_valid_until: expiry
          })
          .ilike('email', email.trim());
      } catch (e) {
        console.warn('Tentativa de sincronizar parceiro no Supabase profiles:', e);
      }
    }
  },

  // Vincula um cliente pagante ou em teste a um parceiro que o indicou (sem dar gratuidade)
  linkUserToReferralPartner: async (email: string, partnerName: string, partnerCode: string) => {
    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (record) {
      record.partnerCompany = partnerName;
      record.partnerCode = partnerCode.toUpperCase();
      record.referredByPartner = partnerName;
      record.isPartnerAccount = false;
      saasService.saveUserRecord(record);

      try {
        const currentSaved = localStorage.getItem('orcafacil_user');
        if (currentSaved) {
          const u = JSON.parse(currentSaved);
          if (u.email?.toLowerCase() === email.toLowerCase()) {
            u.partnerCompany = partnerName;
            u.partnerCode = partnerCode.toUpperCase();
            localStorage.setItem('orcafacil_user', JSON.stringify(u));
          }
        }
      } catch {}

      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase
            .from('profiles')
            .update({
              partner_company: partnerName,
              partner_code: partnerCode.toUpperCase()
            })
            .ilike('email', email.trim());
        } catch {}
      }
    }
  },

  // Ativa assinatura (PIX pago) e sincroniza no Supabase (suporta plano basic, pro ou premium)
  activateSubscriptionForUser: async (email: string, daysToAdd: number = 30, plan?: SubscriptionPlanId, note?: string) => {
    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const now = new Date();
    const currentValid = (record && record.subscriptionValidUntil) ? new Date(record.subscriptionValidUntil) : now;
    const baseTime = currentValid > now ? currentValid.getTime() : now.getTime();
    const newExpiry = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    const resolvedPlan: SubscriptionPlanId = plan || (record && record.plan) || 'pro';

    if (record) {
      record.subscriptionStatus = 'active';
      record.plan = resolvedPlan;
      record.subscriptionValidUntil = newExpiry;
      if (note) record.lastPaymentNote = note;
      saasService.saveUserRecord(record);

      // Atualiza também o objeto do usuário na sessão local se for o mesmo
      try {
        const currentSaved = localStorage.getItem('orcafacil_user');
        if (currentSaved) {
          const u = JSON.parse(currentSaved);
          if (u.email?.toLowerCase() === email.toLowerCase()) {
            u.subscriptionStatus = 'active';
            u.plan = resolvedPlan;
            u.subscriptionValidUntil = newExpiry;
            localStorage.setItem('orcafacil_user', JSON.stringify(u));
          }
        }
      } catch {}
    }

    // Persiste no Supabase profiles se conectado
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            plan: resolvedPlan,
            subscription_valid_until: newExpiry
          })
          .ilike('email', email.trim());
      } catch (e) {
        console.warn('Tentativa de atualizar assinatura no Supabase profiles:', e);
      }
    }
  },

  // Altera diretamente o plano de qualquer usuário (Básico, Pro ou Premium)
  updateUserPlan: async (email: string, newPlan: SubscriptionPlanId) => {
    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (record) {
      record.plan = newPlan;
      saasService.saveUserRecord(record);

      // Atualiza também na sessão local caso seja o usuário atual
      try {
        const currentSaved = localStorage.getItem('orcafacil_user');
        if (currentSaved) {
          const u = JSON.parse(currentSaved);
          if (u.email?.toLowerCase() === email.toLowerCase()) {
            u.plan = newPlan;
            localStorage.setItem('orcafacil_user', JSON.stringify(u));
          }
        }
      } catch {}
    }

    // Persiste no Supabase se conectado
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({ plan: newPlan })
          .ilike('email', email.trim());
      } catch (e) {
        console.warn('Tentativa de atualizar plano no Supabase profiles:', e);
      }
    }
  },

  // Consulta o perfil remoto no Supabase para saber se o dono mudou o status do cliente
  fetchRemoteSubscriptionStatus: async (email: string): Promise<Partial<SaaSUserRecord> | null> => {
    const supabase = getSupabase();
    if (!supabase || !email) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', email.trim())
        .maybeSingle();

      if (error || !data) return null;

      const updates: Partial<SaaSUserRecord> = {};
      if (data.subscription_status) {
        updates.subscriptionStatus = data.subscription_status;
      }
      if (data.plan) {
        updates.plan = data.plan === 'basic' ? 'basic' : data.plan === 'premium' ? 'premium' : 'pro';
      }
      if (data.partner_company) {
        updates.partnerCompany = data.partner_company;
      }
      if (data.partner_code) {
        updates.partnerCode = data.partner_code;
      }
      if (data.subscription_valid_until) {
        updates.subscriptionValidUntil = data.subscription_valid_until;
      }

      // Se encontrou dados remotos atualizados, sincroniza o registro local
      const users = saasService.getAllUsers();
      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        Object.assign(existing, updates);
        saasService.saveUserRecord(existing);
      }

      return updates;
    } catch {
      return null;
    }
  },

  blockUserAccess: (email: string, reason?: string) => {
    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (record) {
      record.subscriptionStatus = 'expired';
      record.subscriptionValidUntil = new Date(0).toISOString();
      record.trialEndsAt = new Date(0).toISOString();
      if (reason) record.lastPaymentNote = reason;
      saasService.saveUserRecord(record);
    }
  },

  syncWithSupabase: async (): Promise<{ success: boolean; count: number; message: string }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, count: 0, message: 'Supabase não está configurado nas variáveis de ambiente.' };
    }

    try {
      // 1. Tentar buscar da tabela profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.warn('Erro ao consultar profiles no Supabase:', error.message);
        return { success: false, count: 0, message: `Erro no Supabase: ${error.message}` };
      }

      if (!profiles || profiles.length === 0) {
        return { success: true, count: 0, message: 'Nenhum perfil encontrado na tabela profiles do Supabase.' };
      }

      const users = saasService.getAllUsers();
      let imported = 0;

      profiles.forEach((p: any) => {
        if (!p.email) return;
        const emailLower = p.email.trim().toLowerCase();
        const existingIndex = users.findIndex(u => u.email.toLowerCase() === emailLower);

        const createdAt = p.created_at || new Date().toISOString();
        const trialDays = saasService.getTrialDays();
        const defaultTrialEnd = new Date(new Date(createdAt).getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString();

        const isOwner = emailLower === saasService.getAdminEmail().toLowerCase();
        const rawStatus = isOwner
          ? 'active'
          : (p.status === 'blocked' ? 'expired' : (p.subscription_status || 'trial'));

        const record: SaaSUserRecord = {
          id: p.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          email: p.email,
          name: p.name || (p.email.split('@')[0]),
          createdAt: createdAt,
          trialEndsAt: p.trial_ends_at || defaultTrialEnd,
          subscriptionStatus: rawStatus,
          subscriptionValidUntil: isOwner ? new Date(2099, 11, 31).toISOString() : (p.subscription_valid_until || undefined),
          plan: isOwner ? 'premium' : (p.plan === 'basic' ? 'basic' : p.plan === 'premium' ? 'premium' : 'pro'),
          role: isOwner ? 'admin' : (p.role === 'admin' ? 'admin' : 'user'),
          companyId: p.company_id || `comp_${p.id || Date.now()}`,
          partnerCompany: p.partner_company || undefined,
          partnerCode: p.partner_code || undefined
        };

        // Calcula o status real e efetivo considerando as datas de validade/trial
        record.subscriptionStatus = saasService.getEffectiveUserStatus(record);

        if (existingIndex >= 0) {
          users[existingIndex] = {
            ...users[existingIndex],
            ...record,
            subscriptionStatus: record.subscriptionStatus
          };
        } else {
          users.push(record);
          imported++;
        }
      });

      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
      return { success: true, count: profiles.length, message: `${profiles.length} cadastros sincronizados do Supabase com sucesso!` };
    } catch (err: any) {
      console.error('Falha na sincronização:', err);
      return { success: false, count: 0, message: err.message || 'Erro inesperado na sincronização.' };
    }
  },
};

// Exportação direta da função para permitir import { canUseContracts } from '../services/saasService'
export const canUseContracts = (planOrUser?: string | User | null): boolean => {
  if (!planOrUser) return false;
  if (typeof planOrUser === 'object') {
    return saasService.canUseContracts(planOrUser).allowed;
  }
  const p = planOrUser.toLowerCase();
  return p === 'premium' || p === 'enterprise' || p === 'admin';
};

export const canUseAI = (plan?: string): boolean => {
  if (!plan) return false;
  const p = plan.toLowerCase();
  return p === 'pro' || p === 'premium' || p === 'enterprise' || p === 'admin';
};
