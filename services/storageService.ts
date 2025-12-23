
import { CatalogItem, Quote, ProviderInfo } from '../types';
import { apiService } from './api.service';

export const storageService = {
  // Catalog (Produtos e Serviços)
  getCatalog: async (): Promise<CatalogItem[]> => {
    const response = await apiService.get<any>('/products');
    
    // Tratamento para diferentes formatos de resposta da API
    if (Array.isArray(response)) return response;
    if (response && typeof response === 'object') {
      if (Array.isArray(response.products)) return response.products;
      if (Array.isArray(response.data)) return response.data;
    }
    
    return [];
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

  saveCatalog: async (items: CatalogItem[]) => {
    localStorage.setItem('orcafacil_catalog', JSON.stringify(items));
  },

  // Quotes (Orçamentos)
  getQuotes: async (): Promise<Quote[]> => {
    const response = await apiService.get<any>('/quotes');
    
    if (Array.isArray(response)) return response;
    if (response && typeof response === 'object') {
      if (Array.isArray(response.quotes)) return response.quotes;
      if (Array.isArray(response.data)) return response.data;
    }
    
    return [];
  },
  
  saveQuote: async (quote: Quote): Promise<Quote> => {
    // Se o ID for um UUID recém gerado (36 chars), enviamos como POST
    if (quote.id.length > 20) { 
       return apiService.post<Quote>('/quotes', quote);
    }
    return apiService.put<Quote>(`/quotes/${quote.id}`, quote);
  },
  
  deleteQuote: async (id: string): Promise<void> => {
    return apiService.delete(`/quotes/${id}`);
  },

  // Provider Info (Dados do Profissional)
  getProviderInfo: async (): Promise<ProviderInfo> => {
    try {
      return await apiService.get<ProviderInfo>('/provider');
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
