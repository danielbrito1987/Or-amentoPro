import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  PackagePlus, 
  FileText, 
  Share2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Sparkles, 
  Send, 
  Download, 
  Calculator, 
  Settings, 
  HelpCircle,
  Play
} from 'lucide-react';

interface InteractiveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: 'quotes' | 'catalog' | 'settings') => void;
  onStartNewQuote?: () => void;
}

interface StepData {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  previewType: 'company' | 'catalog' | 'quote' | 'send';
  keyPoints: { icon: any; title: string; desc: string }[];
  actionLabel?: string;
  actionTab?: 'quotes' | 'catalog' | 'settings';
  isNewQuoteAction?: boolean;
}

export const InteractiveGuideModal: React.FC<InteractiveGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onStartNewQuote
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Fecha com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const steps: StepData[] = [
    {
      id: 1,
      badge: 'Passo 1 de 4 • Primeiros Passos',
      title: 'Configure sua Identidade e Dados',
      subtitle: 'Deixe seus orçamentos com a cara da sua empresa ou profissão autônoma.',
      icon: Building2,
      color: 'from-blue-600 to-indigo-600',
      previewType: 'company',
      keyPoints: [
        {
          icon: Settings,
          title: 'Dados da Sua Empresa',
          desc: 'Insira o nome fantasia, CNPJ/CPF, WhatsApp, endereço e e-mail no menu "Meus Dados".'
        },
        {
          icon: Sparkles,
          title: 'Logo Personalizada',
          desc: 'Faça upload do logotipo da sua marca para aparecer no topo do PDF gerado.'
        },
        {
          icon: CheckCircle2,
          title: 'Chave PIX e Pagamento',
          desc: 'Defina suas chaves de pagamento e condições padrão de garantia e validade.'
        }
      ],
      actionLabel: 'Ir para Meus Dados',
      actionTab: 'settings'
    },
    {
      id: 2,
      badge: 'Passo 2 de 4 • Agilidade',
      title: 'Cadastre seus Serviços e Produtos Frequentes',
      subtitle: 'Nunca mais digite o mesmo serviço duas vezes. Crie um catálogo inteligente.',
      icon: PackagePlus,
      color: 'from-emerald-600 to-teal-600',
      previewType: 'catalog',
      keyPoints: [
        {
          icon: PackagePlus,
          title: 'Tabela de Preços Pré-definida',
          desc: 'Cadastre serviços comuns (ex: Pintura m², Instalação Elétrica, Manutenção) com valor base.'
        },
        {
          icon: Calculator,
          title: 'Unidades de Medida Flexíveis',
          desc: 'Trabalhe com Horas, Metros (m²), Diárias, Unidades ou Pacotes fechados.'
        },
        {
          icon: CheckCircle2,
          title: 'Inserção com 1 Clique',
          desc: 'Ao criar um orçamento, basta selecionar o item do catálogo que os valores se preenchem sozinhos.'
        }
      ],
      actionLabel: 'Ver Catálogo de Itens',
      actionTab: 'catalog'
    },
    {
      id: 3,
      badge: 'Passo 3 de 4 • Montagem Rápida',
      title: 'Crie Orçamentos Completos em Minutos',
      subtitle: 'Adicione cliente, itens, descontos e prazos com cálculo automático.',
      icon: FileText,
      color: 'from-blue-600 to-cyan-600',
      previewType: 'quote',
      keyPoints: [
        {
          icon: FileText,
          title: 'Dados do Cliente e Local',
          desc: 'Informe o nome do cliente, telefone/WhatsApp e endereço do serviço.'
        },
        {
          icon: Calculator,
          title: 'Cálculo Inteligente em Tempo Real',
          desc: 'Adicione serviços, peças, defina descontos percentuais ou em reais e veja o total atualizar.'
        },
        {
          icon: Sparkles,
          title: 'Condições de Pagamento e Validade',
          desc: 'Especifique prazos de entrega, validade da proposta (ex: 15 dias) e formas de parcelamento.'
        }
      ],
      actionLabel: 'Criar Novo Orçamento',
      isNewQuoteAction: true
    },
    {
      id: 4,
      badge: 'Passo 4 de 4 • Fechamento',
      title: 'Envie por WhatsApp e Gere PDF Profissional',
      subtitle: 'Impressione seus clientes com uma apresentação limpa e feche mais negócios.',
      icon: Share2,
      color: 'from-emerald-600 to-green-600',
      previewType: 'send',
      keyPoints: [
        {
          icon: Send,
          title: 'Envio Direto no WhatsApp',
          desc: 'Com um toque, abre a conversa com o cliente já com a mensagem formatada e resumo de valores.'
        },
        {
          icon: Download,
          title: 'Download em PDF Impecável',
          desc: 'Gere um documento A4 profissional, com sua logo, dados organizados e espaço para assinatura.'
        },
        {
          icon: CheckCircle2,
          title: 'Status de Aprovação',
          desc: 'Marque o orçamento como Pendente, Aprovado ou Concluído para acompanhar suas vendas.'
        }
      ],
      actionLabel: 'Começar Agora!',
      actionTab: 'quotes'
    }
  ];

  const current = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepAction = () => {
    if (current.isNewQuoteAction && onStartNewQuote) {
      onClose();
      onStartNewQuote();
    } else if (current.actionTab && onNavigateToTab) {
      onClose();
      onNavigateToTab(current.actionTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Superior com Barra de Progresso */}
        <div className="bg-slate-900/90 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Guia Interativo OrçaFácil Pro
              </h2>
              <p className="text-xs text-slate-400">Aprenda a criar e enviar orçamentos profissionais em menos de 2 minutos</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Fechar guia"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicadores de Passos no Topo */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 px-4 sm:px-6 pt-4 pb-2 bg-slate-900/50">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={`group flex flex-col text-left transition-all ${
                  isCurrent ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                }`}
              >
                <div className="h-1.5 w-full rounded-full overflow-hidden bg-slate-800 mb-1.5">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-500 w-full' : isCurrent ? 'bg-blue-500 w-full' : 'w-0'
                    }`}
                  />
                </div>
                <div className="hidden sm:flex items-center space-x-1.5 text-xs font-medium truncate">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' : isCurrent ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={`truncate ${isCurrent ? 'text-blue-400 font-semibold' : 'text-slate-400'}`}>
                    {idx === 0 && 'Meus Dados'}
                    {idx === 1 && 'Catálogo'}
                    {idx === 2 && 'Orçamento'}
                    {idx === 3 && 'WhatsApp & PDF'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Corpo do Passo Atual */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Lado Esquerdo: Textos e Itens explicativos */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  {current.badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {current.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {current.subtitle}
                </p>
              </div>

              {/* Lista de destaques do passo */}
              <div className="space-y-3">
                {current.keyPoints.map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start space-x-3.5 transition-all hover:bg-slate-800/90"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-200">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lado Direito: Card Visual Simulando a Ação */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/70 p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Preview no Sistema</span>
                </div>

                {/* Preview 1: Configuração da Empresa */}
                {current.previewType === 'company' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                        LOGO
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Sua Empresa Pro</p>
                        <p className="text-slate-400 text-[11px]">CNPJ: 00.000.000/0001-00</p>
                        <p className="text-emerald-400 text-[11px] font-medium">PIX: pix@suaempresa.com</p>
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-950/40 rounded-lg text-slate-400 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span>Validade padrão:</span>
                        <span className="text-slate-200 font-medium">15 dias</span>
                      </div>
                      <div className="flex justify-between">
                        <span>WhatsApp comercial:</span>
                        <span className="text-slate-200 font-medium">(11) 99999-8888</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview 2: Catálogo de Itens */}
                {current.previewType === 'catalog' && (
                  <div className="space-y-2 text-xs">
                    {[
                      { name: 'Instalação / Pintura Especial', price: 'R$ 180,00 / m²', type: 'Serviço' },
                      { name: 'Cabo 2.5mm antichama (rolo)', price: 'R$ 290,00 / un', type: 'Material' },
                      { name: 'Diária Técnica Especializada', price: 'R$ 350,00 / dia', type: 'Mão de Obra' }
                    ].map((row, i) => (
                      <div key={i} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white text-xs">{row.name}</p>
                          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-medium">
                            {row.type}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          {row.price}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview 3: Criação do Orçamento */}
                {current.previewType === 'quote' && (
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                      <p className="text-[11px] text-slate-400">Cliente Selecionado:</p>
                      <p className="font-bold text-white text-sm">Carlos Eduardo Silva</p>
                      <p className="text-[11px] text-slate-400">Residencial Jardins • São Paulo/SP</p>
                    </div>
                    <div className="p-2.5 bg-blue-950/30 border border-blue-800/40 rounded-xl space-y-1.5">
                      <div className="flex justify-between text-slate-300 text-xs">
                        <span>Subtotal (3 itens):</span>
                        <span>R$ 2.450,00</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 text-xs">
                        <span>Desconto especial:</span>
                        <span>- R$ 150,00</span>
                      </div>
                      <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-slate-800">
                        <span>Total Líquido:</span>
                        <span className="text-cyan-400">R$ 2.300,00</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview 4: Envio WhatsApp & PDF */}
                {current.previewType === 'send' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                          <Send className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">Enviar via WhatsApp</p>
                          <p className="text-[10px] text-emerald-300">Mensagem pronta com 1 clique</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg">
                        Pronto
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">Baixar PDF A4</p>
                          <p className="text-[10px] text-slate-400">Layout profissional para impressão</p>
                        </div>
                      </div>
                      <span className="text-slate-400 text-[10px]">.PDF</span>
                    </div>
                  </div>
                )}

                {/* Atalho de ação contextual do passo */}
                {current.actionLabel && (
                  <button
                    onClick={handleStepAction}
                    className="w-full mt-4 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700 transition-all hover:border-slate-600"
                  >
                    <span>{current.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Rodapé com Navegação */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 sm:p-5 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium flex items-center space-x-2 transition-all ${
              currentStep === 0 
                ? 'opacity-40 cursor-not-allowed' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Passo Anterior</span>
            <span className="sm:hidden">Voltar</span>
          </button>

          <div className="flex items-center space-x-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-6 bg-blue-500' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <span>{currentStep === steps.length - 1 ? 'Concluir Guia' : 'Próximo Passo'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
