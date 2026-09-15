
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Mail, Lock, User as UserIcon, Loader2, AlertCircle, CheckCircle2, Database, ArrowLeft, UserCheck, Sparkles, Building2, Tag, Check, Crown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';
import { partnerService } from '../services/partnerService';
import { LegalModal, LegalTab } from '../components/LegalModal';
import { 
  SubscriptionPlanId, 
  BillingCycle, 
  PLAN_BASIC_PRICE, 
  PLAN_BASIC_ANNUAL_PRICE, 
  PLAN_PRO_PRICE, 
  PLAN_PRO_ANNUAL_PRICE, 
  PLAN_PREMIUM_PRICE, 
  PLAN_PREMIUM_ANNUAL_PRICE 
} from '../services/saasService';
import { formatCurrency } from '../utils/formatters';
import orcaLogo from '../src/assets/images/orcafacil_quote_logo_1788895951950.jpg';

interface LoginPageProps {
  initialMode?: 'login' | 'register';
  initialPlan?: SubscriptionPlanId;
  initialBillingCycle?: BillingCycle;
  onBackToLanding?: () => void;
  onOpenLegal?: (tab: LegalTab) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  initialMode = 'login',
  initialPlan = 'pro',
  initialBillingCycle = 'monthly',
  onBackToLanding,
  onOpenLegal
}) => {
  const { login, register, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(initialPlan);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [partnerMessage, setPartnerMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  const handlePartnerCodeChange = (val: string) => {
    const uppercaseVal = val.toUpperCase().replace(/\s+/g, '');
    setPartnerCode(uppercaseVal);
    if (uppercaseVal.length >= 3) {
      const res = partnerService.validateCode(uppercaseVal);
      if (res.valid && res.partner) {
        setPartnerMessage(`Parceria com ${res.partner.name} identificada! Acesso liberado sem cobrança.`);
      } else {
        setPartnerMessage(null);
      }
    } else {
      setPartnerMessage(null);
    }
  };

  const handleDemoAccess = async () => {
    setError(null);
    setIsDemoLoading(true);
    try {
      await loginAsDemo();
    } catch (err: any) {
      setError(err?.message || 'Erro ao entrar como usuário de demonstração.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !email.includes('@')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    if (!password || password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Por favor, informe seu nome ou nome da sua empresa.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await register(
          email, 
          password, 
          name, 
          partnerCode || undefined,
          selectedPlan,
          billingCycle
        );
        if (res.message) {
          setSuccessMessage(res.message);
        }
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro. Verifique suas credenciais e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {onBackToLanding && (
        <button
          id="btn-back-to-landing"
          onClick={onBackToLanding}
          className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 transition-all shadow-md active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Página Inicial</span>
        </button>
      )}

      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className={`w-full ${mode === 'register' ? 'max-w-2xl' : 'max-w-md'} animate-in fade-in zoom-in duration-300 relative z-10 transition-all`}>
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-xl" />
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/30 border border-white/10 mx-auto ring-1 ring-blue-400/20">
              <img
                src={orcaLogo}
                alt="Logo OrçaFácil Pro"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">
              Orça<span className="text-blue-500">Fácil</span>
            </h1>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md shadow-blue-500/20">
              PRO
            </span>
          </div>
          <p className="text-slate-400 mt-1.5 text-sm">Sistema de orçamentos rápidos para prestadores de serviços</p>

          {isSupabaseConfigured() && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-full text-emerald-400 text-xs font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Acesso Seguro na Nuvem Ativo</span>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl space-y-5">
          {/* Tabs: Entrar vs Criar Conta */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-sm font-semibold">
            <button
              id="tab-login"
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
              className={`py-2 rounded-xl transition-all ${mode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Entrar
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccessMessage(null); }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${mode === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <span>Criar Conta</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-md">
                7d Grátis
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {error && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-3 rounded-xl text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">Nome Completo ou Empresa</label>
                <div className="relative group">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    id="input-register-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Silva Eletricista"
                    className="w-full bg-slate-800/80 border border-slate-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  id="input-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@seuemail.com"
                  className="w-full bg-slate-800/80 border border-slate-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                Senha {mode === 'register' && '(mínimo 6 caracteres)'}
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  id="input-login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/80 border border-slate-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Escolha seu Plano de Acesso
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Você pode alterar ou cancelar a qualquer momento.
                    </p>
                  </div>

                  {/* Alternador Mensal / Anual */}
                  <div className="inline-flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
                    <button
                      id="btn-billing-monthly"
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        billingCycle === 'monthly'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Mensal
                    </button>
                    <button
                      id="btn-billing-annual"
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                        billingCycle === 'annual'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Anual</span>
                      <span className="text-[9px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
                        Economize ~2 meses
                      </span>
                    </button>
                  </div>
                </div>

                {/* Cards dos 3 Planos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Plano Básico */}
                  <div
                    id="plan-card-basic"
                    onClick={() => setSelectedPlan('basic')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                      selectedPlan === 'basic'
                        ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="absolute top-3 right-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedPlan === 'basic' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-600'
                      }`}>
                        {selectedPlan === 'basic' && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-bold text-white">Básico</span>
                      </div>
                      <div className="flex items-baseline gap-1 my-1">
                        <span className="text-base font-black text-white">
                          {billingCycle === 'annual' ? formatCurrency(PLAN_BASIC_ANNUAL_PRICE) : formatCurrency(PLAN_BASIC_PRICE)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {billingCycle === 'annual' ? '/ano' : '/mês'}
                        </span>
                      </div>
                      {billingCycle === 'annual' && (
                        <p className="text-[10px] text-emerald-400 font-semibold mb-1">
                          Equiv. {formatCurrency(PLAN_BASIC_ANNUAL_PRICE / 12)}/mês
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 leading-snug mt-1">
                        Até 20 orçamentos/mês, PDF no WhatsApp e catálogo.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        <Check className="w-2.5 h-2.5" /> 7 dias grátis
                      </span>
                    </div>
                  </div>

                  {/* Plano Pro (Recomendado) */}
                  <div
                    id="plan-card-pro"
                    onClick={() => setSelectedPlan('pro')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                      selectedPlan === 'pro'
                        ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="absolute top-3 right-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedPlan === 'pro' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-600'
                      }`}>
                        {selectedPlan === 'pro' && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-white">Pro Completo</span>
                        <span className="text-[9px] bg-blue-600 text-white font-black px-1.5 py-0.2 rounded">
                          Mais Escolhido
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 my-1">
                        <span className="text-base font-black text-white">
                          {billingCycle === 'annual' ? formatCurrency(PLAN_PRO_ANNUAL_PRICE) : formatCurrency(PLAN_PRO_PRICE)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {billingCycle === 'annual' ? '/ano' : '/mês'}
                        </span>
                      </div>
                      {billingCycle === 'annual' && (
                        <p className="text-[10px] text-emerald-400 font-semibold mb-1">
                          Equiv. {formatCurrency(PLAN_PRO_ANNUAL_PRICE / 12)}/mês
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 leading-snug mt-1">
                        Orçamentos ilimitados, Consultor IA e suporte VIP.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        <Check className="w-2.5 h-2.5" /> 7 dias grátis
                      </span>
                    </div>
                  </div>

                  {/* Plano Premium (Sem teste grátis) */}
                  <div
                    id="plan-card-premium"
                    onClick={() => setSelectedPlan('premium')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                      selectedPlan === 'premium'
                        ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="absolute top-3 right-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedPlan === 'premium' ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'
                      }`}>
                        {selectedPlan === 'premium' && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300">Premium</span>
                      </div>
                      <div className="flex items-baseline gap-1 my-1">
                        <span className="text-base font-black text-amber-400">
                          {billingCycle === 'annual' ? formatCurrency(PLAN_PREMIUM_ANNUAL_PRICE) : formatCurrency(PLAN_PREMIUM_PRICE)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {billingCycle === 'annual' ? '/ano' : '/mês'}
                        </span>
                      </div>
                      {billingCycle === 'annual' && (
                        <p className="text-[10px] text-amber-300/80 font-semibold mb-1">
                          Equiv. {formatCurrency(PLAN_PREMIUM_ANNUAL_PRICE / 12)}/mês
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 leading-snug mt-1">
                        Contratos com Assinatura Digital + Tudo do Plano Pro.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                        Sem teste • Ativação Pix
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feedback Informativo de Trial */}
                {selectedPlan === 'premium' ? (
                  <div className="bg-amber-500/10 border border-amber-500/25 text-amber-300 p-2.5 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Atenção sobre o Plano Premium:</span> Este plano não possui os 7 dias de teste grátis. A ativação é feita diretamente via chave PIX disponibilizada após a criação da conta.
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Período de Teste Grátis:</strong> Você terá <strong>7 dias gratuitos</strong> para utilizar o {selectedPlan === 'pro' ? 'Plano Pro' : 'Plano Básico'} sem nenhuma cobrança inicial.
                    </span>
                  </div>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    <span>Possui Código de Parceria / Convênio? (Opcional)</span>
                  </label>
                </div>
                <div className="relative group">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    id="input-partner-code"
                    type="text"
                    value={partnerCode}
                    onChange={(e) => handlePartnerCodeChange(e.target.value)}
                    placeholder="Ex: PARCEIRO-VIP"
                    className="w-full bg-slate-800/80 border border-slate-700 text-white text-xs font-mono uppercase pl-10 pr-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                  />
                </div>
                {partnerMessage && (
                  <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1 animate-in fade-in">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{partnerMessage}</span>
                  </p>
                )}
                {!partnerMessage && partnerCode.length >= 3 && (
                  <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Código não encontrado ou inativo.</span>
                  </p>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Ao criar sua conta, você declara que leu e concorda com nossos{' '}
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('terms')}
                    className="text-blue-400 hover:text-blue-300 font-semibold underline inline cursor-pointer"
                  >
                    Termos de Uso
                  </button>{' '}
                  e com a nossa{' '}
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('privacy')}
                    className="text-blue-400 hover:text-blue-300 font-semibold underline inline cursor-pointer"
                  >
                    Política de Privacidade (LGPD)
                  </button>
                  . Seus dados e os dados dos seus clientes estão protegidos e não são compartilhados.
                </p>
              </div>
            )}

            <Button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-base font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'register' ? 'Criando sua conta na nuvem...' : 'Entrando...'}
                </>
              ) : (
                mode === 'register' 
                  ? (partnerMessage 
                      ? 'Criar Conta com Parceria Liberada' 
                      : selectedPlan === 'premium'
                        ? `Criar Conta no Plano Premium (${billingCycle === 'annual' ? formatCurrency(PLAN_PREMIUM_ANNUAL_PRICE) + '/ano' : formatCurrency(PLAN_PREMIUM_PRICE) + '/mês'})`
                        : `Criar Conta e Iniciar 7 Dias Grátis (${selectedPlan === 'pro' ? 'Plano Pro' : 'Plano Básico'})`
                    )
                  : 'Entrar'
              )}
            </Button>
          </form>

          {/* Card de Acesso Rápido para Apresentação / Testes */}
          <div className="pt-3 border-t border-slate-800">
            <div className="bg-slate-950/90 border border-blue-500/25 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                  <span>Apresentação do Sistema (Usuário de Teste)</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md">
                  Não-Dono
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ambiente de demonstração com dados modelo (Carlos Silva - Eletricista) sem privilégios de administrador ou dono, ideal para apresentar a clientes e parceiros.
              </p>
              <div className="bg-slate-900/90 p-2.5 rounded-xl text-[11px] font-mono text-slate-300 border border-slate-800 flex justify-between items-center">
                <span>teste@orcafacil.com.br</span>
                <span className="text-slate-500">senha: teste123</span>
              </div>
              <button
                id="btn-login-demo-quick"
                type="button"
                disabled={isDemoLoading}
                onClick={handleDemoAccess}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white text-xs font-bold transition-all border border-slate-700/80 hover:border-slate-600 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isDemoLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    <span>Iniciando ambiente de teste...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Entrar no Modo Demonstração (1 Clique)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-5 space-y-2">
          <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => handleOpenLegal('privacy')}
              className="hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
              <span>Privacidade (LGPD)</span>
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('terms')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Termos de Uso
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('cookies')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Cookies
            </button>
          </div>
          <p className="text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} OrçaFácil Pro &bull; Sistema para Prestadores de Serviços
          </p>
        </div>

        {/* Modal de Privacidade e Termos de Uso quando acionado internamente */}
        <LegalModal
          isOpen={localLegalModal.isOpen}
          onClose={() => setLocalLegalModal(prev => ({ ...prev, isOpen: false }))}
          initialTab={localLegalModal.tab}
        />
      </div>
    </div>
  );
};
