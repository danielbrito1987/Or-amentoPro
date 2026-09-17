// Gerenciamento dos Profissionais/Empresas Parceiras e Indicações
// Modelo de Negócio:
// - O Parceiro (ex: Designer, Arquiteto, Loja) recebe acesso 100% gratuito (VIP) para utilizar o sistema.
// - As empresas e prestadores indicados pelo parceiro se cadastram pelo código/link dele,
//   recebem 7 dias grátis de teste e pagam a assinatura normalmente após o período de teste.

export interface PartnerCompany {
  id: string;
  code: string; // Código de indicação em maiúsculo (ex: DESIGNER-VIP, ARQ-MARCOS)
  name: string; // Nome fantasia ou profissional (ex: "Studio Designer Marcos Silva")
  partnerEmail?: string; // E-mail da conta do parceiro (com acesso 100% gratuito liberado)
  contactPerson?: string; // Nome do contato
  phone?: string; // Telefone/WhatsApp do parceiro
  notes?: string; // Detalhes da parceria (ex: "Acesso grátis concedido em troca de indicação para marcenarias e prestadores")
  active: boolean; // Se a parceria está ativa
  createdAt: string;
  activatedUsersCount: number; // Quantidade de empresas/clientes que se cadastraram por esta indicação
  accessType: 'vitalicio' | 'dias'; // Tipo de acesso concedido AO PRÓPRIO PARCEIRO
  accessDays?: number; // Se for por dias (ex: 365 para 1 ano)
}

const PARTNERS_STORAGE_KEY = 'orcafacil_partners_registry';

export const partnerService = {
  getPartners: (): PartnerCompany[] => {
    try {
      const raw = localStorage.getItem(PARTNERS_STORAGE_KEY);
      if (!raw) {
        // Inicializa com um parceiro padrão de exemplo para ilustrar o modelo com designers/arquitetos
        const defaultPartners: PartnerCompany[] = [
          {
            id: 'partner_designer',
            code: 'DESIGNER-VIP',
            name: 'Studio Designer Parceiro',
            partnerEmail: 'designer@parceiro.com.br',
            contactPerson: 'Marcos Designer de Interiores',
            phone: '(11) 98888-0000',
            notes: 'Acesso VIP gratuito liberado para o designer utilizar no dia a dia. Prestadores e empresas indicados por ele pagam a assinatura normalmente.',
            active: true,
            createdAt: new Date().toISOString(),
            activatedUsersCount: 0,
            accessType: 'vitalicio'
          }
        ];
        localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(defaultPartners));
        return defaultPartners;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  savePartners: (partners: PartnerCompany[]) => {
    try {
      localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(partners));
    } catch (e) {
      console.error('Erro ao salvar parceiros:', e);
    }
  },

  findPartnerByEmail: (email?: string): PartnerCompany | undefined => {
    if (!email || !email.trim()) return undefined;
    const cleanEmail = email.trim().toLowerCase();
    const list = partnerService.getPartners();
    return list.find(p => p.partnerEmail && p.partnerEmail.trim().toLowerCase() === cleanEmail);
  },

  findPartnerByCode: (code?: string): PartnerCompany | undefined => {
    if (!code || !code.trim()) return undefined;
    const cleanCode = code.trim().toUpperCase();
    const list = partnerService.getPartners();
    return list.find(p => p.code.toUpperCase() === cleanCode);
  },

  addPartner: (partner: Omit<PartnerCompany, 'id' | 'createdAt' | 'activatedUsersCount'>): PartnerCompany => {
    const list = partnerService.getPartners();
    const cleanCode = partner.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    if (!cleanCode) {
      throw new Error('O código de indicação do parceiro é obrigatório.');
    }

    const exists = list.some(p => p.code.toUpperCase() === cleanCode);
    if (exists) {
      throw new Error(`Já existe um parceiro com o código "${cleanCode}".`);
    }

    const newPartner: PartnerCompany = {
      ...partner,
      id: 'partner_' + Math.random().toString(36).substring(2, 9),
      code: cleanCode,
      partnerEmail: partner.partnerEmail ? partner.partnerEmail.trim().toLowerCase() : undefined,
      createdAt: new Date().toISOString(),
      activatedUsersCount: 0
    };

    list.unshift(newPartner);
    partnerService.savePartners(list);
    return newPartner;
  },

  updatePartner: (id: string, updates: Partial<PartnerCompany>): PartnerCompany | null => {
    const list = partnerService.getPartners();
    const index = list.findIndex(p => p.id === id);
    if (index < 0) return null;

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    }
    if (updates.partnerEmail !== undefined) {
      updates.partnerEmail = updates.partnerEmail ? updates.partnerEmail.trim().toLowerCase() : undefined;
    }

    list[index] = { ...list[index], ...updates };
    partnerService.savePartners(list);
    return list[index];
  },

  deletePartner: (id: string): boolean => {
    const list = partnerService.getPartners();
    const filtered = list.filter(p => p.id !== id);
    partnerService.savePartners(filtered);
    return true;
  },

  validateCode: (code: string, userEmail?: string): { 
    valid: boolean; 
    partner?: PartnerCompany; 
    isPartnerAccount?: boolean; 
    message: string 
  } => {
    if (!code || !code.trim()) {
      return { valid: false, message: 'Digite o código de indicação do parceiro.' };
    }

    const clean = code.trim().toUpperCase();
    const list = partnerService.getPartners();
    const partner = list.find(p => p.code.toUpperCase() === clean);

    if (!partner) {
      return { valid: false, message: 'Código de indicação não encontrado ou inválido.' };
    }

    if (!partner.active) {
      return { valid: false, message: 'Este convênio de parceria está temporariamente pausado.' };
    }

    // Verifica se quem está usando é o próprio parceiro dono do e-mail cadastrado
    const isSelfPartner = !!(
      userEmail && 
      partner.partnerEmail && 
      userEmail.trim().toLowerCase() === partner.partnerEmail.trim().toLowerCase()
    );

    if (isSelfPartner) {
      return { 
        valid: true, 
        partner, 
        isPartnerAccount: true,
        message: `Conta VIP de Parceiro (${partner.name}) reconhecida! Seu acesso gratuito será ativado.` 
      };
    }

    return { 
      valid: true, 
      partner, 
      isPartnerAccount: false,
      message: `Indicação do parceiro ${partner.name} reconhecida! Crie sua conta e aproveite 7 dias de teste grátis.` 
    };
  },

  incrementUsage: (code: string) => {
    const clean = code.trim().toUpperCase();
    const list = partnerService.getPartners();
    const partner = list.find(p => p.code.toUpperCase() === clean);
    if (partner) {
      partner.activatedUsersCount = (partner.activatedUsersCount || 0) + 1;
      partnerService.savePartners(list);
    }
  },

  generateReferralLink: (code: string): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://orcafacil.com.br';
    return `${origin}/?ref=${encodeURIComponent(code.trim().toUpperCase())}`;
  },

  generateWhatsAppMessage: (partner: PartnerCompany): string => {
    const link = partnerService.generateReferralLink(partner.code);
    return encodeURIComponent(
      `Olá! Estou usando e recomendo o *OrçaFácil* para criação de orçamentos e contratos profissionais com envio rápido em PDF pelo WhatsApp.\n\nAcesse pelo meu link exclusivo de parceiro para começar com 7 dias de teste grátis:\n${link}\n\nCódigo de indicação: *${partner.code}*`
    );
  }
};
