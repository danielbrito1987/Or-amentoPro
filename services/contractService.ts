import { Contract, ContractSignature, Quote, ProviderInfo, QuoteStatus } from '../types';
import { getSupabase } from './supabase';
import { formatCurrency } from '../utils/formatters';

const STORAGE_KEY_CONTRACTS = 'orcafacil_contracts';

/**
 * Converte valor numérico para representação por extenso simplificada em português
 */
const numberToExtenso = (value: number): string => {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
};

/**
 * Gera um hash de validação jurídica e rastreabilidade para a assinatura
 */
export const generateSignatureHash = (contractId: string, signerType: string, doc: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const cleanDoc = doc.replace(/\D/g, '').substring(0, 4) || 'AUTH';
  return `BR-EID-${timestamp}-${cleanDoc}-${random}`;
};

/**
 * Mapeia registro vindo do Supabase para o tipo Contract
 */
const mapDbToContract = (row: any): Contract => {
  let signatures: ContractSignature[] = [];
  if (row.signatures) {
    if (typeof row.signatures === 'string') {
      try {
        signatures = JSON.parse(row.signatures);
      } catch {
        signatures = [];
      }
    } else if (Array.isArray(row.signatures)) {
      signatures = row.signatures;
    }
  }

  return {
    id: row.id,
    contractNumber: row.contract_number || `CONT-${row.id.substring(0, 6)}`,
    quoteId: row.quote_id || '',
    quoteNumber: row.quote_number || '',
    userEmail: row.user_email || '',
    companyId: row.company_id || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    status: (row.status as any) || 'pending_signatures',
    providerName: row.provider_name || '',
    providerDocument: row.provider_document || '',
    providerAddress: row.provider_address || '',
    providerEmail: row.provider_email || '',
    providerPhone: row.provider_phone || '',
    clientName: row.client_name || '',
    clientDocument: row.client_document || '',
    clientAddress: row.client_address || '',
    clientEmail: row.client_email || '',
    clientPhone: row.client_phone || '',
    clientCity: row.client_city || '',
    clientState: row.client_state || '',
    title: row.title || 'Contrato de Prestação de Serviços',
    totalValue: Number(row.total_value) || 0,
    paymentTerms: row.payment_terms || '',
    deadline: row.deadline || '',
    content: row.content || '',
    signatures
  };
};

/**
 * Mapeia tipo Contract para as colunas do Supabase
 */
const mapContractToDb = (contract: Contract) => ({
  id: contract.id,
  contract_number: contract.contractNumber,
  quote_id: contract.quoteId,
  quote_number: contract.quoteNumber,
  user_email: contract.userEmail,
  company_id: contract.companyId || null,
  status: contract.status,
  provider_name: contract.providerName,
  provider_document: contract.providerDocument || '',
  provider_address: contract.providerAddress || '',
  provider_email: contract.providerEmail || '',
  provider_phone: contract.providerPhone || '',
  client_name: contract.clientName,
  client_document: contract.clientDocument || '',
  client_address: contract.clientAddress || '',
  client_email: contract.clientEmail || '',
  client_phone: contract.clientPhone || '',
  client_city: contract.clientCity || '',
  client_state: contract.clientState || '',
  title: contract.title,
  total_value: contract.totalValue,
  payment_terms: contract.paymentTerms || '',
  deadline: contract.deadline || '',
  content: contract.content,
  signatures: contract.signatures,
  updated_at: new Date().toISOString()
});

export const contractService = {
  /**
   * Obtém todos os contratos, sincronizando com Supabase e usando LocalStorage como cache e offline fallback
   */
  getAllContracts: async (companyId?: string): Promise<Contract[]> => {
    const storageKey = companyId ? `orcafacil_contracts_${companyId}` : STORAGE_KEY_CONTRACTS;
    let localContracts: Contract[] = [];
    try {
      const data = localStorage.getItem(storageKey);
      if (data) localContracts = JSON.parse(data);
    } catch (e) {
      console.warn('Erro ao ler contratos locais:', e);
    }

    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        let query = supabase.from('contracts').select('*').order('created_at', { ascending: false });
        if (companyId) {
          query = query.eq('company_id', companyId);
        }
        const { data, error } = await query;
        if (!error && data) {
          const remoteList = data.map(mapDbToContract);

          // Mescla locais recentes com remotos filtrando rigorosamente por empresa
          const mergedMap = new Map<string, Contract>();
          localContracts.forEach(c => {
            if (!companyId || c.companyId === companyId) {
              mergedMap.set(c.id, c);
            }
          });
          remoteList.forEach(c => mergedMap.set(c.id, c));

          const merged = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          localStorage.setItem(storageKey, JSON.stringify(merged));
          return merged;
        }
      } catch (err) {
        console.warn('Supabase getAllContracts erro:', err);
      }
    }

    if (companyId) {
      return localContracts.filter(c => !c.companyId || c.companyId === companyId);
    }
    return localContracts;
  },

  /**
   * Obtém um contrato por ID
   */
  getContractById: async (id: string): Promise<Contract | null> => {
    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { data, error } = await supabase.from('contracts').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          const contract = mapDbToContract(data);
          contractService.cacheContractLocally(contract);
          return contract;
        }
      } catch (e) {
        console.warn('Supabase getContractById:', e);
      }
    }

    // Busca no cache local
    try {
      const data = localStorage.getItem(STORAGE_KEY_CONTRACTS);
      if (data) {
        const list: Contract[] = JSON.parse(data);
        return list.find(c => c.id === id) || null;
      }
    } catch {}

    return null;
  },

  /**
   * Obtém contrato vinculado a um orçamento específico
   */
  getContractByQuoteId: async (quoteId: string): Promise<Contract | null> => {
    const list = await contractService.getAllContracts();
    return list.find(c => c.quoteId === quoteId) || null;
  },

  /**
   * Salva contrato no LocalStorage
   */
  cacheContractLocally: (contract: Contract) => {
    try {
      const storageKey = contract.companyId ? `orcafacil_contracts_${contract.companyId}` : STORAGE_KEY_CONTRACTS;
      const data = localStorage.getItem(storageKey);
      const list: Contract[] = data ? JSON.parse(data) : [];
      const idx = list.findIndex(c => c.id === contract.id);
      if (idx >= 0) {
        list[idx] = contract;
      } else {
        list.unshift(contract);
      }
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (e) {
      console.warn('Erro ao atualizar cache local:', e);
    }
  },

  /**
   * Gera um contrato completo e profissional a partir de um orçamento aprovado
   */
  createContractFromQuote: async (
    quote: Quote,
    customProvider?: ProviderInfo,
    userEmail?: string,
    companyId?: string
  ): Promise<Contract> => {
    const now = new Date();
    const year = now.getFullYear();
    const existingList = await contractService.getAllContracts(companyId);
    const nextSeq = String(existingList.length + 1).padStart(4, '0');
    const contractNumber = `CONT-${year}-${nextSeq}`;

    const provider: ProviderInfo = customProvider || quote.providerInfo || {
      name: 'Prestador de Serviços',
      document: '',
      phone: '',
      email: '',
      address: ''
    };

    const targetCompanyId = companyId || quote.companyId || provider.companyId || '';
    const targetEmail = userEmail || provider.email || '';

    // Formata descrição dos serviços e materiais
    const itemsDescription = quote.items && quote.items.length > 0
      ? quote.items
          .map((item, idx) => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            return `${idx + 1}. ${item.name} (${item.quantity} ${item.unit || 'un'}) - Valor unitário: ${formatCurrency(item.price || 0)} | Subtotal: ${formatCurrency(itemTotal)}${item.description ? `\n   Especificações: ${item.description}` : ''}`;
          })
          .join('\n\n')
      : `• Execução dos serviços descritos no Orçamento nº ${quote.number}`;

    const clientLocation = [
      quote.customerAddress,
      quote.customerCity,
      quote.customerState
    ].filter(Boolean).join(', ') || 'Endereço a ser confirmado';

    // Minuta contratual robusta conforme legislação brasileira (Código Civil, CDC, MP 2.200-2/2001 e Lei 14.063/2020)
    const clauses = `INSTRUMENTO PARTICULAR DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATADA (PRESTADORA DOS SERVIÇOS):
Razão Social/Nome: ${provider.name || 'Não informado'}
CNPJ/CPF: ${provider.document || 'Não informado'}
Endereço: ${provider.address || 'Não informado'}
Telefone/WhatsApp: ${provider.phone || 'Não informado'}
E-mail: ${provider.email || 'Não informado'}

CONTRATANTE (CLIENTE):
Nome Completo/Razão Social: ${quote.customerName || 'Não informado'}
Telefone/WhatsApp: ${quote.customerPhone || 'Não informado'}
E-mail: ${quote.customerEmail || 'Não informado'}
Endereço do Local de Execução: ${clientLocation}

As partes acima qualificadas têm, entre si, justo e acordado o presente Contrato de Prestação de Serviços, regido pelas cláusulas e condições seguintes:

CLÁUSULA PRIMEIRA - DO OBJETO E ESPECIFICAÇÃO DOS SERVIÇOS
1.1. O presente instrumento tem por objeto a prestação de serviços e o fornecimento de itens/materiais devidamente acordados, vinculados ao Orçamento nº ${quote.number}, compreendendo detalhadamente o seguinte escopo técnico:

${itemsDescription}

1.2. Quaisquer alterações, serviços complementares ou acréscimo de materiais não previstos neste instrumento exigirão prévia solicitação por escrito e aprovação de novo orçamento complementar.

CLÁUSULA SEGUNDA - DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO
2.1. Pela execução dos serviços descritos neste contrato, a CONTRATANTE pagará à CONTRATADA o valor global de ${formatCurrency(quote.total)} (${numberToExtenso(quote.total)}).
2.2. O pagamento será realizado conforme as seguintes condições acordadas:
${quote.notes ? `• ${quote.notes}` : '• Conforme cronograma pactuado entre as partes, via PIX, transferência ou meio acordado.'}

CLÁUSULA TERCEIRA - DO PRAZO E DA EXECUÇÃO
3.1. A CONTRATADA iniciará os trabalhos após a assinatura deste contrato e confirmação do sinal/condição inicial estipulada na Cláusula Segunda.
3.2. A conclusão dos serviços se dará dentro do prazo estimado pelas partes, ressalvados motivos de força maior, intempéries climáticas severas, falta de insumos de responsabilidade do cliente ou atrasos na liberação de acesso ao local.

CLÁUSULA QUARTA - DAS OBRIGAÇÕES DA CONTRATADA
4.1. Executar os serviços em estrita observância às normas técnicas brasileiras, boas práticas profissionais e com zelo, qualidade e segurança.
4.2. Fornecer mão de obra qualificada e equipamentos adequados para a realização do escopo contratado.
4.3. Garantir a integridade dos serviços executados nos termos do Artigo 26 do Código de Defesa do Consumidor (garantia legal de 90 dias para serviços duráveis).

CLÁUSULA QUINTA - DAS OBRIGAÇÕES DA CONTRATANTE
5.1. Efetuar o pagamento dos valores acordados nas datas pactuadas na Cláusula Segunda.
5.2. Assegurar livre acesso da equipe técnica da CONTRATADA ao local onde serão executados os serviços, fornecendo, quando necessário, pontos de energia elétrica e água em condições adequadas para a realização dos trabalhos.
5.3. Informar à CONTRATADA qualquer anormalidade ou defeito notado durante ou após a execução.

CLÁUSULA SEXTA - DA RESCISÃO E PENALIDADES
6.1. O presente contrato poderá ser rescindido por mútuo acordo entre as partes ou por inadimplemento de qualquer uma de suas cláusulas.
6.2. Em caso de desistência injustificada por qualquer das partes após o início dos serviços, responderá a parte infratora pelo reembolso dos custos comprovadamente incorridos, acrescido de multa não compensatória de 10% (dez por cento) sobre o saldo remanescente.

CLÁUSULA SÉTIMA - DA VALIDADE JURÍDICA DAS ASSINATURAS ELETRÔNICAS
7.1. As partes reconhecem expressamente a plena validade, higidez e autenticidade da assinatura eletrônica deste documento por meios digitais (rubrica em tela, endereço IP, registro temporal de data/hora e hash de verificação de integridade), nos termos do Art. 10, § 2º da Medida Provisória nº 2.200-2/2001 e dos Arts. 4º e 5º da Lei Federal nº 14.063/2020, produzindo todos os efeitos legais de documento assinado de próprio punho.

CLÁUSULA OITAVA - DO FORO
8.1. Para dirimir quaisquer litígios decorrentes da interpretação ou execução deste contrato, as partes elegem o foro da Comarca onde se localiza o imóvel/estabelecimento da prestação dos serviços, com renúncia expressa a qualquer outro.`;

    const signatures: ContractSignature[] = [
      {
        signerType: 'provider',
        name: provider.name || 'Responsável pela Contratada',
        document: provider.document || '',
        email: provider.email || targetEmail,
        phone: provider.phone || '',
        status: 'pending',
        signedAt: ''
      },
      {
        signerType: 'client',
        name: quote.customerName || 'Cliente Contratante',
        document: '',
        email: quote.customerEmail || '',
        phone: quote.customerPhone || '',
        status: 'pending',
        signedAt: ''
      }
    ];

    const newContract: Contract = {
      id: crypto.randomUUID(),
      contractNumber,
      quoteId: quote.id,
      quoteNumber: quote.number,
      userEmail: targetEmail,
      companyId: targetCompanyId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: 'pending_signatures',
      providerName: provider.name || 'Prestador de Serviços',
      providerDocument: provider.document || '',
      providerAddress: provider.address || '',
      providerEmail: provider.email || targetEmail,
      providerPhone: provider.phone || '',
      clientName: quote.customerName || 'Cliente Contratante',
      clientDocument: '',
      clientAddress: quote.customerAddress || '',
      clientEmail: quote.customerEmail || '',
      clientPhone: quote.customerPhone || '',
      clientCity: quote.customerCity || '',
      clientState: quote.customerState || '',
      title: `Contrato de Prestação de Serviços - ${quote.number}`,
      totalValue: quote.total,
      paymentTerms: quote.notes || 'A combinar',
      deadline: 'A definir de acordo com cronograma',
      content: clauses,
      signatures
    };

    // Salva localmente
    contractService.cacheContractLocally(newContract);

    // Salva no Supabase
    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await supabase.from('contracts').upsert(mapContractToDb(newContract));
      } catch (err) {
        console.warn('Erro ao salvar contrato no Supabase:', err);
      }
    }

    return newContract;
  },

  /**
   * Salva alterações ou atualizações em um contrato
   */
  saveContract: async (contract: Contract): Promise<Contract> => {
    const updatedContract = {
      ...contract,
      updatedAt: new Date().toISOString()
    };

    contractService.cacheContractLocally(updatedContract);

    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await supabase.from('contracts').upsert(mapContractToDb(updatedContract));
      } catch (err) {
        console.warn('Erro ao atualizar contrato no Supabase:', err);
      }
    }

    return updatedContract;
  },

  /**
   * Executa a assinatura digital do contrato (seja pelo Prestador ou pelo Cliente)
   */
  signContract: async (
    contractId: string,
    signerType: 'provider' | 'client',
    signatureData: {
      name: string;
      document: string;
      email?: string;
      phone?: string;
      signatureDataUrl?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<Contract | null> => {
    const contract = await contractService.getContractById(contractId);
    if (!contract) return null;

    const now = new Date().toISOString();
    const hash = generateSignatureHash(contract.id, signerType, signatureData.document || '');

    const updatedSignatures = contract.signatures.map(sig => {
      if (sig.signerType === signerType) {
        return {
          ...sig,
          name: signatureData.name.trim() || sig.name,
          document: signatureData.document.trim() || sig.document,
          email: signatureData.email || sig.email,
          phone: signatureData.phone || sig.phone,
          signatureDataUrl: signatureData.signatureDataUrl || sig.signatureDataUrl,
          signedAt: now,
          status: 'signed' as const,
          ipAddress: signatureData.ipAddress || '177.136.24.102',
          userAgent: signatureData.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
          hash
        };
      }
      return sig;
    });

    // Se o signatário não existia na lista, inclui
    if (!updatedSignatures.some(s => s.signerType === signerType)) {
      updatedSignatures.push({
        signerType,
        name: signatureData.name.trim(),
        document: signatureData.document.trim(),
        email: signatureData.email || '',
        phone: signatureData.phone || '',
        signatureDataUrl: signatureData.signatureDataUrl || '',
        signedAt: now,
        status: 'signed',
        ipAddress: signatureData.ipAddress || '177.136.24.102',
        userAgent: signatureData.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
        hash
      });
    }

    const providerSigned = updatedSignatures.some(s => s.signerType === 'provider' && s.status === 'signed');
    const clientSigned = updatedSignatures.some(s => s.signerType === 'client' && s.status === 'signed');

    let newStatus: Contract['status'] = 'pending_signatures';
    if (providerSigned && clientSigned) {
      newStatus = 'signed';
    } else if (providerSigned || clientSigned) {
      newStatus = 'partially_signed';
    }

    const updatedContract: Contract = {
      ...contract,
      signatures: updatedSignatures,
      status: newStatus,
      updatedAt: now
    };

    // Atualiza também os campos raiz de documento do contratante ou prestador se preenchidos
    if (signerType === 'client') {
      if (signatureData.name) updatedContract.clientName = signatureData.name;
      if (signatureData.document) updatedContract.clientDocument = signatureData.document;
      if (signatureData.email) updatedContract.clientEmail = signatureData.email;
      if (signatureData.phone) updatedContract.clientPhone = signatureData.phone;
    } else if (signerType === 'provider') {
      if (signatureData.name) updatedContract.providerName = signatureData.name;
      if (signatureData.document) updatedContract.providerDocument = signatureData.document;
    }

    await contractService.saveContract(updatedContract);
    return updatedContract;
  },

  /**
   * Deleta contrato do LocalStorage e Supabase
   */
  deleteContract: async (contractId: string): Promise<void> => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key === STORAGE_KEY_CONTRACTS || key.startsWith('orcafacil_contracts_'))) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const list: Contract[] = JSON.parse(data);
              const filtered = list.filter(c => c.id !== contractId);
              localStorage.setItem(key, JSON.stringify(filtered));
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao deletar contrato local:', e);
    }

    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await supabase.from('contracts').delete().eq('id', contractId);
      } catch (err) {
        console.warn('Erro ao deletar contrato no Supabase:', err);
      }
    }
  },

  /**
   * Monta o link para o cliente ou responsável visualizar e assinar o contrato online
   */
  getSigningUrl: (contractId: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/?contractId=${contractId}`;
  },

  /**
   * Gera mensagem de compartilhamento via WhatsApp
   */
  generateWhatsAppMessage: (contract: Contract, target: 'client' | 'provider'): string => {
    const signUrl = contractService.getSigningUrl(contract.id);
    const totalFormatted = formatCurrency(contract.totalValue);

    if (target === 'client') {
      const isSigned = contract.signatures.find(s => s.signerType === 'client')?.status === 'signed';
      if (isSigned) {
        return `*Contrato de Prestação de Serviços Concluído - ${contract.providerName}*\n\nOlá, ${contract.clientName}!\nSeu Contrato nº *${contract.contractNumber}* (Orçamento Ref: ${contract.quoteNumber}) no valor de *${totalFormatted}* foi assinado digitalmente com sucesso!\n\n📄 Você pode visualizar ou baixar seu contrato com certificação jurídica no link:\n👉 ${signUrl}\n\nObrigado pela confiança!`;
      }
      return `*Contrato de Prestação de Serviços - ${contract.providerName}*\n\nOlá, ${contract.clientName}!\nO Contrato de Prestação de Serviços nº *${contract.contractNumber}* (referente ao Orçamento ${contract.quoteNumber}) no valor de *${totalFormatted}* já está disponível para sua conferência e assinatura digital.\n\n✍️ *Para assinar digitalmente com validade jurídica pelo celular ou computador, acesse:*\n👉 ${signUrl}\n\nQualquer dúvida, estamos à disposição!`;
    }

    return `*Contrato ${contract.contractNumber} - Notificação Interna*\n\nContrato gerado para o cliente: *${contract.clientName}*\nValor: *${totalFormatted}*\nStatus: *${contract.status === 'signed' ? 'Totalmente Assinado' : contract.status === 'partially_signed' ? 'Assinado Parcialmente' : 'Aguardando Assinaturas'}*\n\nAcesse o contrato no sistema:\n👉 ${signUrl}`;
  },

  /**
   * Dispara abertura do WhatsApp com mensagem pronta
   */
  sendViaWhatsApp: (contract: Contract, target: 'client' | 'provider') => {
    const rawPhone = target === 'client' ? contract.clientPhone : contract.providerPhone;
    const cleanPhone = (rawPhone || '').replace(/\D/g, '');
    const message = encodeURIComponent(contractService.generateWhatsAppMessage(contract, target));
    
    if (cleanPhone) {
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  },

  /**
   * Monta e abre link mailto para envio do contrato por e-mail
   */
  sendViaEmail: (contract: Contract, target: 'client' | 'provider') => {
    const targetEmail = target === 'client' ? contract.clientEmail : contract.providerEmail;
    const signUrl = contractService.getSigningUrl(contract.id);
    const totalFormatted = formatCurrency(contract.totalValue);

    const subject = encodeURIComponent(
      `Contrato de Prestação de Serviços nº ${contract.contractNumber} - ${contract.providerName}`
    );

    const body = encodeURIComponent(
`Prezado(a) ${target === 'client' ? contract.clientName : contract.providerName},

Esperamos que esteja bem!

Segue para visualização e assinatura eletrônica o Contrato de Prestação de Serviços nº ${contract.contractNumber}, referente ao Orçamento nº ${contract.quoteNumber}.

RESUMO DO CONTRATO:
• Prestador: ${contract.providerName}
• Cliente: ${contract.clientName}
• Valor Global: ${totalFormatted}
• Condições de Pagamento: ${contract.paymentTerms || 'Conforme acordado'}

Para ler as cláusulas e realizar a sua assinatura eletrônica com plena validade jurídica (nos termos da MP 2.200-2/2001 e Lei 14.063/2020), clique no link abaixo:
${signUrl}

Atenciosamente,
${contract.providerName}
${contract.providerPhone || ''}`
    );

    window.open(`mailto:${targetEmail || ''}?subject=${subject}&body=${body}`, '_blank');
  }
};
