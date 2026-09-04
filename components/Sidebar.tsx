
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Package, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  X,
  User as UserIcon
} from 'lucide-react';
import { ProviderInfo } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { SyncIndicator } from './SyncIndicator';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  providerInfo: ProviderInfo;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  providerInfo, 
  isOpen, 
  onClose, 
  onLogout 
}) => {
  const { user } = useAuth();

  // Persiste a preferência do usuário de menu recolhido
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('orcafacil_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('orcafacil_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const NavButton = ({ tab, icon: Icon, label }: { tab: string; icon: any; label: string }) => {
    const isActive = activeTab === tab;

    return (
      <button 
        id={`nav-tab-${tab}`}
        onClick={() => { onTabChange(tab); onClose(); }}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center rounded-xl transition-all duration-200 ${
          isCollapsed 
            ? 'justify-center py-3 px-0' 
            : 'space-x-3 px-4 py-3'
        } ${
          isActive 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-semibold' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
        }`}
        aria-label={label}
      >
        <Icon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
        {!isCollapsed && (
          <span className="font-medium truncate transition-opacity duration-200">
            {label}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <nav 
        className={`no-print fixed inset-y-0 left-0 z-50 md:relative md:flex bg-slate-900 text-white flex-shrink-0 flex-col transition-all duration-300 ease-in-out border-r border-slate-800/80 shadow-xl overflow-hidden ${
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Header do Sidebar */}
        <div className={`p-4 border-b border-slate-800/80 flex items-center overflow-hidden ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {/* Logo e Nome */}
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-gradient-to-tr from-blue-700 to-blue-500 p-2.5 rounded-xl shadow-md shadow-blue-600/30 shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-black tracking-tight text-white leading-tight truncate">OrçaFácil</h1>
                <p className="text-[11px] text-blue-400 font-medium leading-none truncate">Propostas Rápidas</p>
              </div>
            )}
          </div>

          {/* Botão de fechar em telas pequenas */}
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Botão de recolher/expandir (Desktop) */}
          {!isCollapsed && (
            <button
              id="btn-collapse-sidebar"
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Recolher menu"
              aria-label="Recolher menu"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Botão para expandir quando estiver no modo recolhido (Desktop) */}
        {isCollapsed && (
          <div className="hidden md:flex justify-center pt-3 pb-1">
            <button
              id="btn-expand-sidebar"
              onClick={toggleCollapse}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition-colors"
              title="Expandir menu lateral"
              aria-label="Expandir menu lateral"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Lista de Navegação */}
        <div className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto overflow-x-hidden">
          <NavButton tab="quotes" icon={TrendingUp} label="Orçamentos" />
          <NavButton tab="catalog" icon={Package} label="Catálogo" />
          <NavButton tab="settings" icon={Settings} label="Meus Dados" />
        </div>

        {/* Rodapé: Perfil e Logout */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-900/60 overflow-hidden">
          {/* Indicador de Conexão e Sincronização Supabase */}
          <SyncIndicator isCollapsed={isCollapsed} />

          {/* Card do Prestador */}
          <div 
            title={isCollapsed ? `${providerInfo.name || 'Prestador de Serviços'}${user ? ` (${user.email})` : ''}` : undefined}
            className={`flex items-center rounded-xl p-2 transition-colors ${
              isCollapsed ? 'justify-center' : 'space-x-3 bg-slate-800/40 hover:bg-slate-800/80'
            }`}
          >
            {providerInfo.logo ? (
              <img 
                src={providerInfo.logo} 
                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0" 
                alt="Logo da empresa" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-xs text-white shrink-0 border border-slate-600">
                {providerInfo.name ? providerInfo.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
            )}

            {!isCollapsed && (
              <div className="text-xs overflow-hidden flex-1 min-w-0">
                <p className="font-semibold text-slate-200 truncate">{providerInfo.name || 'Prestador de Serviços'}</p>
                {user && (
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Botão de Logout */}
          <button 
            id="btn-sidebar-logout"
            onClick={onLogout}
            title={isCollapsed ? "Sair da conta" : undefined}
            className={`w-full flex items-center rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${
              isCollapsed 
                ? 'justify-center p-3' 
                : 'space-x-3 px-4 py-2.5'
            }`}
            aria-label="Sair da conta"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">Sair</span>}
          </button>
        </div>
      </nav>

      {/* Backdrop para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden no-print transition-opacity" 
          onClick={onClose} 
        />
      )}
    </>
  );
};
