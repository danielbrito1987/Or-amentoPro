import React, { useState } from 'react';
import { 
  Calculator, 
  FileText, 
  Zap, 
  Paintbrush, 
  Hammer, 
  Sparkles, 
  Check, 
  Copy, 
  ArrowRight, 
  FolderCheck, 
  BadgePercent, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  BookOpen,
  DollarSign,
  TrendingUp,
  FileCheck,
  Send,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { analyticsService } from '../services/analyticsService';

interface SeoContentHubProps {
  onGoToRegister: () => void;
}

type TabType = 'como-cobrar' | 'como-organizar' | 'modelo-eletricista' | 'modelo-pintor' | 'modelo-pedreiro';

export const SeoContentHub: React.FC<SeoContentHubProps> = ({ onGoToRegister }) => {
  const [activeTab, setActiveTab] = useState<TabType>('como-cobrar');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Estados para a mini calculadora interativa de mão de obra
  const [salarioDesejado, setSalarioDesejado] = useState<number>(5000);
  const [diasPorMes, setDiasPorMes] = useState<number>(22);
  const [horasPorDia, setHorasPorDia] = useState<number>(8);
  const [custosFixos, setCustosFixos] = useState<number>(1200); // Gasolina, internet, ferramentas, MEI
  const [margemLucro, setMargemLucro] = useState<number>(25); // %

  // Cálculos da hora técnica
  const totalHorasUteis = Math.max(1, diasPorMes * horasPorDia);
  const custoHoraBase = (salarioDesejado + custosFixos) / totalHorasUteis;
  const valorHoraComLucro = custoHoraBase * (1 + margemLucro / 100);
  const valorDiariaSugerida = valorHoraComLucro * horasPorDia;

  const handleCopyText = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 3000);
    analyticsService.trackEvent('copy_seo_template', { section: sectionId });
  };

  return (
    <section id="guias-modelos" className="py-20 bg-slate-950/90 border-t border-slate-800 relative">
      {/* Luz ambiente de fundo */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Cabeçalho SEO da Seção */}
        <header className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Central de Conhecimento & Modelos Profissionais Gratuitos</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Aprenda a Precificar, Organizar e Emitir Orçamentos que Vendem
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            Conteúdos práticos, fórmulas de precificação e modelos prontos de orçamentos para 
            <strong> Eletricistas, Pintores e Pedreiros</strong> fecharem propostas com autoridade e lucro garantido.
          </p>
        </header>

        {/* Barra de Navegação por Abas (Otimizada para Mobile e Desktop) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar justify-start sm:justify-center">
          {[
            { id: 'como-cobrar', label: 'Como Cobrar por um Serviço', icon: Calculator },
            { id: 'como-organizar', label: 'Como Organizar Orçamentos', icon: FolderCheck },
            { id: 'modelo-eletricista', label: 'Modelo: Eletricista', icon: Zap },
            { id: 'modelo-pintor', label: 'Modelo: Pintor', icon: Paintbrush },
            { id: 'modelo-pedreiro', label: 'Modelo: Pedreiro', icon: Hammer }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  analyticsService.trackEvent('click_seo_tab', { tab: tab.id });
                }}
                className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/50'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-sm">
          
          {/* ============================================================ */}
          {/* GUIA 1: COMO COBRAR POR UM SERVIÇO */}
          {/* ============================================================ */}
          {activeTab === 'como-cobrar' && (
            <article className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-slate-800 pb-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                  <span>Guia de Precificação</span>
                  <span>•</span>
                  <span>Hora Técnica & Lucro Real</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Como Cobrar por um Serviço: O Guia Definitivo da Hora Técnica
                </h3>
                <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
                  O erro número 1 dos autônomos e MEIs é <strong>passar preço "de cabeça"</strong> ou copiar o valor do vizinho. 
                  Se você não calcular seus custos fixos, depreciação de ferramentas e impostos, acabará trabalhando de graça ou pagando para trabalhar.
                </p>
              </div>

              {/* Grid explicativo dos 4 pilares */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm mb-2">
                    1
                  </div>
                  <h4 className="font-bold text-white text-sm">Pró-labore Pessoal</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Quanto você quer tirar de salário líquido no final do mês para sustentar sua família.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm mb-2">
                    2
                  </div>
                  <h4 className="font-bold text-white text-sm">Custos Fixos Mensais</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Combustível, manutenção do veículo, plano de celular, DAS do MEI, contador e EPIs.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm mb-2">
                    3
                  </div>
                  <h4 className="font-bold text-white text-sm">Horas Produtivas Reais</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Você não fatura 8h por dia. Desloque 2h para trânsito, visitas e compra de materiais.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm mb-2">
                    4
                  </div>
                  <h4 className="font-bold text-white text-sm">Margem de Lucro da Empresa</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Reserva financeira para comprar ferramentas melhores, emergências e reinvestir no negócio.
                  </p>
                </div>
              </div>

              {/* CALCULADORA INTERATIVA DE HORA TÉCNICA */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 p-5 sm:p-8 rounded-3xl border border-blue-500/30 shadow-xl">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                      <Calculator className="w-4 h-4" />
                      <span>Simulador Interativo em Tempo Real</span>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Calcule sua Hora Técnica Ideal Agora
                    </h4>
                    <p className="text-xs text-slate-400">
                      Ajuste os valores abaixo para descobrir quanto você realmente precisa cobrar por hora e por diária.
                    </p>
                  </div>
                  <div className="bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Fórmula Validada para Prestadores</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 py-6">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Salário Desejado no Mês:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500">R$</span>
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        value={salarioDesejado}
                        onChange={(e) => setSalarioDesejado(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">O que vai para seu bolso</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Custos Fixos da Empresa:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={custosFixos}
                        onChange={(e) => setCustosFixos(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Gasolina, MEI, ferramentas, celular</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Dias Trabalhados no Mês:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={diasPorMes}
                      onChange={(e) => setDiasPorMes(Number(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Normalmente 20 a 24 dias úteis</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Margem de Lucro (%):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={margemLucro}
                        onChange={(e) => setMargemLucro(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pr-8 pl-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-500">%</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Recomendado entre 20% e 35%</span>
                  </div>
                </div>

                {/* RESULTADO DA HORA TÉCNICA */}
                <div className="mt-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left items-center">
                  <div className="border-b sm:border-b-0 sm:border-r border-slate-800 pb-3 sm:pb-0 sm:pr-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Custo Mínimo por Hora</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-200">
                      {formatCurrency(custoHoraBase)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Ponto de equilíbrio (zero lucro)</span>
                  </div>

                  <div className="border-b sm:border-b-0 sm:border-r border-slate-800 pb-3 sm:pb-0 sm:px-4">
                    <span className="text-[11px] font-bold text-blue-400 uppercase block">Sua Hora Técnica Sugerida</span>
                    <span className="text-2xl sm:text-3xl font-black text-blue-400">
                      {formatCurrency(valorHoraComLucro)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold block">✓ Com {margemLucro}% de lucro líquido</span>
                  </div>

                  <div className="sm:pl-4">
                    <span className="text-[11px] font-bold text-amber-400 uppercase block">Diária Mínima de Trabalho</span>
                    <span className="text-2xl sm:text-3xl font-black text-amber-300">
                      {formatCurrency(valorDiariaSugerida)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Baseada em {horasPorDia}h/dia de dedicação</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
                  <p className="text-xs text-slate-300">
                    💡 <strong>Dica de Ouro:</strong> Nunca cobre menos que <strong>{formatCurrency(valorHoraComLucro)}/h</strong> em serviços rápidos. No OrçaFácil Pro, você cadastra essa hora técnica no seu catálogo e o sistema calcula os orçamentos em segundos!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      analyticsService.trackEvent('click_cta_from_seo', { origin: 'calculator' });
                      onGoToRegister();
                    }}
                    className="shrink-0 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Salvar no Catálogo Grátis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabela Comparativa de Métodos de Cobrança */}
              <div className="space-y-4 pt-4">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span>Qual Modelo de Cobrança Escolher para Cada Situação?</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-slate-300 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase text-[11px]">
                        <th className="p-3 font-bold">Tipo de Cobrança</th>
                        <th className="p-3 font-bold">Quando Usar</th>
                        <th className="p-3 font-bold">Vantagem</th>
                        <th className="p-3 font-bold">Risco a Evitar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="p-3 font-bold text-white">Por Hora Técnica</td>
                        <td className="p-3">Manutenções imprevisíveis, caça a curtos-circuitos, pequenos reparos.</td>
                        <td className="p-3 text-emerald-400">Você não toma prejuízo se a obra atrasar.</td>
                        <td className="p-3 text-slate-400">Cliente desconfiado achar que você está "enrolando".</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Por Empreita Fechada (Pacote)</td>
                        <td className="p-3">Instalação de quadro novo, pintura de cômodo completo, reforma de banheiro.</td>
                        <td className="p-3 text-emerald-400">Cliente sabe o preço total exato e fecha mais rápido.</td>
                        <td className="p-3 text-amber-400">Esquecer de cobrar "serviços extras" fora do escopo.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Por Metro Quadrado (m²)</td>
                        <td className="p-3">Pintura de paredes, reboco, contrapiso, colocação de porcelanato.</td>
                        <td className="p-3 text-emerald-400">Padrão da construção civil, fácil de justificar para o cliente.</td>
                        <td className="p-3 text-amber-400">Não cobrar a mais por pé-direito duplo ou paredes mofadas.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Diária de Mão de Obra</td>
                        <td className="p-3">Acompanhamento contínuo, auxílio em reformas maiores.</td>
                        <td className="p-3 text-emerald-400">Garante remuneração dia a dia.</td>
                        <td className="p-3 text-red-400">Dias chuvosos ou atrasos de material sem receber.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          )}

          {/* ============================================================ */}
          {/* GUIA 2: COMO ORGANIZAR ORÇAMENTOS DE CLIENTES */}
          {/* ============================================================ */}
          {activeTab === 'como-organizar' && (
            <article className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-slate-800 pb-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  <span>Gestão Comercial para Prestadores</span>
                  <span>•</span>
                  <span>Evite Calotes & Feche Mais</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Como Organizar Orçamentos de Clientes e Acabar com os Calotes
                </h3>
                <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
                  Trabalhar o dia inteiro sob o sol e, no final da obra, o cliente <strong>sumir, não pagar ou pedir desconto absurdo</strong> é a maior dor de cabeça do prestador. 
                  A solução não é confiar na palavra: é ter um <strong>processo profissional em 4 etapas</strong>.
                </p>
              </div>

              {/* O Funil de 4 Passos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black bg-blue-600/30 text-blue-400 border border-blue-500/40 px-2.5 py-0.5 rounded-full">
                      Passo 01
                    </span>
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <h4 className="font-bold text-white text-base">Visita e Validade Curta</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Sempre defina uma validade de <strong>10 a 15 dias</strong> para o orçamento. Os preços de cabos, tintas e cimento mudam semanalmente. Se o cliente demorar 2 meses para fechar, o orçamento já expirou!
                  </p>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                      Passo 02
                    </span>
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <h4 className="font-bold text-white text-base">PDF Formal e Detalhado</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Nunca passe valor em texto solto de WhatsApp. Um PDF timbrado com seus dados e detalhamento dos itens gera <strong>senso de compromisso</strong> e elimina a frase "você não me avisou disso".
                  </p>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black bg-amber-600/30 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                      Passo 03
                    </span>
                    <BadgePercent className="w-4 h-4 text-slate-500" />
                  </div>
                  <h4 className="font-bold text-white text-base">Entrada Obrigatória (50%)</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    <strong>Regra de Ouro:</strong> Nunca comece a obra com R$ 0,00 na conta. Peça no mínimo 40% a 50% de entrada no início do serviço e o saldo na entrega ou medição por etapas.
                  </p>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black bg-purple-600/30 text-purple-400 border border-purple-500/40 px-2.5 py-0.5 rounded-full">
                      Passo 04
                    </span>
                    <FileCheck className="w-4 h-4 text-slate-500" />
                  </div>
                  <h4 className="font-bold text-white text-base">Contrato com Assinatura</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Para obras acima de R$ 1.500,00, converta o orçamento em um <strong>Contrato de Prestação de Serviços</strong>. No OrçaFácil Pro Premium, o cliente assina pelo próprio celular via WhatsApp.
                  </p>
                </div>
              </div>

              {/* TELA DO SISTEMA EM AÇÃO: Visão de Organização */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-white text-sm">Como o OrçaFácil Pro Organiza Seu Negócio:</span>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                    Acesso Imediato no Celular e no PC
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-amber-400 uppercase block">1. Orçamentos Pendentes</span>
                    <p className="text-slate-300 font-semibold text-sm mt-1">Clientes avaliando a proposta</p>
                    <p className="text-slate-500 text-[11px] mt-2">
                      Envie um lembrete educado pelo WhatsApp após 48h: <em>"Olá, Roberto! Teve a oportunidade de avaliar o orçamento que enviei?"</em>
                    </p>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">2. Orçamentos Aprovados</span>
                    <p className="text-slate-300 font-semibold text-sm mt-1">Serviço fechado e confirmado</p>
                    <p className="text-slate-500 text-[11px] mt-2">
                      Marque como <strong>Aprovado</strong> com 1 clique e gere automaticamente o Contrato Oficial com cláusulas de prazo e garantia.
                    </p>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-blue-400 uppercase block">3. Histórico para Toda a Vida</span>
                    <p className="text-slate-300 font-semibold text-sm mt-1">Sincronizado na Nuvem (Supabase)</p>
                    <p className="text-slate-500 text-[11px] mt-2">
                      Se o cliente ligar 8 meses depois pedindo garantia ou manutenção, todos os itens, valores e datas estão salvos na nuvem.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      analyticsService.trackEvent('click_cta_from_seo', { origin: 'organization_hub' });
                      onGoToRegister();
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Começar a Organizar Meus Orçamentos (7 Dias Grátis)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          )}

          {/* ============================================================ */}
          {/* GUIA 3: MODELO DE ORÇAMENTO PARA ELETRICISTA */}
          {/* ============================================================ */}
          {activeTab === 'modelo-eletricista' && (
            <article className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                    <Zap className="w-4 h-4" />
                    <span>Modelo Profissional • Norma NBR 5410</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Modelo de Orçamento para Eletricista Residencial & Comercial
                  </h3>
                  <p className="text-slate-300 text-sm mt-1">
                    Exemplo real e normatizado pronto para você usar, com termos de segurança e garantia técnica.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const textoEletrica = `ORÇAMENTO DE SERVIÇOS ELÉTRICOS (Norma NBR 5410)
Prestador: Eletrotécnico Especializado
Cliente: Residencial Jardim das Flores

ITENS E SERVIÇOS:
1. Reforma e Montagem de Quadro de Distribuição (QDC): R$ 450,00
   - Instalação de Disjuntor Geral Bipolar e Dispositivo DR (Proteção contra choque).
   - Instalação de 2 Dispositivos DPS (Proteção contra raios e surtos).
2. Substituição de Circuito Dedicado para Chuveiro 220V (Fio 6mm² Antichama): R$ 280,00
3. Instalação de 6 Pontos de Iluminação LED de Embutir: R$ 240,00
4. Revisão Geral e Aterramento da Malha: R$ 180,00

VALOR TOTAL: R$ 1.150,00
Condições: 50% no início dos trabalhos e 50% na conclusão e testes com multímetro.
Validade da Proposta: 15 dias corridos.
Garantia: 90 dias sobre a mão de obra executada conforme NBR 5410.`;
                    handleCopyText(textoEletrica, 'eletricista');
                  }}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                >
                  {copiedSection === 'eletricista' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copiado para a Área de Transferência!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Modelo de Texto</span>
                    </>
                  )}
                </button>
              </div>

              {/* TELA DO ORÇAFÁCIL PRO: PREVIEW REAL DO ORÇAMENTO ELETRICISTA */}
              <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-100 pb-5 mb-5 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black">
                        ⚡
                      </div>
                      <div>
                        <h4 className="font-extrabold text-lg text-slate-900">Volts & Watts Engenharia Elétrica</h4>
                        <p className="text-xs text-slate-500">CNPJ: 28.910.123/0001-45 • Registro CFT/CREA Ativo</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                      Orçamento Técnico Nº 2026-089
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Emissão: 23/09/2026 • Validade: 15 dias</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl mb-6 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Cliente:</span>
                    <p className="font-bold text-slate-800">Condomínio Residencial das Palmeiras (Apto 42B)</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Local da Obra:</span>
                    <p className="text-slate-600">Rua das Acácias, 450 - Bairro Jardim</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left mb-6">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="pb-2">Item / Descrição do Serviço</th>
                        <th className="pb-2 text-center">Norma Técnica</th>
                        <th className="pb-2 text-center">Qtd</th>
                        <th className="pb-2 text-right">Valor Unitário</th>
                        <th className="pb-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5">
                          <p className="font-bold text-slate-800">Revisão e Montagem de QDC com DR e DPS</p>
                          <p className="text-[11px] text-slate-500">Instalação de barramento bifásico, identificação de circuitos e DPS contra raios</p>
                        </td>
                        <td className="py-2.5 text-center font-semibold text-slate-600">NBR 5410</td>
                        <td className="py-2.5 text-center text-slate-600">1 serv</td>
                        <td className="py-2.5 text-right font-semibold text-slate-700">R$ 450,00</td>
                        <td className="py-2.5 text-right font-black text-slate-900">R$ 450,00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">
                          <p className="font-bold text-slate-800">Troca de Fiação Circuito Chuveiro 220V</p>
                          <p className="text-[11px] text-slate-500">Cabo 6mm² antichama 750V, conector de porcelana ou wago reforçado</p>
                        </td>
                        <td className="py-2.5 text-center font-semibold text-slate-600">NBR 5410</td>
                        <td className="py-2.5 text-center text-slate-600">1 un</td>
                        <td className="py-2.5 text-right font-semibold text-slate-700">R$ 280,00</td>
                        <td className="py-2.5 text-right font-black text-slate-900">R$ 280,00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">
                          <p className="font-bold text-slate-800">Instalação de Spots LED Embutir em Forro de Gesso</p>
                          <p className="text-[11px] text-slate-500">Corte milimétrico com serra copo, passagem de fiação paralela e conexão</p>
                        </td>
                        <td className="py-2.5 text-center font-semibold text-slate-600">Geral</td>
                        <td className="py-2.5 text-center text-slate-600">6 un</td>
                        <td className="py-2.5 text-right font-semibold text-slate-700">R$ 40,00</td>
                        <td className="py-2.5 text-right font-black text-slate-900">R$ 240,00</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200">
                        <td colSpan={4} className="pt-3 text-right font-bold text-slate-600 text-sm">VALOR TOTAL DO SERVIÇO:</td>
                        <td className="pt-3 text-right text-xl font-black text-blue-600">R$ 970,00</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 text-slate-600 border border-slate-100">
                  <p className="font-bold text-slate-800">Termos & Condições de Fornecimento:</p>
                  <p>• <strong>Materiais:</strong> Este orçamento compreende a mão de obra técnica especializada. Materiais elétricos (cabos, disjuntores e luminárias) serão fornecidos pelo cliente ou faturados à parte mediante recibo.</p>
                  <p>• <strong>Pagamento:</strong> 50% de sinal no início do serviço e 50% na conclusão e emissão do termo de testes.</p>
                  <p>• <strong>Garantia:</strong> 90 dias conforme Código de Defesa do Consumidor.</p>
                </div>
              </div>

              {/* Botão de conversão */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    analyticsService.trackEvent('click_cta_from_seo', { origin: 'template_electrician' });
                    onGoToRegister();
                  }}
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Emitir Orçamento de Eletricista com Minha Logo Grátis</span>
                </button>
              </div>
            </article>
          )}

          {/* ============================================================ */}
          {/* GUIA 4: MODELO DE ORÇAMENTO PARA PINTOR */}
          {/* ============================================================ */}
          {activeTab === 'modelo-pintor' && (
            <article className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                    <Paintbrush className="w-4 h-4" />
                    <span>Modelo de Pintura Residencial & Predial</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Modelo de Orçamento para Pintor Profissional (Cobrança por m²)
                  </h3>
                  <p className="text-slate-300 text-sm mt-1">
                    Como descrever emassamento, lixamento, preparação de superfície e proteção de móveis sem margem para reclamações.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const textoPintura = `ORÇAMENTO DE PINTURA RESIDENCIAL DE ALTO PADRÃO
Prestador: Pintura & Acabamento Profissional
Cliente: Dra. Fernanda Montenegro

ESCOPO DOS SERVIÇOS:
1. Proteção Geral do Imóvel:
   - Forração de pisos com papelão ondulado, fita crepe azul automotiva em rodapés e encapamento de móveis.
2. Preparação de Superfície (85m² de parede):
   - Raspagem de imperfeições, aplicação de fundo preparador e emassamento com 2 demãos de massa corrida PVA.
   - Lixamento mecanizado com aspirador de pó (redução de 90% da poeira).
3. Pintura de Acabamento (85m²):
   - Aplicação de 2 a 3 demãos de Tinta Acrílica Fosca Lavável Suvinil/Coral: R$ 2.125,00 (R$ 25,00/m²).
4. Pintura de Tetos e Molduras em Gesso (35m²):
   - Tinta específica para gesso e drywall Branco Neve: R$ 700,00 (R$ 20,00/m²).

TOTAL DA MÃO DE OBRA: R$ 2.825,00
Prazo de Execução: 4 dias úteis.
Forma de Pagamento: 40% de entrada, 30% na metade da obra e 30% após vistoria final.`;
                    handleCopyText(textoPintura, 'pintor');
                  }}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                >
                  {copiedSection === 'pintor' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copiado para a Área de Transferência!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Modelo de Pintura</span>
                    </>
                  )}
                </button>
              </div>

              {/* TELA DO ORÇAFÁCIL PRO: PREVIEW PINTOR */}
              <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-100 pb-5 mb-5 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black">
                      🎨
                    </div>
                    <div>
                      <h4 className="font-extrabold text-lg text-slate-900">Pinturas & Texturas Premium</h4>
                      <p className="text-xs text-slate-500">MEI: 39.123.456/0001-89 • WhatsApp: (11) 97777-8888</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                      Proposta Comercial Nº 2026-P014
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Prazo Estimado: 4 dias de obra</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl mb-6 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Contratante:</span>
                    <p className="font-bold text-slate-800">Dra. Fernanda Montenegro (Residência)</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Ambiente a Executar:</span>
                    <p className="text-slate-600">Sala Integrada e Corredor Principal (85m² parede + 35m² teto)</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left mb-6">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="pb-2">Serviço de Pintura & Acabamento</th>
                        <th className="pb-2 text-center">Área (m²)</th>
                        <th className="pb-2 text-right">Valor por m²</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5">
                          <p className="font-bold text-slate-800">Proteção de Pisos, Esquadrias e Rodapés</p>
                          <p className="text-[11px] text-slate-500">Isolamento completo com papelão Kraft e fita automotiva sem resíduos de cola</p>
                        </td>
                        <td className="py-2.5 text-center text-slate-600">Geral</td>
                        <td className="py-2.5 text-right font-semibold text-slate-700">Cortesia</td>
                        <td className="py-2.5 text-right font-black text-emerald-600">Incluso</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">
                          <p className="font-bold text-slate-800">Emassamento, Lixamento Aspirado e Pintura Acrílica</p>
                          <p className="text-[11px] text-slate-500">2 demãos de massa corrida, correção de trincas e 2 demãos de tinta lavável</p>
                        </td>
                        <td className="py-2.5 text-center text-slate-600">85 m²</td>
                        <td className="py-2.5 text-right font-semibold text-slate-700">R$ 25,00</td>
                        <td className="py-2.5 text-right font-black text-slate-900">R$ 2.125,00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">
                          <p className="font-bold text-slate-800">Pintura de Tetos e Molduras de Gesso</p>
                          <p className="text-[11px] text-slate-500">Tinta Branco Neve fosca anti-mofo específica para gesso</p>
                        </td>
                        <td className="py-2.5 text-center text-slate-600">35 m²</td>
                        <td className="py-2.5 text-right font-semibold text-slate-700">R$ 20,00</td>
                        <td className="py-2.5 text-right font-black text-slate-900">R$ 700,00</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200">
                        <td colSpan={3} className="pt-3 text-right font-bold text-slate-600 text-sm">TOTAL GERAL DA PINTURA:</td>
                        <td className="pt-3 text-right text-xl font-black text-emerald-600">R$ 2.825,00</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1.5 text-slate-600 border border-slate-100">
                  <p className="font-bold text-slate-800">Observações Cruciais para o Cliente:</p>
                  <p>1. Cores a serem definidas formalmente pelo cliente com antecedência mínima de 48h do início da pintura.</p>
                  <p>2. Ao final de cada expediente diário, o ambiente de circulação é limpo e desobstruído.</p>
                </div>
              </div>

              {/* Botão de conversão */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    analyticsService.trackEvent('click_cta_from_seo', { origin: 'template_painter' });
                    onGoToRegister();
                  }}
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Gerar Meus Orçamentos de Pintor no OrçaFácil Pro</span>
                </button>
              </div>
            </article>
          )}

          {/* ============================================================ */}
          {/* GUIA 5: MODELO DE ORÇAMENTO PARA PEDREIRO */}
          {/* ============================================================ */}
          {activeTab === 'modelo-pedreiro' && (
            <article className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                    <Hammer className="w-4 h-4" />
                    <span>Construção Civil & Reformas</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Modelo de Orçamento para Pedreiro, Obras e Assentamento de Pisos
                  </h3>
                  <p className="text-slate-300 text-sm mt-1">
                    Como orçar alvenaria, contrapiso, impermeabilização e assentamento de porcelanato com etapas de medição.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const textoPedreiro = `ORÇAMENTO DE REFORMA E ALVENARIA
Prestador: Mestre de Obras & Reformas
Cliente: Sr. Carlos Eduardo Silveira

ETAPAS DA OBRA:
Etapa 1: Demolição e Limpeza com Descarte em Caçamba: R$ 800,00
Etapa 2: Regularização e Contrapiso com Impermeabilizante (32m²): R$ 1.280,00 (R$ 40,00/m²)
Etapa 3: Assentamento de Porcelanato 80x80 com Dupla Colagem (32m²): R$ 2.240,00 (R$ 70,00/m²)
   - Nivelamento com espaçadores de nivelamento cunha e rejunte epóxi.
Etapa 4: Revestimento de Parede Banheiro com Cortes em Meia Esquadria (45 graus): R$ 950,00

TOTAL DA MÃO DE OBRA: R$ 5.270,00
Cronograma de Pagamento por Medição de Etapas:
- 25% no início da demolição.
- 25% na conclusão do contrapiso impermeabilizado.
- 25% na metade do assentamento do porcelanato.
- 25% na entrega final, limpeza e rejuntamento.`;
                    handleCopyText(textoPedreiro, 'pedreiro');
                  }}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                >
                  {copiedSection === 'pedreiro' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copiado para a Área de Transferência!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Modelo de Pedreiro</span>
                    </>
                  )}
                </button>
              </div>

              {/* TELA DO ORÇAFÁCIL PRO: PREVIEW PEDREIRO */}
              <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-100 pb-5 mb-5 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">
                      🔨
                    </div>
                    <div>
                      <h4 className="font-extrabold text-lg text-slate-900">Construções & Reformas Estruturais</h4>
                      <p className="text-xs text-slate-500">Mestre de Obras Responsável • São Paulo/SP</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md">
                      Orçamento de Reforma Nº 2026-OB08
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Cronograma: 10 dias úteis de execução</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl mb-6 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Proprietário:</span>
                    <p className="font-bold text-slate-800">Carlos Eduardo Silveira</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Endereço da Obra:</span>
                    <p className="text-slate-600">Rua Vergueiro, 1200 - Apto 81</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left mb-6">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="pb-2">Etapa da Obra / Especificação Técnica</th>
                        <th className="pb-2 text-center">Unidade</th>
                        <th className="pb-2 text-right">Valor Unitário</th>
                        <th className="pb-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5">
                          <p className="font-bold text-slate-800">1. Demolição de Piso Antigo e Remoção de Entulho</p>
                          <p className="text-[11px] text-slate-500">Retirada cuidadosa sem danificar tubulações embutidas e ensacamento de entulho</p>
                        </td>
                        <td className="py-2.5 text-center text-slate-600">1 empreita</td>
                        <td className="py-2.5 text-right font-semibold text-slate-700">R$ 800,00</td>
                        <td className="py-2.5 text-right font-black text-slate-900">R$ 800,00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">
                          <p className="font-bold text-slate-800">2. Execução de Contrapiso e Impermeabilização</p>
                          <p className="text-[11px] text-slate-500">Argamassa com caimento para ralos e 3 demãos cruzadas de manta líquida impermeabilizante</p>
                        </td>
                        <td className="py-2.5 text-center text-slate-600">32 m²</td>
                        <td className="py-2.5 text-right font-semibold text-slate-700">R$ 40,00</td>
                        <td className="py-2.5 text-right font-black text-slate-900">R$ 1.280,00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">
                          <p className="font-bold text-slate-800">3. Assentamento de Porcelanato Retificado 80x80</p>
                          <p className="text-[11px] text-slate-500">Dupla colagem de argamassa AC-III, niveladores cunha milimétricos e rejunte epóxi</p>
                        </td>
                        <td className="py-2.5 text-center text-slate-600">32 m²</td>
                        <td className="py-2.5 text-right font-semibold text-slate-700">R$ 70,00</td>
                        <td className="py-2.5 text-right font-black text-slate-900">R$ 2.240,00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">
                          <p className="font-bold text-slate-800">4. Nicho em Porcelanato com Corte em Meia Esquadria (45°)</p>
                          <p className="text-[11px] text-slate-500">Acabamento com bordas chanfradas e vedação completa com silicone anti-fungo</p>
                        </td>
                        <td className="py-2.5 text-center text-slate-600">1 un</td>
                        <td className="py-2.5 text-right font-semibold text-slate-700">R$ 950,00</td>
                        <td className="py-2.5 text-right font-black text-slate-900">R$ 950,00</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200">
                        <td colSpan={3} className="pt-3 text-right font-bold text-slate-600 text-sm">TOTAL DA REFORMA:</td>
                        <td className="pt-3 text-right text-xl font-black text-blue-600">R$ 5.270,00</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1.5 text-slate-600 border border-slate-100">
                  <p className="font-bold text-slate-800">Condições de Pagamento por Etapas Concluídas (Medição):</p>
                  <p>• <strong>Entrada (25%):</strong> R$ 1.317,50 no início da demolição.</p>
                  <p>• <strong>Medição 2 (25%):</strong> R$ 1.317,50 com contrapiso impermeabilizado e aprovado.</p>
                  <p>• <strong>Medição 3 (25%):</strong> R$ 1.317,50 com metade do piso assentado.</p>
                  <p>• <strong>Final (25%):</strong> R$ 1.317,50 na entrega das chaves e limpeza grossa.</p>
                </div>
              </div>

              {/* Botão de conversão */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    analyticsService.trackEvent('click_cta_from_seo', { origin: 'template_mason' });
                    onGoToRegister();
                  }}
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Emitir Orçamento de Reforma no OrçaFácil Pro</span>
                </button>
              </div>
            </article>
          )}

        </div>

        {/* Bloco de Chamada Final de Autoridade & SEO */}
        <div className="mt-12 bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/40 border border-blue-500/20 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-lg sm:text-xl font-black text-white">
              Crie o Seu Catálogo de Serviços e Nunca Mais Perca Tempo Calculando
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              No OrçaFácil Pro você cadastra os seus serviços uma única vez. Ao visitar o cliente, basta selecionar os itens pelo celular e o orçamento em PDF sai pronto na hora.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              analyticsService.trackEvent('click_cta_from_seo', { origin: 'footer_hub' });
              onGoToRegister();
            }}
            className="shrink-0 px-6 py-3.5 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-sm shadow-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>Experimentar 7 Dias Sem Pagar Nada</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
