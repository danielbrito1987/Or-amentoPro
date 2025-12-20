
export enum ItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE'
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: ItemType;
  unit?: string; // e.g., "un", "m", "h"
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
}

export interface ProviderInfo {
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
}
