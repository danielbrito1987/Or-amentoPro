import React from 'react';
import { Lock, Sparkles, Check, X, FileText, MessageCircle, Download, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface DemoRestrictedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
  featureName?: string; // Ex: 'Impressão de Orçamento', 'Envio pelo WhatsApp', 'Download em PDF', 'Salvar Orçamento'
}

export const DemoRestrictedModal: React.FC<DemoRestrictedModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  featureName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho Visual */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white p-6 relative">
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-md border border-white/20">
            <Lock size={12} className="text-amber-300" />
            <span>Modo Demonstração (Apenas Visualização)</span>
          </div>

          <h3 className="text-xl font-black text-white leading-tight">
            {featureName ? `Desbloqueie ${featureName}` : 'Cadastre-se para Usar por Completo'}
          </h3>
          <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
            Você está explorando o OrçaFácil Pro no modo de teste rápido. Para emitir orçamentos reais, salvar seus dados e enviar propostas para seus clientes, ative seu acesso gratuito.
          </p>
        </div>

        {/* Vantagens do Cadastro Gratuito */}
        <div className="p-6 space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            O que você desbloqueia ao criar sua conta gratuita:
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
                <FileText size={16} />
              </div>
              <div className="text-xs">
                <strong className="text-slate-800 block font-semibold">Impressão & Download de PDF</strong>
                <span className="text-slate-500">Documentos oficiais com sua logomarca e dados da sua empresa.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                <MessageCircle size={16} />
              </div>
              <div className="text-xs">
                <strong className="text-slate-800 block font-semibold">Envio Direto pelo WhatsApp</strong>
                <span className="text-slate-500">Compartilhe o orçamento detalhado com seu cliente com apenas 1 clique.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg shrink-0 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div className="text-xs">
                <strong className="text-slate-800 block font-semibold">Salvar Dados & Nuvem Permanente</strong>
                <span className="text-slate-500">Seus dados e catálogo de preços salvos com segurança para acessar de qualquer aparelho.</span>
              </div>
            </div>
          </div>

          {/* Chamada para Ação */}
          <div className="pt-2 space-y-2">
            <Button
              variant="primary"
              size="lg"
              onClick={onRegister}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-lg shadow-blue-500/25 py-3.5 text-sm"
              icon={<Sparkles size={18} className="text-amber-300" />}
            >
              Criar Conta Gratuita (7 Dias Grátis)
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 transition-colors cursor-pointer"
            >
              Continuar apenas conhecendo o sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
