
import React, { useRef } from 'react';
import { ProviderInfo } from '../types';
import { Button } from '../components/Button';
import { ImageIcon, Upload } from 'lucide-react';
import { maskCPF_CNPJ, maskPhone } from '../utils/formatters';

interface SettingsPageProps {
  providerInfo: ProviderInfo;
  onUpdate: (info: ProviderInfo) => void;
  onSave: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ providerInfo, onUpdate, onSave }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

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
        <Button className="w-full py-4 text-lg" onClick={onSave}>Salvar Informações</Button>
      </div>
    </div>
  );
};
