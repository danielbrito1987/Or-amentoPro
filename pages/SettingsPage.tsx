
import React, { useRef, useState } from 'react';
import { ProviderInfo } from '../types';
import { Button } from '../components/Button';
import { ImageIcon, Upload, Database, CheckCircle2, HardDrive, ShieldCheck, Lock, ExternalLink } from 'lucide-react';
import { maskCPF_CNPJ, maskPhone } from '../utils/formatters';
import { isSupabaseConfigured } from '../services/supabase';
import { LegalModal, LegalTab } from '../components/LegalModal';

interface SettingsPageProps {
  providerInfo: ProviderInfo;
  onUpdate: (info: ProviderInfo) => void;
  onSave: () => void;
  onOpenLegal?: (tab: LegalTab) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ providerInfo, onUpdate, onSave, onOpenLegal }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [localLegalModal, setLocalLegalModal] = useState<{ isOpen: boolean; tab: LegalTab }>({
    isOpen: false,
    tab: 'privacy'
  });

  const handleOpenLegal = (tab: LegalTab = 'privacy') => {
    if (onOpenLegal) {
      onOpenLegal(tab);
    } else {
      setLocalLegalModal({ isOpen: true, tab });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdate({ ...providerInfo, logo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Meus Dados Profissionais</h2>
        <p className="text-slate-500">Estas informações aparecerão no cabeçalho dos seus orçamentos</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 pb-6 border-b border-gray-100">
          <div className="relative group">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-300">
              {providerInfo.logo ? <img src={providerInfo.logo} className="w-full h-full object-contain" /> : <ImageIcon className="w-8 h-8 text-gray-300" />}
            </div>
            <button onClick={() => logoInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"><Upload size={16} /></button>
            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-slate-800 text-lg">Logomarca</h3>
            <p className="text-sm text-gray-500 mb-3">Envie sua logo para orçamentos profissionais.</p>
            {providerInfo.logo && <button onClick={() => onUpdate({...providerInfo, logo: undefined})} className="text-red-500 text-xs font-bold uppercase hover:underline">Remover Logo</button>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia ou Seu Nome</label>
            <input type="text" value={providerInfo.name} onChange={e => onUpdate({...providerInfo, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <input type="text" value={providerInfo.document} onChange={e => onUpdate({...providerInfo, document: maskCPF_CNPJ(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" placeholder="CPF ou CNPJ" />
          <input type="text" value={providerInfo.phone} onChange={e => onUpdate({...providerInfo, phone: maskPhone(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" placeholder="Telefone" />
          <div className="sm:col-span-2">
            <input type="email" value={providerInfo.email} onChange={e => onUpdate({...providerInfo, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" placeholder="E-mail" />
          </div>
          <div className="sm:col-span-2">
            <textarea value={providerInfo.address} onChange={e => onUpdate({...providerInfo, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" rows={3} placeholder="Endereço Comercial" />
          </div>
        </div>
        <Button 
          size="lg" 
          className="w-full shadow-lg shadow-blue-500/20" 
          onClick={onSave}
        >
          Salvar Informações
        </Button>
      </div>

      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex items-start gap-3.5">
        <div className={`p-2.5 rounded-xl shrink-0 ${isSupabaseConfigured() ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
          {isSupabaseConfigured() ? <Database className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
        </div>
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              {isSupabaseConfigured() ? 'Backup e Sincronização na Nuvem Ativos' : 'Armazenamento Local Ativo'}
            </span>
            {isSupabaseConfigured() && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Nuvem
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-1">
            {isSupabaseConfigured()
              ? 'Seus orçamentos, catálogo de serviços e dados da empresa são salvos e sincronizados automaticamente na nuvem. Você pode acessar de qualquer celular ou computador.'
              : 'Seus dados estão salvos com segurança neste navegador. Se ficar sem internet, tudo continuará funcionando normalmente.'}
          </p>
        </div>
      </div>

      {/* Seção LGPD e Privacidade de Dados */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0 border border-blue-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Privacidade, Dados & Conformidade LGPD
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Lei nº 13.709/2018
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-1 leading-relaxed">
              O OrçaFácil Pro trata seus dados com segurança técnica, criptografia de ponta a ponta e isolamento total. Você mantém a propriedade dos orçamentos e pode consultar, exportar ou solicitar a exclusão de seus dados conforme o Artigo 18 da LGPD.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleOpenLegal('privacy')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Consultar Política de Privacidade</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenLegal('terms')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Termos de Uso
          </button>

          <button
            type="button"
            onClick={() => handleOpenLegal('cookies')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Política de Cookies
          </button>
        </div>
      </div>

      <LegalModal
        isOpen={localLegalModal.isOpen}
        onClose={() => setLocalLegalModal(prev => ({ ...prev, isOpen: false }))}
        initialTab={localLegalModal.tab}
      />
    </div>
  );
};
