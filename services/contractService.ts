import { Contract, ContractSignature, Quote, ProviderInfo } from '../types';
import { supabase } from './supabaseClient';
import { getProviderInfo } from './storageService';

const STORAGE_KEY_CONTRACTS = 'orca_facil_contracts';

export const contractService = {
  getAllContracts: (): Contract[] => {
    const data = localStorage.getItem(STORAGE_KEY_CONTRACTS);
    if (data) {
      try { return JSON.parse(data); } catch (e) {}
    }
    return [];
  },

  saveContracts: (contracts: Contract[]) => {
    localStorage.setItem(STORAGE_KEY_CONTRACTS, JSON.stringify(contracts));
  },

  createContractFromQuote: async (quote: Quote, customProvider?: ProviderInfo): Promise<Contract> => {
    const provider = customProvider || getProviderInfo();
    const now = new Date();
    const year = now.getFullYear();
    const existing = contractService.getAllContracts();
    const nextSeq = String(existing.length + 1).padStart(3, '0');
    const contractNumber = `CONT-${year}-${nextSeq}`;

    const itemsDescription = quote.items
      .map(i => `• ${i.name} (Qtd: ${i.quantity}) - R$ ${i.total.toFixed(2).replace('.', ',')}`)
      .join('\n');

    const defaultClauses = `INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS

CONTRATADA:
${provider.name || 'EMPRESA PRESTADORA'}, inscrito(a) sob o CNPJ/CPF ${provider.document || 'Não informado'}, com sede em ${provider.address || 'Não informado'}, telefone ${provider.phone || 'Não informado'} e e-mail ${provider.email || 'Não informado'}.

CONTRATANTE:
${quote.clientName}, inscrito(a) sob o CPF/CNPJ ${quote.clientDocument || 'Não informado'}, residente/sediado(a) em ${quote.clientAddress || 'Não informado'}, telefone ${quote.clientPhone || 'Não informado'} e e-mail ${quote.clientEmail || 'Não informado'}.

CLÁUSULA PRIMEIRA - DO OBJETO
O presente instrumento tem por objeto a prestação dos serviços e fornecimento de materiais conforme especificado no Orçamento nº ${quote.number} ("${quote.title}"):
${itemsDescription}

CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO
Pela prestação dos serviços, a CONTRATANTE pagará à CONTRATADA o valor total de R$ ${quote.total.toFixed(2).replace('.', ',')} (${quote.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).
Condições de pagamento: ${quote.paymentTerms || 'A combinar entre as partes'}.
${provider.pixKey ? `Chave PIX para pagamento (${provider.pixType.toUpperCase()}): ${provider.pixKey}` : ''}

CLÁUSULA TERCEIRA - DA ASSINATURA ELETRÔNICA
As partes reconhecem a plena validade jurídica da assinatura eletrônica deste documento por meios digitais (rubrica digital, IP e carimbo temporal), nos termos da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020.`;

    const signatures: ContractSignature[] = [
      {
        signerType: 'provider',
        name: provider.name || 'Responsável pela Contratada',
        document: provider.document || '',
        email: provider.email || '',
        status: 'pending',
        signedAt: ''
      },
      {
        signerType: 'client',
        name: quote.clientName,
        document: quote.clientDocument || '',
        email: quote.clientEmail || '',
        status: 'pending',
        signedAt: ''
      }
    ];

    const newContract: Contract = {
      id: 'contract_' + Date.now().toString(36),
      contractNumber,
      quoteId: quote.id,
      quoteNumber: quote.number,
      userEmail: provider.email || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: 'pending_signatures',
      providerName: provider.name || 'Prestador de Serviços',
      providerDocument: provider.document || '',
      providerAddress: provider.address || '',
      providerEmail: provider.email || '',
      providerPhone: provider.phone || '',
      clientName: quote.clientName,
      clientDocument: quote.clientDocument || '',
      clientAddress: quote.clientAddress || '',
      clientEmail: quote.clientEmail || '',
      clientPhone: quote.clientPhone || '',
      title: `Contrato de Prestação de Serviços - ${quote.title}`,
      totalValue: quote.total,
      paymentTerms: quote.paymentTerms || '',
      content: defaultClauses,
      signatures
    };

    const updated = [newContract, ...existing];
    contractService.saveContracts(updated);

    try {
      await supabase.from('contracts').upsert(newContract);
    } catch (err) {}

    return newContract;
  },

  signContract: async (
    contractId: string, 
    signerType: 'provider' | 'client', 
    signatureDataUrl: string, 
    name?: string, 
    doc?: string
  ): Promise<Contract | null> => {
    const contracts = contractService.getAllContracts();
    const index = contracts.findIndex(c => c.id === contractId);
    if (index === -1) return null;

    const contract = { ...contracts[index] };
    const now = new Date().toISOString();

    contract.signatures = contract.signatures.map(sig => {
      if (sig.signerType === signerType) {
        return {
          ...sig,
          name: name || sig.name,
          document: doc || sig.document,
          signatureDataUrl,
          signedAt: now,
          status: 'signed',
          ipAddress: '177.136.24.102'
        };
      }
      return sig;
    });

    const allSigned = contract.signatures.every(s => s.status === 'signed');
    contract.status = allSigned ? 'signed' : 'partially_signed';
    contract.updatedAt = now;

    contracts[index] = contract;
    contractService.saveContracts(contracts);

    try {
      await supabase.from('contracts').upsert(contract);
    } catch (e) {}

    return contract;
  },

  deleteContract: async (contractId: string) => {
    const contracts = contractService.getAllContracts().filter(c => c.id !== contractId);
    contractService.saveContracts(contracts);
    try {
      await supabase.from('contracts').delete().eq('id', contractId);
    } catch (e) {}
  }
};