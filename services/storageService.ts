
import { CatalogItem, Quote, ProviderInfo, ItemType } from '../types';
import { apiService } from './api.service';
import { getSupabase } from './supabase';
import { syncService, getQueue } from './syncService';
import { authService } from './authService';

const syncSupabase = async (fn: () => PromiseLike<any>) => {
  try {
    await fn();
  } catch (err) {
    console.warn("Supabase sync:", err);
  }
};

const extractArray = (response: any, keys: string[]): any[] => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== 'object') return [];
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key];
  }
  const firstArrayKey = Object.keys(response).find(key => Array.isArray(response[key]));
  if (firstArrayKey) return response[firstArrayKey];
  return [];
};

const mapId = (item: any): any => {
  if (!item) return item;
  if (item._id && !item.id) {
    return { ...item, id: item._id };
  }
  return item;
};

// Dados padrão realistas para prestadores de serviços no Brasil
const getInitialCatalog = (companyId: string): CatalogItem[] => [
  {
    id: 'item-1',
    name: 'Instalação de Ponto Elétrico / Tomada',
    description: 'Instalação completa de tomada 10A ou 20A com passagem de fiação e espelho',
    price: 85.00,
    type: ItemType.SERVICE,
    unit: 'un',
    companyId
  },
  {
    id: 'item-2',
    name: 'Manutenção Preventiva de Ar Condicionado (Split)',
    description: 'Higienização completa da evaporadora e condensadora com aplicação de bactericida',
    price: 180.00,
    type: ItemType.SERVICE,
    unit: 'un',
    companyId
  },
  {
    id: 'item-3',
    name: 'Troca de Disjuntor no Quadro de Distribuição',
    description: 'Substituição de disjuntor com teste de carga e aperto de conexões',
    price: 90.00,
    type: ItemType.SERVICE,
    unit: 'un',
    companyId
  },
  {
    id: 'item-4',
    name: 'Pintura Residencial com Emassamento',
    description: 'Preparação de superfície, lixamento, selador e 2 demãos de tinta acrílica premium',
    price: 45.00,
    type: ItemType.SERVICE,
    unit: 'm²',
    companyId
  },
  {
    id: 'item-5',
    name: 'Disjuntor Bipolar DIN 32A Curva C',
    description: 'Disjuntor padrão DIN para proteção de circuitos residenciais',
    price: 48.00,
    type: ItemType.PRODUCT,
    unit: 'un',
    companyId
  },
  {
    id: 'item-6',
    name: 'Rolo de Cabo Flexível 2,5mm (100 metros)',
    description: 'Cabo de cobre antichama normatizado NBR NM 247-3',
    price: 240.00,
    type: ItemType.PRODUCT,
    unit: 'un',
    companyId
  },
  {
    id: 'item-7',
    name: 'Lâmpada LED Tubular T8 18W Bivolt',
    description: 'Lâmpada de alto rendimento 6500K luz branca',
    price: 26.50,
    type: ItemType.PRODUCT,
    unit: 'un',
    companyId
  }
];

const getInitialProviderInfo = (companyId: string): ProviderInfo => ({
  name: 'Silva & Oliveira Serviços Especializados',
  document: '34.567.890/0001-23',
  phone: '(11) 98765-4321',
  email: 'contato@silvaservicos.com.br',
  address: 'Rua das Palmeiras, 450 - Sala 12, São Paulo - SP',
  companyId
});

const getInitialQuotes = (companyId: string, provider: ProviderInfo): Quote[] => [
  {
    id: 'quote-demo-1',
    number: 'ORC-0001',
    date: new Date().toISOString().split('T')[0],
    customerName: 'Roberto Almeida Santos',
    customerPhone: '(11) 99123-4567',
    customerEmail: 'roberto.almeida@gmail.com',
    customerAddress: 'Av. Brigadeiro Faria Lima, 2200, Apto 104',
    customerCity: 'São Paulo',
    customerState: 'SP',
    items: [
      {
        id: 'item-1',
        name: 'Instalação de Ponto Elétrico / Tomada',
        description: 'Instalação completa de tomada 10A ou 20A com passagem de fiação e espelho',
        price: 85.00,
        type: ItemType.SERVICE,
        unit: 'un',
        quantity: 4
      },
      {
        id: 'item-5',
        name: 'Disjuntor Bipolar DIN 32A Curva C',
        description: 'Disjuntor padrão DIN para proteção de circuitos residenciais',
        price: 48.00,
        type: ItemType.PRODUCT,
        unit: 'un',
        quantity: 1
      },
      {
        id: 'item-3',
        name: 'Troca de Disjuntor no Quadro de Distribuição',
        description: 'Substituição de disjuntor com teste de carga e aperto de conexões',
        price: 90.00,
        type: ItemType.SERVICE,
        unit: 'un',
        quantity: 1
      }
    ],
    total: 478.00,
    notes: 'Validade da proposta: 15 dias. Pagamento em até 3x sem juros ou 5% de desconto no Pix à vista. Garantia de 90 dias sobre a mão de obra prestada.',
    providerInfo: provider,
    companyId
  }
];

export const storageService = {
  // Catalog (Produtos e Serviços)
  getCatalog: async (companyId: string): Promise<CatalogItem[]> => {
    const localKey = `orcafacil_catalog_${companyId}`;
    
    // 1. Tenta carregar do Supabase se estiver configurado
    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        // Tenta processar fila pendente antes para descarregar alterações
        syncService.processQueue().catch(() => {});

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('company_id', companyId)
          .order('name');
        if (!error && data && data.length > 0) {
          const mapped: CatalogItem[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            description: d.description || '',
            price: Number(d.price) || 0,
            type: d.type as ItemType,
            unit: d.unit || 'un',
            companyId: d.company_id
          }));

          // Preserva itens salvos localmente que ainda estão na fila de sincronização
          const queue = getQueue();
          const pendingItems = queue
            .filter(q => q.type === 'SAVE_CATALOG_ITEM' && q.payload?.companyId === companyId)
            .map(q => q.payload as CatalogItem);
          const deletedIds = new Set(
            queue.filter(q => q.type === 'DELETE_CATALOG_ITEM').map(q => q.payload?.id)
          );

          const finalMap = new Map<string, CatalogItem>();
          mapped.forEach(item => {
            if (!deletedIds.has(item.id)) finalMap.set(item.id, item);
          });
          pendingItems.forEach(item => {
            if (!deletedIds.has(item.id)) finalMap.set(item.id, item);
          });

          const finalItems = Array.from(finalMap.values());
          localStorage.setItem(localKey, JSON.stringify(finalItems));
          return finalItems;
        }
      } catch (e) {
        console.warn("Supabase getCatalog:", e);
      }
    }

    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Erro ao ler catálogo local:", e);
    }

    // Tenta carregar da API remota
    try {
      const response = await apiService.get<any>(`/products?companyId=${companyId}`);
      const items = extractArray(response, ['products', 'data', 'items', 'results', 'content']);
      if (items && items.length > 0) {
        const mapped = items.map(mapId);
        localStorage.setItem(localKey, JSON.stringify(mapped));
        return mapped;
      }
    } catch {
      // Ignora erro da API remota se estiver offline
    }

    // Apenas gera itens de exemplo se for a conta de demonstração
    if (companyId === 'comp_demo_eletro') {
      const initialItems = getInitialCatalog(companyId);
      try {
        localStorage.setItem(localKey, JSON.stringify(initialItems));
      } catch {}
      return initialItems;
    }

    // Para contas reais, inicia com catálogo limpo
    return [];
  },
  
  saveCatalogItem: async (item: CatalogItem): Promise<CatalogItem> => {
    const companyId = item.companyId || 'default';
    const localKey = `orcafacil_catalog_${companyId}`;
    const safeItem = { ...item, id: item.id || 'item_' + Date.now(), companyId };

    try {
      const stored = localStorage.getItem(localKey);
      const items: CatalogItem[] = stored ? JSON.parse(stored) : [];
      items.push(safeItem);
      localStorage.setItem(localKey, JSON.stringify(items));
    } catch (e) {
      console.error("Erro ao salvar item no storage local:", e);
    }

    // Sincroniza no Supabase se online; se offline ou erro, salva na fila pendente
    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { error } = await supabase.from('products').upsert({
          id: safeItem.id,
          name: safeItem.name,
          description: safeItem.description || '',
          price: safeItem.price,
          type: safeItem.type,
          unit: safeItem.unit || 'un',
          company_id: companyId
        });
        if (error) {
          syncService.enqueue('SAVE_CATALOG_ITEM', safeItem);
        }
      } catch (err) {
        syncService.enqueue('SAVE_CATALOG_ITEM', safeItem);
      }
    } else {
      syncService.enqueue('SAVE_CATALOG_ITEM', safeItem);
    }

    // Sincroniza na API legada em segundo plano
    apiService.post<CatalogItem>('/products', safeItem).catch(() => {});
    return safeItem;
  },
  
  updateCatalogItem: async (item: CatalogItem): Promise<CatalogItem> => {
    const companyId = item.companyId || 'default';
    const localKey = `orcafacil_catalog_${companyId}`;

    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const items: CatalogItem[] = JSON.parse(stored);
        const index = items.findIndex(i => i.id === item.id);
        if (index >= 0) {
          items[index] = item;
          localStorage.setItem(localKey, JSON.stringify(items));
        }
      }
    } catch (e) {
      console.error("Erro ao atualizar item local:", e);
    }

    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { error } = await supabase.from('products').upsert({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          type: item.type,
          unit: item.unit || 'un',
          company_id: companyId
        });
        if (error) {
          syncService.enqueue('SAVE_CATALOG_ITEM', item);
        }
      } catch (err) {
        syncService.enqueue('SAVE_CATALOG_ITEM', item);
      }
    } else {
      syncService.enqueue('SAVE_CATALOG_ITEM', item);
    }

    apiService.put<CatalogItem>(`/products/${item.id}`, item).catch(() => {});
    return item;
  },

  deleteCatalogItem: async (id: string, companyId?: string): Promise<void> => {
    try {
      // Coleta chaves primeiro para evitar pulo de índice durante a iteração
      const keysToClean: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('orcafacil_catalog_')) {
          keysToClean.push(key);
        }
      }
      for (const key of keysToClean) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const items: CatalogItem[] = JSON.parse(stored);
            const filtered = items.filter(i => i.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
          } catch {}
        }
      }
    } catch (e) {
      console.error("Erro ao deletar item local:", e);
    }

    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          syncService.enqueue('DELETE_CATALOG_ITEM', { id, companyId });
        }
      } catch (err) {
        syncService.enqueue('DELETE_CATALOG_ITEM', { id, companyId });
      }
    } else {
      syncService.enqueue('DELETE_CATALOG_ITEM', { id, companyId });
    }

    apiService.delete(`/products/${id}`).catch(() => {});
  },

  // Quotes (Orçamentos)
  getQuotes: async (companyId: string): Promise<Quote[]> => {
    const localKey = `orcafacil_quotes_${companyId}`;

    // 1. Tenta buscar do Supabase
    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        // Tenta processar pendências antes de ler
        syncService.processQueue().catch(() => {});

        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
        if (!error && data) {
          const mapped: Quote[] = data.map((q: any) => ({
            id: q.id,
            number: q.number,
            date: q.date,
            customerName: q.customer_name,
            customerPhone: q.customer_phone,
            customerEmail: q.customer_email,
            customerAddress: q.customer_address,
            customerCity: q.customer_city,
            customerState: q.customer_state,
            items: q.items,
            total: Number(q.total) || 0,
            notes: q.notes,
            providerInfo: q.provider_info,
            companyId: q.company_id
          }));

          // Preserva orçamentos criados offline que estão na fila de sincronização
          const queue = getQueue();
          const pendingQuotes = queue
            .filter(q => q.type === 'SAVE_QUOTE' && q.payload?.companyId === companyId)
            .map(q => q.payload as Quote);
          const deletedIds = new Set(
            queue.filter(q => q.type === 'DELETE_QUOTE').map(q => q.payload?.id)
          );

          const finalMap = new Map<string, Quote>();
          mapped.forEach(item => {
            if (!deletedIds.has(item.id)) finalMap.set(item.id, item);
          });
          pendingQuotes.forEach(item => {
            if (!deletedIds.has(item.id)) finalMap.set(item.id, item);
          });

          const finalQuotes = Array.from(finalMap.values());
          localStorage.setItem(localKey, JSON.stringify(finalQuotes));
          return finalQuotes;
        }
      } catch (e) {
        console.warn("Supabase getQuotes:", e);
      }
    }

    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Erro ao ler orçamentos locais:", e);
    }

    // Tenta buscar da API remota
    try {
      const response = await apiService.get<any>(`/quotes?companyId=${companyId}`);
      const quotes = extractArray(response, ['quotes', 'data', 'items', 'results']);
      if (quotes && quotes.length > 0) {
        const mapped = quotes.map(mapId);
        localStorage.setItem(localKey, JSON.stringify(mapped));
        return mapped;
      }
    } catch {
      // API offline
    }

    // Apenas gera exemplo inicial se for a conta de demonstração
    if (companyId === 'comp_demo_eletro') {
      const provider = await storageService.getProviderInfo(companyId);
      const initialQuotes = getInitialQuotes(companyId, provider);
      try {
        localStorage.setItem(localKey, JSON.stringify(initialQuotes));
      } catch {}
      return initialQuotes;
    }

    // Para qualquer conta real, inicia com lista limpa vazia
    return [];
  },
  
  saveQuote: async (quote: Quote): Promise<Quote> => {
    const companyId = quote.companyId || 'default';
    const localKey = `orcafacil_quotes_${companyId}`;
    const safeQuote = { ...quote, id: quote.id || 'quote_' + Date.now(), companyId };

    try {
      const stored = localStorage.getItem(localKey);
      const quotes: Quote[] = stored ? JSON.parse(stored) : [];
      const existingIdx = quotes.findIndex(q => q.id === safeQuote.id);
      if (existingIdx >= 0) {
        quotes[existingIdx] = safeQuote;
      } else {
        quotes.unshift(safeQuote);
      }
      localStorage.setItem(localKey, JSON.stringify(quotes));
    } catch (e) {
      console.error("Erro ao persistir orçamento localmente:", e);
    }

    // Sincroniza no Supabase se online; caso contrário, enfileira na fila de sincronização
    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { error } = await supabase.from('quotes').upsert({
          id: safeQuote.id,
          number: safeQuote.number,
          date: safeQuote.date,
          customer_name: safeQuote.customerName,
          customer_phone: safeQuote.customerPhone,
          customer_email: safeQuote.customerEmail,
          customer_address: safeQuote.customerAddress,
          customer_city: safeQuote.customerCity,
          customer_state: safeQuote.customerState,
          items: safeQuote.items,
          total: safeQuote.total,
          notes: safeQuote.notes,
          provider_info: safeQuote.providerInfo,
          company_id: companyId
        });
        if (error) {
          syncService.enqueue('SAVE_QUOTE', safeQuote);
        }
      } catch (err) {
        syncService.enqueue('SAVE_QUOTE', safeQuote);
      }
    } else {
      syncService.enqueue('SAVE_QUOTE', safeQuote);
    }

    // Sincroniza remotamente na API se possível
    if (safeQuote.id && safeQuote.id.length > 20) { 
      apiService.post<Quote>('/quotes', safeQuote).catch(() => {});
    } else {
      apiService.put<Quote>(`/quotes/${safeQuote.id}`, safeQuote).catch(() => {});
    }

    return safeQuote;
  },
  
  deleteQuote: async (id: string): Promise<void> => {
    try {
      const keysToClean: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('orcafacil_quotes_')) {
          keysToClean.push(key);
        }
      }
      for (const key of keysToClean) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const quotes: Quote[] = JSON.parse(stored);
            const filtered = quotes.filter(q => q.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
          } catch {}
        }
      }
    } catch (e) {
      console.error("Erro ao excluir orçamento localmente:", e);
    }

    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { error } = await supabase.from('quotes').delete().eq('id', id);
        if (error) {
          syncService.enqueue('DELETE_QUOTE', { id });
        }
      } catch (err) {
        syncService.enqueue('DELETE_QUOTE', { id });
      }
    } else {
      syncService.enqueue('DELETE_QUOTE', { id });
    }

    apiService.delete(`/quotes/${id}`).catch(() => {});
  },

  // Provider Info (Dados do Profissional)
  getProviderInfo: async (companyId: string): Promise<ProviderInfo> => {
    const localKey = `orcafacil_provider_${companyId}`;

    // 1. Tenta buscar do Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('provider_info')
          .select('*')
          .eq('company_id', companyId)
          .maybeSingle();
        if (!error && data && data.name) {
          const mapped: ProviderInfo = {
            name: data.name,
            document: data.document || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            logo: data.logo || '',
            companyId: data.company_id
          };
          localStorage.setItem(localKey, JSON.stringify(mapped));
          return mapped;
        }
      } catch (e) {
        console.warn("Supabase getProviderInfo:", e);
      }
    }

    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Erro ao ler dados do prestador:", e);
    }

    try {
      const response = await apiService.get<any>(`/provider?companyId=${companyId}`);
      const data = Array.isArray(response) ? response[0] : response;
      if (data && (data.name || data.document)) {
        const mapped = mapId(data);
        localStorage.setItem(localKey, JSON.stringify(mapped));
        return mapped;
      }
    } catch {}

    // Apenas a conta de demonstração recebe o prestador "Silva & Oliveira"
    if (companyId === 'comp_demo_eletro') {
      const initial = getInitialProviderInfo(companyId);
      try {
        localStorage.setItem(localKey, JSON.stringify(initial));
      } catch {}
      return initial;
    }

    // Para usuários reais: inicializa com os dados cadastrados pelo usuário
    const currentUser = authService.getCurrentUser();
    const realInitial: ProviderInfo = {
      name: (currentUser && currentUser.name) || 'Prestador de Serviços',
      document: '',
      phone: '',
      email: (currentUser && currentUser.email) || '',
      address: '',
      companyId
    };

    try {
      localStorage.setItem(localKey, JSON.stringify(realInitial));
    } catch {}

    // Persiste no Supabase
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      void (async () => {
        try {
          await supabase.from('provider_info').upsert({
            id: 'prov_' + companyId,
            company_id: companyId,
            name: realInitial.name,
            document: '',
            phone: '',
            email: realInitial.email,
            address: '',
            logo: '',
            updated_at: new Date().toISOString()
          });
        } catch {}
      })();
    }

    return realInitial;
  },
  
  saveProviderInfo: async (info: ProviderInfo): Promise<ProviderInfo> => {
    const companyId = info.companyId || 'default';
    const localKey = `orcafacil_provider_${companyId}`;

    try {
      localStorage.setItem(localKey, JSON.stringify(info));
      localStorage.setItem('orcafacil_provider', JSON.stringify(info));
    } catch (e) {
      console.error("Erro ao salvar dados do prestador localmente:", e);
    }

    const supabase = getSupabase();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { error } = await supabase.from('provider_info').upsert({
          id: 'prov_' + companyId,
          company_id: companyId,
          name: info.name,
          document: info.document,
          phone: info.phone,
          email: info.email,
          address: info.address,
          logo: info.logo || '',
          updated_at: new Date().toISOString()
        });
        if (error) {
          syncService.enqueue('SAVE_PROVIDER_INFO', info);
        }
      } catch (err) {
        syncService.enqueue('SAVE_PROVIDER_INFO', info);
      }
    } else {
      syncService.enqueue('SAVE_PROVIDER_INFO', info);
    }

    apiService.post<ProviderInfo>('/provider', info).catch(() => {});
    return info;
  }
};
