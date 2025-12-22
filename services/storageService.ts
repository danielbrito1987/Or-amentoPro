
import { CatalogItem, Quote, ProviderInfo } from '../types';
import { api } from './api.service';

const KEYS = {
  CATALOG: 'orcafacil_catalog',
  QUOTES: 'orcafacil_quotes',
  PROVIDER: 'orcafacil_user'
};

export const storageService = {
  // Catalog
  getCatalog: async (companyId: string): Promise<CatalogItem[]> => {
    const data = await api.get<CatalogItem[]>(`api/products/${companyId}`);
    return data ? data : [];
  },
  saveCatalog: async (companyId: string, item: CatalogItem) => {
    var product = {
      companyId: companyId,
      name: item.name,
      description: item.description,
      type: item.type,
      value: item.price,
      unit: item.unit
    }

    await api.post('api/products', product);
  },

  // Quotes
  getQuotes: async (companyId: string): Promise<Quote[]> => {
    const response = await api.get<Quote[]>(`api/budgets/${companyId}`);

    return response ? response : [];
  },
  saveQuote: async (quote: Quote, companyId: string) => {
    const quotes = await storageService.getQuotes(companyId);
    const index = quotes.findIndex(q => q.id === quote.id);
    if (index >= 0) {
      quotes[index] = quote;
    } else {
      quotes.unshift(quote);
    }
    localStorage.setItem(KEYS.QUOTES, JSON.stringify(quotes));
  },
  deleteQuote: async (id: string, companyId: string) => {
    const response = await storageService.getQuotes(companyId);
    const quotes = response.filter(q => q.id !== id);
    localStorage.setItem(KEYS.QUOTES, JSON.stringify(quotes));
  },

  // Provider Info
  getProviderInfo: (): ProviderInfo => {
    const data = localStorage.getItem(KEYS.PROVIDER);
    return data ? JSON.parse(data) : {
      name: 'Minha Empresa',
      document: '',
      phone: '',
      email: '',
      address: ''
    };
  },
  saveProviderInfo: (info: ProviderInfo) => {
    localStorage.setItem(KEYS.PROVIDER, JSON.stringify(info));
  }
};
