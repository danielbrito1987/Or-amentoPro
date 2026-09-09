import { getSupabase, isSupabaseConfigured } from './supabase';
import { Quote, CatalogItem, ProviderInfo } from '../types';

export type SyncActionType = 
  | 'SAVE_QUOTE' 
  | 'DELETE_QUOTE' 
  | 'SAVE_CATALOG_ITEM' 
  | 'DELETE_CATALOG_ITEM' 
  | 'SAVE_PROVIDER_INFO';

export interface SyncQueueItem {
  id: string;
  type: SyncActionType;
  payload: any;
  timestamp: number;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  hasConfiguredSupabase: boolean;
}

const QUEUE_KEY = 'orcafacil_sync_queue';
const LAST_SYNC_KEY = 'orcafacil_last_sync_timestamp';

type Listener = (status: SyncStatus) => void;
const listeners: Set<Listener> = new Set();

let currentStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  hasConfiguredSupabase: isSupabaseConfigured()
};

// Carrega último timestamp de sincronização do storage
try {
  const savedLastSync = localStorage.getItem(LAST_SYNC_KEY);
  if (savedLastSync) {
    currentStatus.lastSyncedAt = new Date(savedLastSync);
  }
} catch {}

const notifyListeners = () => {
  currentStatus = {
    ...currentStatus,
    pendingCount: getQueue().length,
    hasConfiguredSupabase: isSupabaseConfigured()
  };
  listeners.forEach(fn => fn(currentStatus));
};

export const getQueue = (): SyncQueueItem[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erro ao ler fila de sincronização:", e);
    return [];
  }
};

const saveQueue = (queue: SyncQueueItem[]) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    notifyListeners();
  } catch (e) {
    console.error("Erro ao salvar fila de sincronização:", e);
  }
};

export const syncService = {
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    // Notifica estado atual imediatamente
    listener({
      ...currentStatus,
      pendingCount: getQueue().length,
      hasConfiguredSupabase: isSupabaseConfigured()
    });
    return () => {
      listeners.delete(listener);
    };
  },

  getStatus: (): SyncStatus => ({
    ...currentStatus,
    pendingCount: getQueue().length,
    hasConfiguredSupabase: isSupabaseConfigured()
  }),

  enqueue: (type: SyncActionType, payload: any) => {
    const queue = getQueue();
    const targetId = payload?.id || payload?.companyId;

    // Se já houver uma ação idêntica para o mesmo registro, substitui pela mais recente
    // Se estiver excluindo, remove também qualquer SAVE pendente deste registro
    const filteredQueue = queue.filter(item => {
      const itemTargetId = item.payload?.id || item.payload?.companyId;
      if (itemTargetId !== targetId) return true;

      if (type === 'DELETE_QUOTE' && item.type === 'SAVE_QUOTE') return false;
      if (type === 'DELETE_CATALOG_ITEM' && item.type === 'SAVE_CATALOG_ITEM') return false;
      if (item.type === type) return false;

      return true;
    });

    const newItem: SyncQueueItem = {
      id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0
    };

    filteredQueue.push(newItem);
    saveQueue(filteredQueue);
    
    // Se estiver online, tenta processar imediatamente
    if (navigator.onLine && isSupabaseConfigured()) {
      syncService.processQueue();
    }
  },

  processQueue: async (): Promise<{ success: boolean; processedCount: number }> => {
    const supabase = getSupabase();
    if (!supabase || !navigator.onLine) {
      return { success: false, processedCount: 0 };
    }

    if (currentStatus.isSyncing) {
      return { success: false, processedCount: 0 };
    }

    const queue = getQueue();
    if (queue.length === 0) {
      return { success: true, processedCount: 0 };
    }

    currentStatus.isSyncing = true;
    notifyListeners();

    const remainingItems: SyncQueueItem[] = [];
    let processedCount = 0;

    for (const item of queue) {
      try {
        let error: any = null;

        if (item.type === 'SAVE_QUOTE') {
          const q: Quote = item.payload;
          const res = await supabase.from('quotes').upsert({
            id: q.id,
            number: q.number,
            date: q.date,
            customer_name: q.customerName,
            customer_phone: q.customerPhone,
            customer_email: q.customerEmail,
            customer_address: q.customerAddress,
            customer_city: q.customerCity,
            customer_state: q.customerState,
            items: q.items,
            total: q.total,
            notes: q.notes,
            provider_info: q.providerInfo,
            company_id: q.companyId
          });
          error = res.error;
        } else if (item.type === 'DELETE_QUOTE') {
          const res = await supabase.from('quotes').delete().eq('id', item.payload.id);
          error = res.error;
        } else if (item.type === 'SAVE_CATALOG_ITEM') {
          const ci: CatalogItem = item.payload;
          const res = await supabase.from('products').upsert({
            id: ci.id,
            name: ci.name,
            description: ci.description || '',
            price: ci.price,
            type: ci.type,
            unit: ci.unit || 'un',
            company_id: ci.companyId
          });
          error = res.error;
        } else if (item.type === 'DELETE_CATALOG_ITEM') {
          const res = await supabase.from('products').delete().eq('id', item.payload.id);
          error = res.error;
        } else if (item.type === 'SAVE_PROVIDER_INFO') {
          const p: ProviderInfo = item.payload;
          const res = await supabase.from('provider_info').upsert({
            id: 'prov_' + p.companyId,
            company_id: p.companyId,
            name: p.name,
            document: p.document,
            phone: p.phone,
            email: p.email,
            address: p.address,
            logo: p.logo || '',
            updated_at: new Date().toISOString()
          });
          error = res.error;
        }

        if (error) {
          console.warn(`[SyncQueue] Erro ao sincronizar item ${item.id}:`, error);
          item.retryCount += 1;
          remainingItems.push(item);
        } else {
          processedCount += 1;
        }
      } catch (err) {
        console.warn(`[SyncQueue] Exceção ao sincronizar item ${item.id}:`, err);
        item.retryCount += 1;
        remainingItems.push(item);
      }
    }

    saveQueue(remainingItems);
    currentStatus.isSyncing = false;

    if (processedCount > 0) {
      const now = new Date();
      currentStatus.lastSyncedAt = now;
      try {
        localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      } catch {}
    }

    notifyListeners();
    return { success: remainingItems.length === 0, processedCount };
  }
};

// Monitoramento de eventos de conexão do navegador
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentStatus.isOnline = true;
    notifyListeners();
    // Aciona sincronização das pendências acumuladas automaticamente
    setTimeout(() => {
      syncService.processQueue();
    }, 1000);
  });

  window.addEventListener('offline', () => {
    currentStatus.isOnline = false;
    notifyListeners();
  });

  // Checagem periódica a cada 40 segundos se houver itens na fila
  setInterval(() => {
    if (navigator.onLine && getQueue().length > 0) {
      syncService.processQueue();
    }
  }, 40000);
}
