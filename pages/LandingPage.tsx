import React, { useState } from 'react';
import { 
  FileText, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Smartphone, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Check, 
  ArrowRight, 
  Layers, 
  Briefcase, 
  Wrench, 
  Paintbrush, 
  Hammer, 
  Wind, 
  CheckCircle2, 
  HelpCircle,
  Share2,
  Lock,
  X,
Crown
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { 
  PLAN_BASIC_PRICE, 
  PLAN_PRO_PRICE, 
  PLAN_PREMIUM_PRICE,
  PLAN_BASIC_ANNUAL_PRICE,
  PLAN_PRO_ANNUAL_PRICE,
  PLAN_PREMIUM_ANNUAL_PRICE,
  BASIC_MONTHLY_QUOTES_LIMIT, 
  TRIAL_DAYS
} from '../services/saasService';
import orcaLogo from '../src/assets/images/orcafacil_quote_logo_1788895951950.jpg';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToRegister
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSegment, setActiveSegment] = useState<'eletrica' | 'climatizacao' | 'pintura' | 'geral'>('eletrica');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const segmentsData = {
    eletrica: {
      title: 'Eletricistas & Manutenção',
      badge: 'Elétrica',
      icon: Zap,
      exampleQuote: {
        customer: 'Residencial Alphaville (Apto 102)',
        items: [
          { name: 'Instalação de Quadro com DR e DPS', price: 420.00 },
          { name: 'Troca de Fiação do Circuito de Chuveiro', price: 280.00 },
          { name: 'Instalação de 6 Spots LED de Embutir', price: 210.00 }
        ],
        total: 910.00
      }
    },
    climatizacao: {
      title: 'Climatização & Refrigeração',
      badge: 'Ar Condicionado',
      icon: Wind,
      exampleQuote: {
        customer: 'Dra. Camila Nogueira (Consultório)',
        items: [
          { name: 'Higienização Completa 12.000 BTUs', price: 190.00 },
          { name: 'Carga de Gás Refrigerante R410A', price: 240.00 },
          { name: 'Substituição de Capacitor de Partida', price: 130.00 }
        ],
        total: 560.00
      }
    },
    pintura: {
      title: 'Pintores & Embelezamento',
      badge: 'Pintura',
      icon: Paintbrush,
      exampleQuote: {
        customer: 'Escritório Contábil Santana',
        items: [
          { name: 'Emassamento e Lixamento (65m²)', price: 975.00 },
          { name: 'Pintura Acrílica Fosca Lavável (2 Demãos)', price: 1300.00 },
          { name: 'Proteção de Rodapés e Pisos', price: 180.00 }
        ],
        total: 2455.00
      }
    },
    geral: {
      title: 'Reformas, Marcenaria & Obras',
      badge: 'Multisserviços',
      icon: Hammer,
      exampleQuote: {
        customer: 'Lucas Silveira (Casa)',
        items: [
          { name: 'Montagem de Guarda-Roupa 6 Portas', price: 260.00 },
          { name: 'Troca de Torneira Monocomando Cozinha', price: 120.00 },
          { name: 'Fixação de Suporte de TV 65 Polegadas', price: 110.00 }
        ],
        total: 490.00
      }
    }
  };

  const currentSegmentData = segmentsData[activeSegment];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* BACKGROUND GLOWS */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 border border-white/10 ring-1 ring-blue-500/30">
              <img
                src={orcaLogo}
                alt="Logo OrçaFácil Pro"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white">
                  Orça<span className="text-blue-500">Fácil</span>
                </span>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Orçamentos Rápidos & Inteligentes</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#ia" className="hover:text-white transition-colors flex items-center gap-1.5 text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Consultor IA</span>
            </a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="hover:text-white transition-colors">Dúvidas</a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              id="btn-nav-login"
              onClick={onGoToLogin}
              className="px-3.5 py-2 text-sm font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              Entrar
            </button>

            <button
              id="btn-nav-register"
              onClick={onGoToRegister}
              className="px-4 py-2 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
            >
              Testar 7 Dias Grátis
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>O Aplicativo de Orçamentos Profissionais para Prestadores do Brasil</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Feche Mais Serviços com Orçamentos em <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">Menos de 2 Minutos</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Crie propostas comerciais impecáveis em <strong>PDF pelo celular ou PC</strong>, envie direto no <strong>WhatsApp</strong> do cliente com 1 clique e consulte preços justos com <strong>Inteligência Artificial</strong>.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                id="btn-hero-register"
                onClick={onGoToRegister}
                className="w-full sm:w-auto px-8 py-4 text-base font-extrabold rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5"
              >
                <span>Começar Teste Grátis de {TRIAL_DAYS} Dias</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Trust checklist */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Sem necessidade de cartão
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Funciona no Celular e Computador
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                {TRIAL_DAYS} dias grátis sem compromisso
              </span>
            </div>
          </div>

          {/* INTERACTIVE MOCKUP SHOWCASE */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-3 sm:p-5 md:p-6 shadow-2xl shadow-blue-950/50 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-semibold text-slate-400">Prévia do Orçamento no OrçaFácil Pro</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Aprovado pelo Cliente
                  </span>
                </div>
              </div>

              {/* MOCKUP CONTENT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Visual Quote Card */}
                <div className="lg:col-span-8 bg-white text-slate-900 p-5 sm:p-6 rounded-2xl shadow-inner border border-slate-200">
                  <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="font-black text-lg text-slate-900 leading-tight">Silva & Oliveira Serviços</h3>
                      <p className="text-xs text-slate-500">CNPJ: 34.567.890/0001-23 • São Paulo - SP</p>
                      <p className="text-xs text-slate-500">WhatsApp: (11) 98765-4321</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Orçamento</span>
                      <span className="font-black text-base text-blue-600">ORC-0024</span>
                    </div>
                  </div>

                  <div className="py-3.5 border-b border-slate-100 text-xs">
                    <p className="font-bold text-slate-800">Cliente: Roberto Almeida Santos</p>
                    <p className="text-slate-600">Av. Brigadeiro Faria Lima, 2200 - São Paulo/SP</p>
                  </div>

                  <div className="py-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400 uppercase text-[10px] border-b border-slate-100">
                          <th className="text-left pb-1.5 font-bold">Item / Descrição</th>
                          <th className="text-center pb-1.5 font-bold">Qtd</th>
                          <th className="text-right pb-1.5 font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2">
                            <p className="font-semibold text-slate-800">Instalação de Tomadas e Pontos 220V</p>
                            <p className="text-[10px] text-slate-500">Passagem de fiação antichama normatizada</p>
                          </td>
                          <td className="py-2 text-center text-slate-600">4 un</td>
                          <td className="py-2 text-right font-bold text-slate-800">R$ 340,00</td>
                        </tr>
                        <tr>
                          <td className="py-2">
                            <p className="font-semibold text-slate-800">Manutenção de Ar Condicionado Split</p>
                            <p className="text-[10px] text-slate-500">Higienização e bactericida completo</p>
                          </td>
                          <td className="py-2 text-center text-slate-600">2 un</td>
                          <td className="py-2 text-right font-bold text-slate-800">R$ 360,00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Condição de Pagamento</span>
                      <span className="text-xs font-semibold text-slate-700">Chave Pix: 34.567.890/0001-23</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Geral</span>
                      <span className="text-xl font-black text-slate-900">R$ 700,00</span>
                    </div>
                  </div>
                </div>

                {/* Lateral Quick Actions & AI Callout */}
                <div className="lg:col-span-4 flex flex-col justify-between gap-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>Consultor de Preço com IA</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      "Para instalação de 4 tomadas e revisão de 2 splits em São Paulo, o valor médio praticado varia entre <strong>R$ 650,00 e R$ 780,00</strong>."
                    </p>
                    <div className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-medium">
                      ✓ Preço competitivo e lucrativo
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ações com 1 Clique</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl text-center text-xs font-bold flex flex-col items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </div>
                      <div className="bg-blue-600/20 border border-blue-500/40 text-blue-300 p-2.5 rounded-xl text-center text-xs font-bold flex flex-col items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>Gerar PDF</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 text-center pt-1">
                      O cliente recebe uma mensagem pronta com o arquivo e dados para Pix.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMAS RESOLVIDOS: ANTES vs. DEPOIS */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              A Diferença Entre Perder Clientes e Fechar Serviços com Confiança
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Veja por que mais de centenas de profissionais abandonaram blocos de papel e mensagens desorganizadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Como era antes */}
            <div className="bg-red-950/20 border border-red-500/25 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center font-black text-xs">✕</div>
                <span>Sem o OrçaFácil Pro</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 shrink-0 font-bold">•</span>
                  <span>Passar valores de cabeça pelo WhatsApp sem detalhamento ou seriedade.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 shrink-0 font-bold">•</span>
                  <span>Cliente pedindo desconto porque a proposta parece amadora ou sem garantia.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 shrink-0 font-bold">•</span>
                  <span>Cobrar barato demais por medo de perder o serviço e tomar prejuízo na obra.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 shrink-0 font-bold">•</span>
                  <span>Perder o histórico do que foi combinado quando o cliente cobra meses depois.</span>
                </li>
              </ul>
            </div>

            {/* Como fica agora */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center font-black text-xs">✓</div>
                <span>Com o OrçaFácil Pro</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0 font-bold">•</span>
                  <span>PDF de alto padrão com seus dados, logo, CNPJ/CPF e chave Pix.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0 font-bold">•</span>
                  <span>Envio no WhatsApp com mensagem cordial e formalização das regras de garantia.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0 font-bold">•</span>
                  <span>Consultor IA sugerindo o valor ideal com base no mercado brasileiro.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 shrink-0 font-bold">•</span>
                  <span>Histórico completo na nuvem, acessível a qualquer momento pelo celular.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* RECURSOS PRINCIPAIS */}
      <section id="recursos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Tudo o que Você Precisa para Gerar Orçamentos que Vendem
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Ferramentas práticas e intuitivas, pensadas para quem está na correria do dia a dia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recurso 1 */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">PDF Profissional Imediato</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Layout elegante com cabeçalho personalizado, dados do cliente, itens descritos, condições de pagamento e prazos.
              </p>
            </div>

            {/* Recurso 2 */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">WhatsApp em 1 Toque</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Abra a conversa do cliente com o orçamento pronto e texto educado formatado para fechar o negócio sem demora.
              </p>
            </div>

            {/* Recurso 3 */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Consultor de Preços com IA</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Não sabe quanto cobrar? Digite o que vai fazer e a Inteligência Artificial calcula faixas de preço sugeridas para o mercado.
              </p>
            </div>

            {/* Recurso 4 */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Catálogo de Serviços & Materiais</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Cadastre seus serviços mais comuns com preço por metro, hora ou unidade. Adicione-os aos orçamentos em segundos.
              </p>
            </div>

            {/* Recurso 5 */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Nuvem Segura & Modo Offline</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Seu app funciona mesmo quando o sinal 4G falha no local da obra e sincroniza tudo automaticamente quando a internet volta.
              </p>
            </div>

            {/* Recurso 6 */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-600/15 border border-sky-500/25 flex items-center justify-center text-sky-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Funciona em Qualquer Dispositivo</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Acesse pelo celular Android, iPhone, tablet ou computador. Instale diretamente na tela inicial como um aplicativo nativo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO IA SPOTLIGHT */}
      <section id="ia" className="py-20 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inteligência Artificial Integrada</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Nunca Mais Fique em Dúvida de Quanto Cobrar
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              O OrçaFácil Pro inclui um estimador de mercado treinado em tabelas práticas do mercado brasileiro (SINAPI, SEBRAE e médias de prestadores).
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Simulação em Tempo Real do Consultor IA</span>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-sm">
              <p className="text-xs text-slate-400 mb-1">Serviço Solicitado:</p>
              <p className="font-bold text-white">"Instalação de 2 ventiladores de teto com controle de parede em apartamento"</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Faixa Mínima</span>
                <span className="text-base font-black text-slate-300">R$ 180,00</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Pontos já existentes</span>
              </div>
              <div className="p-3.5 bg-blue-950/60 border border-blue-500/40 rounded-xl text-center ring-1 ring-blue-500/30">
                <span className="text-[10px] uppercase font-bold text-blue-400 block">Preço Sugerido</span>
                <span className="text-lg font-black text-blue-300">R$ 260,00</span>
                <span className="text-[10px] text-blue-400/80 block mt-0.5">Média recomendada</span>
              </div>
              <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Faixa Máxima</span>
                <span className="text-base font-black text-slate-300">R$ 360,00</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Teto alto / fiação extra</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Você pode aceitar a sugestão com 1 clique e adicioná-la direto na proposta comercial.
            </p>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA EM 3 PASSOS */}
      <section id="como-funciona" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Simples, Direto e Sem Complicação
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Veja como emitir seu primeiro orçamento em menos de 2 minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-600/30">
                01
              </div>
              <h3 className="text-base font-bold text-white">Insira o Cliente & Itens</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Digite o nome do cliente e selecione os itens do seu catálogo pré-cadastrado ou use o consultor IA.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-600/30">
                02
              </div>
              <h3 className="text-base font-bold text-white">Revise Prazos e Chave Pix</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O sistema calcula os totais automaticamente, adiciona seus termos de garantia e sua chave Pix para sinal.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-600/30">
                03
              </div>
              <h3 className="text-base font-bold text-white">Envie no WhatsApp em PDF</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Toque no botão do WhatsApp e envie a mensagem com o PDF anexado. Seu cliente aprova na mesma hora!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS & PREÇOS */}
      <section id="planos" className="py-20 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <span>Planos Transparentes e Sem Surpresas</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Escolha o Plano Perfeito Para o Seu Negócio
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Teste os planos Básico e Pro gratuitamente por 7 dias. Ou opte pelo Plano Premium completo com contratos e assinatura digital.
            </p>

            {/* Alternador Mensal / Anual */}
            <div className="mt-6 inline-flex p-1 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cobrança Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Plano Anual</span>
                <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  Economize ~2 meses
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Card Plano Básico */}
            <div className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">Plano Básico</h3>
                    <p className="text-xs text-slate-400 mt-1">Econômico e direto ao ponto</p>
                  </div>
                  <span className="text-xs font-bold text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                    Econômico
                  </span>
                </div>

                <div className="py-4 border-y border-slate-800 my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-slate-400">R$</span>
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {billingCycle === 'annual'
                        ? formatCurrency(PLAN_BASIC_ANNUAL_PRICE).replace('R$', '').trim()
                        : formatCurrency(PLAN_BASIC_PRICE).replace('R$', '').trim()}
                    </span>
                    <span className="text-slate-400 text-xs font-medium">
                      {billingCycle === 'annual' ? '/ano' : '/mês'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-[11px] text-blue-400 font-semibold mt-1">
                      Equivalente a {formatCurrency(PLAN_BASIC_ANNUAL_PRICE / 12)}/mês
                    </p>
                  )}
                  <p className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 7 dias de teste grátis • Sem cobrança hoje
                  </p>
                </div>

                <ul className="py-6 space-y-3.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center gap-2.5 font-medium text-white">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Até <strong>{BASIC_MONTHLY_QUOTES_LIMIT} orçamentos</strong> por mês</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Envio de PDF direto no WhatsApp em 1 toque</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Catálogo de serviços e produtos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Sua logo, CNPJ/CPF e chave Pix na proposta</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Sincronização em nuvem e modo offline</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-500 line-through">
                    <X className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Sem Consultor de Preços por IA</span>
                  </li>
                </ul>
              </div>

              <div>
                <button
                  id="btn-pricing-basic-register"
                  onClick={onGoToRegister}
                  className="w-full py-3.5 text-sm sm:text-base font-bold rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all active:scale-[0.98] cursor-pointer"
                >
                  Criar Conta e Testar 7 Dias Grátis
                </button>
                <p className="text-[11px] text-slate-500 text-center mt-2.5">
                  7 dias grátis para testar sem pagar nada hoje
                </p>
              </div>
            </div>

            {/* Card Plano Pro */}
            <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-blue-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-blue-950/60 relative transition-all">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Mais Escolhido • Completo</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4 pt-1">
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-1.5">
                      Plano Pro Completo
                    </h3>
                    <p className="text-xs text-blue-200 mt-1">Acesso ilimitado e IA para fechar mais e melhor</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                    Recomendado
                  </span>
                </div>

                <div className="py-4 border-y border-slate-800 my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-slate-400">R$</span>
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {billingCycle === 'annual'
                        ? formatCurrency(PLAN_PRO_ANNUAL_PRICE).replace('R$', '').trim()
                        : formatCurrency(PLAN_PRO_PRICE).replace('R$', '').trim()}
                    </span>
                    <span className="text-slate-400 text-xs font-medium">
                      {billingCycle === 'annual' ? '/ano' : '/mês'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-[11px] text-blue-300 font-semibold mt-1">
                      Equivalente a {formatCurrency(PLAN_PRO_ANNUAL_PRICE / 12)}/mês
                    </p>
                  )}
                  <p className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 7 dias de teste grátis com todos os recursos liberados
                  </p>
                </div>

                <ul className="py-6 space-y-3.5 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-center gap-2.5 font-bold text-white">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Orçamentos <strong>ILIMITADOS</strong> em PDF</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-bold text-amber-300 bg-amber-950/30 p-2 rounded-xl border border-amber-500/25">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Consultor de Preços com Inteligência Artificial</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Envio Direto no WhatsApp em 1 Toque</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Catálogo ilimitado de serviços e produtos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Sua logo, CNPJ/CPF e chave Pix na proposta</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Sincronização em nuvem e modo offline</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Suporte prioritário via WhatsApp</span>
                  </li>
                </ul>
              </div>

              <div>
                <button
                  id="btn-pricing-pro-register"
                  onClick={onGoToRegister}
                  className="w-full py-4 text-base font-extrabold rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] cursor-pointer"
                >
                  Criar Conta e Testar Plano Pro (7 Dias)
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2.5">
                  Não cobramos nada hoje • Liberação imediata
                </p>
              </div>
            </div>

            {/* Card Plano Premium */}
            <div className="relative rounded-3xl p-8 bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900 border-2 border-amber-400/80 shadow-2xl shadow-amber-500/20 flex flex-col justify-between overflow-hidden ring-1 ring-amber-400/30">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider py-1.5 px-4 rounded-bl-xl shadow-lg shadow-amber-500/30 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                Plano Premium ⭐
              </div>

              <div>
                <div className="flex items-center justify-between mb-4 pt-1">
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-1.5">
                      Plano Premium
                    </h3>
                    <p className="text-xs text-slate-400 min-h-[36px] mb-4">
                      Para profissionais estabelecidos que buscam autonomia, contratos jurídicos e automação total.
                    </p>
                  </div>
                </div>

                <div className="py-4 border-y border-slate-800 my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-slate-400">R$</span>
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {billingCycle === 'annual'
                        ? formatCurrency(PLAN_PREMIUM_ANNUAL_PRICE).replace('R$', '').trim()
                        : formatCurrency(PLAN_PREMIUM_PRICE).replace('R$', '').trim()}
                    </span>
                    <span className="text-slate-400 text-xs font-medium">
                      {billingCycle === 'annual' ? '/ano' : '/mês'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-[11px] text-amber-300 font-semibold mt-1">
                      Equivalente a {formatCurrency(PLAN_PREMIUM_ANNUAL_PRICE / 12)}/mês
                    </p>
                  )}
                  <p className="text-[11px] text-amber-400 font-semibold mt-2 flex items-center gap-1">
                    <span>⚡ Sem teste grátis • Ativação direta via Pix</span>
                  </p>
                </div>

                <ul className="py-6 space-y-3.5 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-center gap-2.5 font-bold text-white">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Gestão <strong>COMPLETA</strong> dos seus contratos</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-bold text-white">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Assinatura <strong>DIGITAL</strong> dos contratos</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-bold text-white">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Orçamentos <strong>ILIMITADOS</strong> em PDF</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-bold text-amber-200 bg-amber-500/10 p-2.5 rounded-xl border border-amber-400/30">
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <span><strong>IA Exclusiva</strong> (descrições & termos automáticos)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Envio 1-clique via WhatsApp com link direto</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Catálogo ilimitado de serviços & produtos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Suporte prioritário via WhatsApp</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onGoToRegister}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span>Cadastrar no Plano Premium</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Perguntas Frequentes (FAQ)
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5">Tire todas as suas dúvidas sobre o OrçaFácil Pro</p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Qual é a diferença entre o Plano Básico (R$ 29,90) e o Plano Pro (R$ 59,90)?',
                a: 'O Plano Básico (R$ 29,90/mês) permite emitir até 20 orçamentos mensais profissionais em PDF e WhatsApp com a sua logo. O Plano Pro (R$ 59,90/mês) oferece orçamentos 100% ilimitados e inclui o Consultor de Preços com Inteligência Artificial para você saber exatamente as faixas de preço sugeridas pelo mercado.'
              },
              {
                q: 'Preciso cadastrar cartão de crédito para fazer o teste gratuito?',
                a: 'Não! O teste de 7 dias é totalmente livre para os 2 planos. Você cria sua conta apenas com nome, e-mail e senha e começa a usar imediatamente sem cadastrar cartão.'
              },
              {
                q: 'Funciona no celular? Preciso baixar na Play Store ou Apple Store?',
                a: 'Sim! O OrçaFácil Pro funciona diretamente pelo navegador do seu celular (Chrome, Safari, etc.) e você pode adicionar o ícone à tela inicial como um app nativo, sem ocupar a memória do seu aparelho.'
              },
              {
                q: 'Como o meu cliente recebe o orçamento?',
                a: 'Você pode enviar diretamente pelo WhatsApp com 1 clique. O cliente recebe uma mensagem formal com os detalhes e o link/arquivo do PDF profissional com sua marca e dados para pagamento Pix.'
              },
              {
                q: 'Como funciona o Consultor de Preços com IA?',
                a: 'Ao adicionar um serviço, você pode digitar o que vai fazer (ex: "instalação de chuveiro 220v"). A IA analisa o serviço e indica faixas de preço mínima, sugerida e máxima baseadas na média brasileira.'
              },
              {
                q: 'Se eu ficar sem internet na obra, ainda consigo usar?',
                a: 'Sim! O OrçaFácil Pro possui tecnologia offline. Seus dados e orçamentos ficam gravados com segurança no seu aparelho e são sincronizados com a nuvem assim que a conexão retornar.'
              }
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 text-left flex items-center justify-between text-sm font-bold text-slate-200 hover:text-white"
                >
                  <span>{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="p-4 pt-0 text-xs sm:text-sm text-slate-400 border-t border-slate-800/50 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Comece a Fechar Orçamentos Profissionais Hoje Mesmo
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Junte-se aos prestadores que valorizam sua mão de obra e conquistam mais clientes com propostas organizadas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="btn-footer-cta-register"
              onClick={onGoToRegister}
              className="w-full sm:w-auto px-8 py-4 text-base font-extrabold rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              Criar Conta Grátis ({TRIAL_DAYS} Dias)
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm">
              Orça<span className="text-blue-500">Fácil</span> PRO
            </span>
            <span>&bull; &copy; {new Date().getFullYear()} Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <button onClick={onGoToLogin} className="hover:text-white transition-colors">Entrar</button>
            <button onClick={onGoToRegister} className="hover:text-white transition-colors">Criar Conta</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
