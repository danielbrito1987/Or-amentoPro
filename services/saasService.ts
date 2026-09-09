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
  subscriptionStatus: 'trial' | 'active' | 'expired';
  subscriptionValidUntil?: string;
  lastPaymentNote?: string;
  role: 'admin' | 'user';
  companyId: string;
  quotesCount?: number;
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

    if (existing) {
      if (isSystemAdmin) {
        existing.role = 'admin';
        existing.subscriptionStatus = 'active';
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
      subscriptionStatus: isSystemAdmin ? 'active' : 'trial',
      subscriptionValidUntil: isSystemAdmin ? new Date(2099, 11, 31).toISOString() : undefined,
      role: isSystemAdmin ? 'admin' : 'user',
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

    const users = saasService.getAllUsers();
    let record = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());

    if (!record) {
      record = saasService.registerNewUser(user);
    }

    const now = new Date().getTime();

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

  // Ações Administrativas para gerenciar clientes
  activateSubscriptionForUser: (email: string, daysToAdd: number = 30, note?: string) => {
    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (record) {
      const now = new Date();
      // Se já tinha data válida futura, soma a ela; caso contrário, conta a partir de agora
      const currentValid = record.subscriptionValidUntil ? new Date(record.subscriptionValidUntil) : now;
      const baseTime = currentValid > now ? currentValid.getTime() : now.getTime();
      const newExpiry = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000);

      record.subscriptionStatus = 'active';
      record.subscriptionValidUntil = newExpiry.toISOString();
      if (note) record.lastPaymentNote = note;

      saasService.saveUserRecord(record);
    }
  },

  resetTrialForUser: (email: string, days: number = 7) => {
    const users = saasService.getAllUsers();
    const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (record) {
      const now = new Date();
      record.trialEndsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
      record.subscriptionStatus = 'trial';
      delete record.subscriptionValidUntil;
      saasService.saveUserRecord(record);
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
  }
};
