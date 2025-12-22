
import { CatalogItem, Quote, ProviderInfo } from '../types';
import { apiService } from './api.service';

export const storageService = {
  // Catalog
  getCatalog: async (companyId: string): Promise<CatalogItem[]> => {
    return apiService.get<CatalogItem[]>(`/catalog/${companyId}`);
  },
  
  saveCatalogItem: async (item: CatalogItem): Promise<CatalogItem> => {
    return apiService.post<CatalogItem>('/catalog', item);
  },
  
  updateCatalogItem: async (item: CatalogItem): Promise<CatalogItem> => {
    return apiService.put<CatalogItem>(`/catalog/${item.id}`, item);
  },

  saveCatalog: async (items: CatalogItem[]) => {
    // Mantemos compatibilidade local se necessário, mas a API é a fonte da verdade
    localStorage.setItem('orcafacil_catalog', JSON.stringify(items));
  },

  // Quotes
  getQuotes: async (companyId: string): Promise<Quote[]> => {
    return apiService.get<Quote[]>(`/budgets/${companyId}`);
  },
  
  saveQuote: async (quote: Quote): Promise<Quote> => {
    // Decide se é criação ou atualização com base na existência remota
    // Assumindo que o backend trata o POST como create/update ou tem rotas específicas
    if (quote.id.length > 20) { // Exemplo simples para diferenciar novos IDs de existentes se necessário
       return apiService.post<Quote>('/budgets', quote);
    }
    return apiService.put<Quote>(`/budgets/${quote.id}`, quote);
  },
  
  deleteQuote: async (id: string): Promise<void> => {
    return apiService.delete(`/budgets/${id}`);
  },

  // Provider Info
  getProviderInfo: async (companyId: string): Promise<ProviderInfo> => {
    try {
      return await apiService.get<ProviderInfo>(`/companies/${companyId}`);
    } catch (e) {
      // Fallback para dados locais se o perfil não estiver no banco ainda
      const local = localStorage.getItem('orcafacil_provider');
      return local ? JSON.parse(local) : {
        name: 'Minha Empresa',
        document: '',
        phone: '',
        email: '',
        address: ''
      };
    }
  },
  
  saveProviderInfo: async (info: ProviderInfo): Promise<ProviderInfo> => {
    localStorage.setItem('orcafacil_provider', JSON.stringify(info));
    return apiService.post<ProviderInfo>('/provider', info);
  }
};
