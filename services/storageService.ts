
import { CatalogItem, Quote, ProviderInfo } from '../types';
import { apiService } from './api.service';

// Função auxiliar para extrair arrays de respostas de API que podem vir embrulhadas
const extractArray = (response: any, keys: string[]): any[] => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== 'object') return [];
  
  // Procura nas chaves conhecidas
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key];
  }
  
  // Se não encontrou, procura qualquer chave que contenha um array (profundidade 1)
  const firstArrayKey = Object.keys(response).find(key => Array.isArray(response[key]));
  if (firstArrayKey) return response[firstArrayKey];
  
  return [];
};

// Garante que o item tenha um campo 'id' mesmo que a API retorne '_id'
const mapId = (item: any): any => {
  if (!item) return item;
  if (item._id && !item.id) {
    return { ...item, id: item._id };
  }
  return item;
};

export const storageService = {
  // Catalog (Produtos e Serviços)
  getCatalog: async (companyId: string): Promise<CatalogItem[]> => {
    try {
      // O companyId é obrigatório para garantir multi-tenancy
      const endpoint = `/products/${companyId}`;
      const response = await apiService.get<any>(endpoint);
      const items = extractArray(response, ['products', 'data', 'items', 'results', 'content']);
      return items.map(mapId);
    } catch (error) {
      console.error("Erro ao buscar catálogo:", error);
      return [];
    }
  },
  
  saveCatalogItem: async (item: CatalogItem): Promise<CatalogItem> => {
    return apiService.post<CatalogItem>('/products', item);
  },
  
  updateCatalogItem: async (item: CatalogItem): Promise<CatalogItem> => {
    return apiService.put<CatalogItem>(`/products/${item.id}`, item);
  },

  deleteCatalogItem: async (id: string): Promise<void> => {
    return apiService.delete(`/products/${id}`);
  },

  // Quotes (Orçamentos)
  getQuotes: async (companyId: string): Promise<Quote[]> => {
    try {
      const endpoint = `/quotes?companyId=${companyId}`;
      const response = await apiService.get<any>(endpoint);
      const quotes = extractArray(response, ['quotes', 'data', 'items', 'results']);
      return quotes.map(mapId);
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      return [];
    }
  },
  
  saveQuote: async (quote: Quote): Promise<Quote> => {
    // Se o ID for longo (UUID v4), tratamos como novo
    if (quote.id && quote.id.length > 20) { 
       return apiService.post<Quote>('/quotes', quote);
    }
    return apiService.put<Quote>(`/quotes/${quote.id}`, quote);
  },
  
  deleteQuote: async (id: string): Promise<void> => {
    return apiService.delete(`/quotes/${id}`);
  },

  // Provider Info (Dados do Profissional)
  getProviderInfo: async (companyId: string): Promise<ProviderInfo> => {
    try {
      const endpoint = `/provider?companyId=${companyId}`;
      const response = await apiService.get<any>(endpoint);
      // Se a resposta for um array, pega o primeiro registro da empresa
      const data = Array.isArray(response) ? response[0] : response;
      return mapId(data);
    } catch (e) {
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
