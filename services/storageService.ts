
import { CatalogItem, Quote, ProviderInfo } from '../types';

const KEYS = {
  CATALOG: 'orcafacil_catalog',
  QUOTES: 'orcafacil_quotes',
  PROVIDER: 'orcafacil_provider'
};

export const storageService = {
  // Catalog
  getCatalog: (): CatalogItem[] => {
    const data = localStorage.getItem(KEYS.CATALOG);
    return data ? JSON.parse(data) : [];
  },
  saveCatalog: (items: CatalogItem[]) => {
    localStorage.setItem(KEYS.CATALOG, JSON.stringify(items));
  },

  // Quotes
  getQuotes: (): Quote[] => {
    const data = localStorage.getItem(KEYS.QUOTES);
    return data ? JSON.parse(data) : [];
  },
  saveQuote: (quote: Quote) => {
    const quotes = storageService.getQuotes();
    const index = quotes.findIndex(q => q.id === quote.id);
    if (index >= 0) {
      quotes[index] = quote;
    } else {
      quotes.unshift(quote);
    }
    localStorage.setItem(KEYS.QUOTES, JSON.stringify(quotes));
  },
  deleteQuote: (id: string) => {
    const quotes = storageService.getQuotes().filter(q => q.id !== id);
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
