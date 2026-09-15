
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
  companyId?: string;
}

export interface QuoteItem extends CatalogItem {
  quantity: number;
}

export type QuoteStatus = 'draft' | 'pending' | 'approved' | 'rejected';

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
  status?: QuoteStatus;
  contractId?: string;
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

export interface SubscriptionInfo {
  status: 'trial' | 'active' | 'expired';
  trialEndsAt: string; // ISO String
  planPrice: number; // 59.90
  activeUntil?: string; // ISO String se pago
  paymentMethod?: 'pix_manual' | 'pix' | 'other';
  pixKey?: string;
  pixReceiver?: string;
  whatsappConfirmationPhone?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  companyId?: string;
  status?: 'active' | 'suspended';
  statusReason?: string;
  role?: 'admin' | 'user' | string;
  createdAt?: string;
  trialEndsAt?: string;
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'partner';
  subscriptionValidUntil?: string;
  plan?: 'basic' | 'pro' | 'premium';
  billingCycle?: 'monthly' | 'annual';
  partnerCompany?: string;
  partnerCode?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface PriceSuggestion {
  serviceName: string;
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  unit: string;
  quantity?: number;
  unitPrice?: number;
  estimatedHours?: string;
  justification: string;
  tips?: string[];
}

export type TabType = 'dashboard' | 'quotes' | 'contracts' | 'products' | 'settings';

export interface ContractSignature {
  signerType: 'provider' | 'client';
  name: string;
  document: string;
  email?: string;
  phone?: string;
  signatureDataUrl?: string; // Desenho da rubrica no canvas em base64 PNG
  signedAt: string; // Data e hora no formato ISO
  ipAddress?: string;
  userAgent?: string;
  status: 'pending' | 'signed';
  hash?: string;
}

export interface Contract {
  id: string;
  contractNumber: string; // Ex: CONT-2026-0001
  quoteId: string;
  quoteNumber: string;
  userEmail: string; // E-mail do proprietário da conta
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'pending_signatures' | 'partially_signed' | 'signed' | 'cancelled';
  // Dados da Contratada (Prestador)
  providerName: string;
  providerDocument: string;
  providerAddress: string;
  providerEmail: string;
  providerPhone: string;
  // Dados do Contratante (Cliente)
  clientName: string;
  clientDocument: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  clientCity?: string;
  clientState?: string;
  // Conteúdo Jurídico e Assinaturas
  title: string;
  totalValue: number;
  paymentTerms: string;
  deadline?: string;
  content: string; // Texto completo com as cláusulas
  signatures: ContractSignature[];
}