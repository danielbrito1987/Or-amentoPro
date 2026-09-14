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
  ShieldCheck,
  Zap,
  XCircle,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  saasService, 
  SubscriptionPlanId, 
  SUBSCRIPTION_PLANS, 
  BASIC_MONTHLY_QUOTES_LIMIT 
} from '../services/saasService';
import { formatCurrency } from '../utils/formatters';
import { Button } from './Button';

export const TrialBanner: React.FC = () => {
  const { user, isAdmin, subscriptionInfo, refreshUserStatus } = useAuth();
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>('pro');
  const [copied, setCopied] = useState(false);

  // Não exibe nada se for Admin ou se o plano já estiver ativo (pago)
  if (isAdmin || subscriptionInfo.status === 'active' || !user) {
    return null;
  }

  const daysLeft = subscriptionInfo.daysRemaining;
  const pixKey = saasService.getPixKey();
  const currentPlan = SUBSCRIPTION_PLANS[selectedPlan];
  const price = currentPlan.price;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleNotifyWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá! Estou antecipando minha assinatura no ${currentPlan.name} (${formatCurrency(currentPlan.price)}/mês) para o e-mail: ${user.email}. Segue meu comprovante de PIX!`
    );
    window.open(`https://wa.me/55?text=${text}`, '_blank');
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
                ? `Período de Teste Gratuito (7 Dias): ${daysLeft} dias restantes` 
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
            className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs transition-all shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
          >
            <span>Ver Planos (a partir de {formatCurrency(SUBSCRIPTION_PLANS.basic.price)}/mês)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Rápido de Assinatura Antecipada */}
      {showPixModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-800 relative animate-in fade-in zoom-in-95 my-auto">
            <button
              onClick={() => setShowPixModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              Escolha seu Plano de Assinatura
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Você ainda tem <strong className="text-blue-600">{daysLeft} dias de teste</strong>. Se quiser antecipar sua assinatura para não ter interrupções:
            </p>

            {/* Seletor dos 2 Planos */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div
                onClick={() => setSelectedPlan('basic')}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                  selectedPlan === 'basic'
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Básico</span>
                  <span className="text-[10px] text-slate-500 font-medium">Econômico</span>
                </div>
                <div className="text-lg font-black text-slate-900 mb-1.5">
                  {formatCurrency(SUBSCRIPTION_PLANS.basic.price)}<span className="text-xs font-normal text-slate-500">/mês</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-600">
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>Até {BASIC_MONTHLY_QUOTES_LIMIT} orç./mês</span>
                  </li>
                  <li className="flex items-center gap-1 text-slate-400">
                    <XCircle className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Sem Consultor IA</span>
                  </li>
                </ul>
              </div>

              <div
                onClick={() => setSelectedPlan('pro')}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer text-left relative ${
                  selectedPlan === 'pro'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Pro
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                    Completo
                  </span>
                </div>
                <div className="text-lg font-black text-indigo-950 mb-1.5">
                  {formatCurrency(SUBSCRIPTION_PLANS.pro.price)}<span className="text-xs font-normal text-slate-500">/mês</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-700 font-medium">
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Orçamentos ILIMITADOS</span>
                  </li>
                  <li className="flex items-center gap-1 text-indigo-900">
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Consultor IA incluso</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Chave PIX */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl mb-4 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">Chave PIX ({currentPlan.name}):</span>
                <span className="text-xs font-black text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {formatCurrency(price)}/mês
                </span>
              </div>
              <div className="bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-800 break-all select-all font-semibold mb-2">
                {pixKey}
              </div>
              <Button
                variant={copied ? 'primary' : 'secondary'}
                size="sm"
                className="w-full font-bold text-xs"
                onClick={handleCopyPix}
              >
                {copied ? <Check className="w-4 h-4 mr-1 text-white" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Chave Copiada!' : 'Copiar Chave PIX'}
              </Button>
            </div>

            <p className="text-[11px] text-slate-500 text-center mb-3">
              Após o PIX, envie o comprovante no WhatsApp informando seu e-mail (<strong>{user.email}</strong>).
            </p>

            <div className="space-y-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={handleNotifyWhatsApp}
                icon={<MessageCircle className="w-4 h-4" />}
              >
                Enviar Comprovante no WhatsApp
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-600"
                onClick={() => setShowPixModal(false)}
              >
                Continuar Testando Grátis
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
