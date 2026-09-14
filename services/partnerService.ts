// Gerenciamento das Empresas Parceiras e Cupons de Acesso Liberado

export interface PartnerCompany {
  id: string;
  code: string; // Código em maiúsculo (ex: ELETROMAT, TINTASMAX, CASADOPAULISTA)
  name: string; // Nome fantasia da empresa parceira (ex: "EletroMateriais São Paulo")
  contactPerson?: string; // Nome do contato (ex: "Roberto Gerente")
  phone?: string; // Telefone/WhatsApp da empresa parceira
  notes?: string; // Detalhes da parceria (ex: "Fornece 5% desc aos nossos usuários em troca do app liberado")
  active: boolean; // Se a parceria está ativa
  createdAt: string;
  activatedUsersCount: number; // Quantos usuários já ativaram com este código
  accessType: 'vitalicio' | 'dias'; // Tipo de acesso
  accessDays?: number; // Se for por dias (ex: 365 para 1 ano)
}

const PARTNERS_STORAGE_KEY = 'orcafacil_partners_registry';

export const partnerService = {
  getPartners: (): PartnerCompany[] => {
    try {
      const raw = localStorage.getItem(PARTNERS_STORAGE_KEY);
      if (!raw) {
        // Inicializa com parceiros padrão de exemplo para já vir pré-configurado
        const defaultPartners: PartnerCompany[] = [
          {
            id: 'partner_eletro',
            code: 'PARCEIRO-VIP',
            name: 'Parceiro Comercial Modelo',
            contactPerson: 'Gerência Comercial',
            phone: '(11) 99999-0000',
            notes: 'Acesso VIP gratuito liberado para parceiros estratégicos',
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

  addPartner: (partner: Omit<PartnerCompany, 'id' | 'createdAt' | 'activatedUsersCount'>): PartnerCompany => {
    const list = partnerService.getPartners();
    const cleanCode = partner.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    if (!cleanCode) {
      throw new Error('O código de parceiro é obrigatório.');
    }

    const exists = list.some(p => p.code.toUpperCase() === cleanCode);
    if (exists) {
      throw new Error(`Já existe uma empresa parceira com o código "${cleanCode}".`);
    }

    const newPartner: PartnerCompany = {
      ...partner,
      id: 'partner_' + Math.random().toString(36).substring(2, 9),
      code: cleanCode,
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

  validateCode: (code: string): { valid: boolean; partner?: PartnerCompany; message: string } => {
    if (!code || !code.trim()) {
      return { valid: false, message: 'Digite o código de parceria.' };
    }

    const clean = code.trim().toUpperCase();
    const list = partnerService.getPartners();
    const partner = list.find(p => p.code.toUpperCase() === clean);

    if (!partner) {
      return { valid: false, message: 'Código de parceria não encontrado ou inválido.' };
    }

    if (!partner.active) {
      return { valid: false, message: 'Este convênio de parceria está temporariamente inativo.' };
    }

    return { 
      valid: true, 
      partner, 
      message: `Código válido! Parceria com ${partner.name} reconhecida.` 
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
  }
};
