import React, { useState } from 'react';
import { 
  ShieldAlert, 
  LogOut, 
  Copy, 
  Check, 
  Send, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  Lock,
  MessageCircle,
  HelpCircle,
  RefreshCw,
  Handshake,
  Tag,
  Building2,
  Zap,
  XCircle,
  X
} from 'lucide-react';
import { Button } from './Button';
import { 
  saasService, 
  SubscriptionPlanId, 
  BillingCycle,
  SUBSCRIPTION_PLANS, 
  BASIC_MONTHLY_QUOTES_LIMIT 
} from '../services/saasService';
import { partnerService } from '../services/partnerService';
import { formatCurrency } from '../utils/formatters';
import { analyticsService } from '../services/analyticsService';

interface SubscriptionPaywallModalProps {
  userEmail?: string;
  userName?: string;
  onLogout: () => void;
  onCheckStatus?: () => void;
  initialPlan?: SubscriptionPlanId;
  initialBillingCycle?: BillingCycle;
  onClose?: () => void;
  customBadge?: string;
  customTitle?: string;
  customSubtitle?: string;
}

export const SubscriptionPaywallModal: React.FC<SubscriptionPaywallModalProps> = ({
  userEmail,
  userName,
  onLogout,
  onCheckStatus,
  initialPlan = 'pro',
  initialBillingCycle = 'monthly',
  onClose,
  customBadge,
  customTitle,
  customSubtitle
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(initialPlan);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [partnerFeedback, setPartnerFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isApplyingPartner, setIsApplyingPartner] = useState(false);
  const [showPartnerField, setShowPartnerField] = useState(false);

  const pixKey = saasService.getPixKey();
  const currentPlanConfig = SUBSCRIPTION_PLANS[selectedPlan];
  const price = billingCycle === 'annual' ? currentPlanConfig.annualPrice : currentPlanConfig.price;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    analyticsService.trackPixCopy(selectedPlan, billingCycle, price);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleNotifyWhatsApp = () => {
    analyticsService.trackNotifyPaymentWhatsApp(selectedPlan, billingCycle, price);
    const cycleText = billingCycle === 'annual' ? 'anual' : 'mensal';
    const planLabel = `${currentPlanConfig.name} (${formatCurrency(price)}/${billingCycle === 'annual' ? 'ano' : 'mês'})`;

    const text = encodeURIComponent(
      `Olá! Realizei o pagamento via PIX da assinatura ${cycleText} do OrçaFácil no ${planLabel} para o e-mail cadastrado: ${userEmail || ''}. Poderia confirmar a ativação do meu acesso, por gentileza?`
    );
    window.open(`https://wa.me/55?text=${text}`, '_blank');
  };

  const handleApplyPartnerCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCodeInput.trim() || !userEmail) return;

    setIsApplyingPartner(true);
    setPartnerFeedback(null);

    try {
      const validation = partnerService.validateCode(partnerCodeInput.trim(), userEmail);
      if (!validation.valid || !validation.partner) {
        setPartnerFeedback({
          type: 'error',
          message: validation.message || 'Código de indicação inválido ou não encontrado.'
        });
        setIsApplyingPartner(false);
        return;
      }

      const partner = validation.partner;

      // Se for o próprio parceiro credenciado (e-mail coincide com a conta do parceiro cadastrado)
      if (validation.isPartnerAccount) {
        const days = partner.accessType === 'dias' ? partner.accessDays : undefined;

        await saasService.setPartnerAccessForUser(userEmail, partner.name, partner.code, days);

        setPartnerFeedback({
          type: 'success',
          message: `Conta VIP do Parceiro "${partner.name}" confirmada! Seu acesso gratuito ilimitado foi ativado.`
        });

        setTimeout(() => {
          if (onCheckStatus) onCheckStatus();
        }, 1500);
      } else {
        // É uma empresa ou prestador indicado pelo parceiro:
        // As empresas indicadas pagam o sistema normalmente após os 7 dias de teste grátis
        await saasService.linkUserToReferralPartner(userEmail, partner.name, partner.code);
        setPartnerFeedback({
          type: 'error',
          message: `Indicação do parceiro ${partner.name} vinculada! O acesso gratuito VIP é exclusivo para o próprio profissional parceiro. As empresas indicadas contam com 7 dias de teste grátis e assinam normalmente via PIX acima para continuar utilizando.`
        });
      }
    } catch (err: any) {
      setPartnerFeedback({
        type: 'error',
        message: err.message || 'Erro ao processar código de parceria.'
      });
    } finally {
      setIsApplyingPartner(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    if (userEmail) {
      await saasService.fetchRemoteSubscriptionStatus(userEmail);
    }
    setTimeout(() => {
      setChecking(false);
      if (onCheckStatus) onCheckStatus();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-slate-200 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Faixa superior de destaque */}
        <div className="h-2.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500" />

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-10 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 sm:p-8">
          {/* Tag de Status */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 mb-4">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{customBadge || 'Período de Teste Grátis (7 Dias) Concluído'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            {customTitle || 'Escolha seu Plano de Assinatura'}
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
            {customSubtitle || 'Continue emitindo propostas comerciais elegantes e fechando mais serviços. Escolha o plano que melhor atende sua rotina:'}
          </p>

          {/* Seletor Ciclo de Cobrança: Mensal vs Anual */}
          <div className="flex items-center justify-center mb-5">
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Anual</span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                  billingCycle === 'annual' ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  Economize até 17%
                </span>
              </button>
            </div>
          </div>

          {/* Seletor dos 3 Planos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-left">
            {/* Card Plano Básico */}
            <div
              onClick={() => setSelectedPlan('basic')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                selectedPlan === 'basic'
                  ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Plano Básico
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  Econômico
                </span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-black text-slate-900">
                  {billingCycle === 'annual' 
                    ? formatCurrency(SUBSCRIPTION_PLANS.basic.annualPrice)
                    : formatCurrency(SUBSCRIPTION_PLANS.basic.price)}
                </span>
                <span className="text-xs text-slate-500">
                  {billingCycle === 'annual' ? '/ano' : '/mês'}
                </span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-[10px] text-emerald-600 font-semibold mb-2">
                  Equivalente a {formatCurrency(SUBSCRIPTION_PLANS.basic.annualPrice / 12)}/mês
                </p>
              )}
              <p className="text-[11px] text-slate-600 mb-3">
                Para profissionais que precisam de propostas organizadas com custo reduzido.
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Até {BASIC_MONTHLY_QUOTES_LIMIT} orçamentos/mês</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>PDF com sua logo</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Sem Consultor IA</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Sem Contratos</span>
                </div>
              </div>
            </div>

            {/* Card Plano Pro */}
            <div
              onClick={() => setSelectedPlan('pro')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                selectedPlan === 'pro'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Plano Pro
                </span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  Mais Escolhido
                </span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-black text-indigo-950">
                  {billingCycle === 'annual' 
                    ? formatCurrency(SUBSCRIPTION_PLANS.pro.annualPrice)
                    : formatCurrency(SUBSCRIPTION_PLANS.pro.price)}
                </span>
                <span className="text-xs text-slate-500">
                  {billingCycle === 'annual' ? '/ano' : '/mês'}
                </span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-[10px] text-emerald-600 font-semibold mb-2">
                  Equivalente a {formatCurrency(SUBSCRIPTION_PLANS.pro.annualPrice / 12)}/mês
                </p>
              )}
              <p className="text-[11px] text-slate-600 mb-3">
                Acesso irrestrito com inteligência artificial para orçar e fechar negócios.
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Orçamentos ILIMITADOS</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Consultor de Preços com IA</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Envio WhatsApp em 1 clique</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Sem Módulo de Contratos</span>
                </div>
              </div>
            </div>

            {/* Card Plano Premium (Contratos + Assinatura Digital) */}
            <div
              onClick={() => setSelectedPlan('premium')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                selectedPlan === 'premium'
                  ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                Mais Completo
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Plano Premium
                </span>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                  Contratos
                </span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-black text-amber-950">
                  {billingCycle === 'annual' 
                    ? formatCurrency(SUBSCRIPTION_PLANS.premium.annualPrice)
                    : formatCurrency(SUBSCRIPTION_PLANS.premium.price)}
                </span>
                <span className="text-xs text-slate-500">
                  {billingCycle === 'annual' ? '/ano' : '/mês'}
                </span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-[10px] text-amber-800 font-semibold mb-2">
                  Equivalente a {formatCurrency(SUBSCRIPTION_PLANS.premium.annualPrice / 12)}/mês
                </p>
              )}
              <p className="text-[11px] text-slate-600 mb-3">
                Orçamentos com geração de contrato e assinatura digital com valor jurídico.
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Contratos de Serviços</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Assinatura Digital no Sistema</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Envio WhatsApp/E-mail</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tudo do Pro + IA ilimitada</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bloco de Pagamento PIX */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600" />
                Pagamento via PIX ({currentPlanConfig.name} - {billingCycle === 'annual' ? 'Anual' : 'Mensal'}):
              </span>
              <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                Valor: <strong className="text-blue-600">{formatCurrency(price)}</strong>/{billingCycle === 'annual' ? 'ano' : 'mês'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3 mt-3">
              <div className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 break-all select-all font-semibold">
                {pixKey}
              </div>
              <Button
                type="button"
                variant={copied ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleCopyPix}
                className="shrink-0 font-bold"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-white" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1 text-slate-600" />
                    Copiar Chave PIX
                  </>
                )}
              </Button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              * Ao fazer o PIX de <strong>{formatCurrency(price)}</strong> referente ao {currentPlanConfig.name} ({billingCycle === 'annual' ? 'Plano Anual' : 'Plano Mensal'}), envie o comprovante no WhatsApp informando seu e-mail (<strong>{userEmail}</strong>) para ativarmos seu plano na hora.
            </p>
          </div>

          {/* Opção para Resgatar Código de Parceria / Cupom VIP do Profissional Parceiro */}
          <div className="mb-6 border border-indigo-200 bg-indigo-50/50 rounded-2xl p-4 text-left transition-all">
            {!showPartnerField ? (
              <button
                type="button"
                onClick={() => setShowPartnerField(true)}
                className="w-full flex items-center justify-between text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Handshake className="w-4 h-4 text-indigo-600" />
                  <span>É você o(a) profissional parceiro(a) credenciado(a) (Designer / Arquiteto)?</span>
                </span>
                <span className="text-[11px] underline font-bold">Ativar Acesso VIP</span>
              </button>
            ) : (
              <form onSubmit={handleApplyPartnerCode} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    Ativar Acesso VIP do Profissional Parceiro
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPartnerField(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    Fechar
                  </button>
                </div>

                <p className="text-[11px] text-slate-600">
                  O acesso gratuito VIP é liberado exclusivamente para a conta do profissional parceiro. Empresas e prestadores indicados contam com 7 dias de teste grátis e assinam via PIX acima.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={partnerCodeInput}
                    onChange={(e) => setPartnerCodeInput(e.target.value)}
                    placeholder="Ex: DESIGNER-VIP"
                    className="flex-1 bg-white border border-indigo-200 uppercase font-mono tracking-wider rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isApplyingPartner || !partnerCodeInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0"
                  >
                    {isApplyingPartner ? 'Validando...' : 'Ativar VIP'}
                  </Button>
                </div>

                {partnerFeedback && (
                  <p className={`text-xs font-medium rounded-lg p-2 ${
                    partnerFeedback.type === 'success' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {partnerFeedback.message}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Ações */}
          <div className="space-y-2.5">
            <Button
              id="btn-confirm-whatsapp"
              onClick={handleNotifyWhatsApp}
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20"
              icon={<MessageCircle className="w-5 h-5 text-white" />}
            >
              Já paguei o {currentPlanConfig.name}, enviar no WhatsApp
            </Button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="secondary"
                size="md"
                onClick={handleCheck}
                disabled={checking}
                className="w-full font-semibold text-xs sm:text-sm"
                icon={<RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />}
              >
                {checking ? 'Verificando...' : 'Verificar Acesso'}
              </Button>

              {onClose ? (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={onClose}
                  className="w-full font-semibold text-xs sm:text-sm text-slate-600 hover:text-slate-800"
                >
                  Voltar / Fechar
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={onLogout}
                  className="w-full font-semibold text-xs sm:text-sm text-slate-500 hover:text-slate-800"
                  icon={<LogOut className="w-4 h-4" />}
                >
                  Sair da Conta
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
