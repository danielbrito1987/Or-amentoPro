
export enum ItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE'
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  value: number;
  type: ItemType;
  unit?: string; // e.g., "un", "m", "h"
  companyId?: string;
}

export interface QuoteItem extends CatalogItem {
  quantity: number;
}

export interface Quote {
  id: string;
  number: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  items: QuoteItem[];
  total: number;
  notes: string;
  providerInfo: ProviderInfo;
  companyId?: string;
}

export interface ProviderInfo {
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  logo?: string; // Base64 string
  companyId?: string;
}

export interface User {
  sub: string;
  email: string;
  name: string;
  companyId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
