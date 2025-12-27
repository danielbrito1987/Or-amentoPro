
export enum ItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE'
}

export interface CatalogItem {
  id: string;
  description: string;
  price: number;
  type: ItemType;
  unit?: string; // e.g., "un", "m", "h"
  companyId?: string;
}

export interface QuoteItem extends CatalogItem {
  quantity: number;
  unit?: string;
  description: string;
}

export interface Quote {
  id: string;
  number: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  address: string;
  city: string;
  state: string;
  items: QuoteItem[];
  total: number;
  notes: string;
  providerInfo: ProviderInfo;
  companyId?: string;
  createdAt: string;
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
