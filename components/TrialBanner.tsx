import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  QrCode, 
  Copy, 
  Check, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saasService } from '../services/saasService';
import { formatCurrency } from '../utils/formatters';
import { Button } from './Button';

export const TrialBanner: React.FC = () => {
  const { user, isAdmin, subscriptionInfo, refreshUserStatus } = useAuth();
  const [showPixModal, setShowPixModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Não exibe nada se for Admin ou se o plano já estiver ativo (pago)
  if (isAdmin || subscriptionInfo.status === 'active' || !user) {
    return null;
  }

  const daysLeft = subscriptionInfo.daysRemaining;
  const pixKey = saasService.getPixKey();
  const price = saasService.getMonthlyPrice();

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm no-print shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-blue-600/40">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <div className="p-1 rounded-lg bg-blue-500/20 text-amber-300 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">
              {daysLeft > 1 
                ? `Período de Teste Gratuito: ${daysLeft} dias restantes` 
                : daysLeft === 1 
                ? 'Último dia de teste gratuito!' 
                : 'Seu período de teste vence hoje!'}
            </span>
            <span className="hidden md:inline text-blue-200 ml-1.5 font-normal">
              &bull; Aproveite para testar todas as funcionalidades do sistema.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPixModal(true)}
            className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs transition-all shadow-sm flex items-center gap-1 active:scale-95"
          >
            <span>Garantir Acesso (R$ 59,90/mês)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Rápido de Assinatura Antecipada */}
      {showPixModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowPixModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              Plano Pro OrçaFácil
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Você ainda tem <strong className="text-blue-600">{daysLeft} dias de teste</strong>. Se quiser antecipar sua assinatura mensal para não ter interrupções:
            </p>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">Chave PIX:</span>
                <span className="text-sm font-black text-blue-700">{formatCurrency(price)}/mês</span>
              </div>
              <div className="bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-800 break-all select-all font-semibold mb-2">
                {pixKey}
              </div>
              <Button
                variant={copied ? 'primary' : 'secondary'}
                size="sm"
                className="w-full font-bold"
                onClick={handleCopyPix}
              >
                {copied ? <Check className="w-4 h-4 mr-1 text-white" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Chave Copiada!' : 'Copiar Chave PIX'}
              </Button>
            </div>

            <p className="text-[11px] text-slate-500 text-center mb-4">
              Após a transferência, envie o comprovante no WhatsApp informando seu e-mail (<strong>{user.email}</strong>).
            </p>

            <Button
              variant="primary"
              size="md"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              onClick={() => setShowPixModal(false)}
            >
              Continuar Testando Grátis
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
