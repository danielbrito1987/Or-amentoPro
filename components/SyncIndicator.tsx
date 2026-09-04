import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { syncService, SyncStatus } from '../services/syncService';

interface SyncIndicatorProps {
  isCollapsed?: boolean;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ isCollapsed = false }) => {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    const unsubscribe = syncService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status.isSyncing) return;
    await syncService.processQueue();
  };

  // Se a sincronização na nuvem não estiver ativa, avisa sobre o modo local seguro
  if (!status.hasConfiguredSupabase) {
    return (
      <div 
        title={isCollapsed ? "Modo Local: todos os seus dados ficam salvos com segurança na memória deste dispositivo." : undefined}
        className={`flex items-center rounded-xl p-2 text-xs text-slate-400 bg-slate-800/30 border border-slate-800 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-slate-500"></div>
          {!isCollapsed && <span className="text-[11px] truncate">Modo Salvo no Aparelho</span>}
        </div>
      </div>
    );
  }

  // 1. Estado sincronizando
  if (status.isSyncing) {
    return (
      <div 
        title={isCollapsed ? "Salvando suas alterações na nuvem com segurança..." : undefined}
        className={`flex items-center rounded-xl p-2 text-xs bg-blue-950/40 border border-blue-800/40 text-blue-300 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className="flex items-center space-x-2 overflow-hidden">
          <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
          {!isCollapsed && (
            <span className="text-[11px] font-medium truncate">Salvando na nuvem...</span>
          )}
        </div>
      </div>
    );
  }

  // 2. Estado offline
  if (!status.isOnline) {
    return (
      <div 
        title={isCollapsed ? `Você está sem internet no momento. ${status.pendingCount > 0 ? `${status.pendingCount} alteração(ões) salva(s) no aparelho e prontas para envio.` : 'Tudo salvo neste aparelho com segurança.'}` : undefined}
        className={`flex items-center rounded-xl p-2 text-xs bg-amber-950/30 border border-amber-800/40 text-amber-300 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className="flex items-center space-x-2 overflow-hidden">
          <CloudOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-[11px] font-medium leading-tight truncate">Sem Internet</p>
              <p className="text-[10px] text-amber-400/80 leading-tight truncate">
                {status.pendingCount > 0 
                  ? `${status.pendingCount} alteração(ões) no aparelho` 
                  : 'Salvo com segurança local'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Estado online com itens pendentes na fila
  if (status.pendingCount > 0) {
    return (
      <button
        onClick={handleManualSync}
        type="button"
        title={isCollapsed ? `${status.pendingCount} alteração(ões) aguardando envio. Clique para sincronizar agora.` : undefined}
        className={`w-full flex items-center rounded-xl p-2 text-xs bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-200 transition-colors text-left ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className="flex items-center space-x-2 overflow-hidden">
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-[11px] font-medium leading-tight truncate">Atualizar Nuvem</p>
              <p className="text-[10px] text-indigo-300/80 leading-tight truncate">
                {status.pendingCount} item(ns) a enviar
              </p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-600/60 rounded-md shrink-0">
            Enviar
          </span>
        )}
      </button>
    );
  }

  // 4. Estado online e 100% sincronizado com a nuvem
  return (
    <div 
      onClick={handleManualSync}
      role="button"
      tabIndex={0}
      title={isCollapsed ? "Conexão ativa: todos os seus orçamentos, itens e dados estão salvos e atualizados na nuvem." : undefined}
      className={`flex items-center rounded-xl p-2 text-xs bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 text-emerald-400 cursor-pointer transition-colors ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}
    >
      <div className="flex items-center space-x-2 overflow-hidden">
        <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        {!isCollapsed && (
          <div className="overflow-hidden">
            <p className="text-[11px] font-semibold text-slate-200 leading-tight truncate flex items-center gap-1">
              <span>Salvo na Nuvem</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
            </p>
            <p className="text-[10px] text-emerald-400/90 leading-tight truncate">
              Backup Seguro Ativo
            </p>
          </div>
        )}
      </div>
      {!isCollapsed && (
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/50" />
      )}
    </div>
  );
};
