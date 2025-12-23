
import React from 'react';
import { FileText, TrendingUp, Package, Settings, LogOut } from 'lucide-react';
import { ProviderInfo } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  providerInfo: ProviderInfo;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, providerInfo, isOpen, onClose, onLogout }) => {
  const { user } = useAuth();

  const NavButton = ({ tab, icon: Icon, label }: any) => (
    <button 
      onClick={() => { onTabChange(tab); onClose(); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <>
      <nav className={`no-print fixed inset-0 z-50 md:relative md:flex md:w-64 bg-slate-900 text-white flex-shrink-0 flex-col transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg"><FileText className="w-6 h-6 text-white" /></div>
            <h1 className="text-xl font-bold tracking-tight">OrçaFácil</h1>
          </div>
        </div>
        
        <div className="flex-1 px-4 space-y-2 mt-4">
          <NavButton tab="quotes" icon={TrendingUp} label="Orçamentos" />
          <NavButton tab="catalog" icon={Package} label="Catálogo" />
          <NavButton tab="settings" icon={Settings} label="Meus Dados" />
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex flex-col p-2 mb-2">
            <div className="flex items-center space-x-3 mb-1">
              {providerInfo.logo ? (
                <img src={providerInfo.logo} className="w-8 h-8 rounded-full object-cover border border-slate-700" alt="Logo" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                  {providerInfo.name.charAt(0)}
                </div>
              )}
              <div className="text-sm overflow-hidden">
                <p className="font-medium truncate">{providerInfo.name}</p>
              </div>
            </div>
            {user && (
              <p className="text-[10px] text-slate-500 truncate ml-11">Logado como: {user.name}</p>
            )}
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </nav>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden no-print" onClick={onClose} />}
    </>
  );
};
