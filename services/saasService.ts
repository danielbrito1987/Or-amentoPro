import { getSupabase } from './supabase';
import { User } from '../types';

export const ADMIN_EMAIL = 'damasceno1871@gmail.com';
export const PIX_KEY = 'damasceno1871@gmail.com';
export const MONTHLY_PRICE = 59.90;
export const TRIAL_DAYS = 7;

const USERS_REGISTRY_KEY = 'orcafacil_registered_users_registry';

export interface SaaSUserRecord {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  trialEndsAt: string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'partner';
  subscriptionValidUntil?: string;
  lastPaymentNote?: string;
  role: 'admin' | 'user';
  companyId: string;
  quotesCount?: number;
  partnerCompany?: string; // Nome da empresa parceira associada
  partnerCode?: string; // Código utilizado
}

export const saasService = {
  getAdminEmail: () => ADMIN_EMAIL,
  getPixKey: () => PIX_KEY,
  getMonthlyPrice: () => MONTHLY_PRICE,
  getTrialDays: () => TRIAL_DAYS,

  isAdmin: (user?: User | null): boolean => {
    if (!user || !user.email) return false;
    const cleanEmail = user.email.trim().toLowerCase();
    return cleanEmail === ADMIN_EMAIL.toLowerCase() || user.role === 'admin';
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

  registerNewUser: (user: User): SaaSUserRecord => {
    const users = saasService.getAllUsers();
    const existing = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());

    const isSystemAdmin = user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const isTestDemo = user.email.trim().toLowerCase() === 'teste@orcafacil.com.br' || user.email.trim().toLowerCase() === 'demo@orcafacil.com.br';

    if (existing) {
      if (isSystemAdmin) {
        existing.role = 'admin';
        existing.subscriptionStatus = 'active';
      } else if (isTestDemo) {
        existing.role = 'user';
        existing.subscriptionStatus = 'active';
        existing.subscriptionValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      }
      saasService.saveUserRecord(existing);
      return existing;
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const record: SaaSUserRecord = {
      id: user.id || 'usr_' + Math.random().toString(36).substring(2, 9),
      email: user.email,
      name: user.name || user.email.split('@')[0],
      createdAt: now.toISOString(),
      trialEndsAt: trialEnd.toISOString(),
      subscriptionStatus: (isSystemAdmin || isTestDemo) ? 'active' : 'trial',
      subscriptionValidUntil: isSystemAdmin 
        ? new Date(2099, 11, 31).toISOString() 
        : (isTestDemo ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : undefined),
      role: isSystemAdmin ? 'admin' : 'user', // O usuário de teste é estritamente 'user' (não-dono)
      companyId: user.companyId || 'comp_' + Math.random().toString(36).substring(2, 9)
    };

    users.push(record);
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
    return record;
  },

  getUserSubscriptionStatus: (user: User): {
    status: 'trial' | 'active' | 'expired';
    daysRemaining: number;
    hoursRemaining: number;
    expiresAt: Date;
    isExpired: boolean;
    isPartner?: boolean;
    partnerCompany?: string;
  } => {
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
      record.partnerCompany = partnerName;
      record.partnerCode = partnerCode.toUpperCase();
      record.lastPaymentNote = `Acesso liberado via parceria: ${partnerName} (Cupom: ${partnerCode.toUpperCase()})`;
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
        // Tenta atualizar a linha do usuário na tabela profiles
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

  // Ativa assinatura Pro (PIX pago) e sincroniza no Supabase
  activateSubscriptionForUser: async (email: string, daysToAdd: number = 30, note?: string) => {
    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const now = new Date();
    const currentValid = (record && record.subscriptionValidUntil) ? new Date(record.subscriptionValidUntil) : now;
    const baseTime = currentValid > now ? currentValid.getTime() : now.getTime();
    const newExpiry = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    if (record) {
      record.subscriptionStatus = 'active';
      record.subscriptionValidUntil = newExpiry;
      if (note) record.lastPaymentNote = note;
      saasService.saveUserRecord(record);
    }

    // Persiste no Supabase profiles se conectado
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_valid_until: newExpiry
          })
          .ilike('email', email.trim());
      } catch (e) {
        console.warn('Tentativa de atualizar assinatura no Supabase profiles:', e);
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

        const record: SaaSUserRecord = {
          id: p.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          email: p.email,
          name: p.name || (p.email.split('@')[0]),
          createdAt: createdAt,
          trialEndsAt: p.trial_ends_at || defaultTrialEnd,
          subscriptionStatus: isOwner ? 'active' : (p.status === 'blocked' ? 'expired' : (p.plan === 'pro' || p.plan === 'enterprise' ? 'active' : 'trial')),
          subscriptionValidUntil: isOwner ? new Date(2099, 11, 31).toISOString() : (p.subscription_valid_until || undefined),
          role: isOwner ? 'admin' : (p.role === 'admin' ? 'admin' : 'user'),
          companyId: p.company_id || `comp_${p.id || Date.now()}`,
          partnerCompany: p.partner_company || undefined,
          partnerCode: p.partner_code || undefined
        };

        // Respeita o status do banco: 'partner', 'active', 'expired', 'trial'
        if (p.subscription_status) {
          record.subscriptionStatus = p.subscription_status;
        }

        if (existingIndex >= 0) {
          users[existingIndex] = {
            ...users[existingIndex],
            ...record,
            subscriptionStatus: record.subscriptionStatus || users[existingIndex].subscriptionStatus
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
