import React, { useState } from 'react';
import { Sparkles, X, Loader2, ArrowRight, Check, Clock, TrendingUp, Info, Lightbulb, MapPin } from 'lucide-react';
import { Button } from './Button';
import { PriceSuggestion } from '../types';
import { estimateServicePrice } from '../services/geminiService';
import { formatCurrency } from '../utils/formatters';

interface AiPriceConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceName?: string;
  defaultLocation?: string;
  mode: 'catalog' | 'quote';
  onApply: (data: {
    name: string;
    price: number;
    unit: string;
    description?: string;
    saveToCatalog?: boolean;
  }) => void;
}

const QUICK_IDEAS = [
  'Instalação de chuveiro elétrico',
  'Pintura de parede por m²',
  'Instalação de ar-condicionado split',
  'Troca de tomada ou interruptor',
  'Montagem de guarda-roupa 6 portas',
  'Desentupimento de pia ou ralo'
];

export const AiPriceConsultantModal: React.FC<AiPriceConsultantModalProps> = ({
  isOpen,
  onClose,
  initialServiceName = '',
  defaultLocation = '',
  mode,
  onApply,
}) => {
  const [serviceName, setServiceName] = useState(initialServiceName);
  const [location, setLocation] = useState(defaultLocation);
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null);
  
  // Valor selecionado ou editado pelo usuário
  const [chosenPrice, setChosenPrice] = useState<number>(0);
  const [chosenUnit, setChosenUnit] = useState<string>('un');
  const [saveToCatalog, setSaveToCatalog] = useState(false);

  // Sincroniza se abrir com nome inicial
  React.useEffect(() => {
    if (isOpen) {
      setServiceName(initialServiceName);
      setLocation(defaultLocation);
      setError(null);
      setSuggestion(null);
      setSaveToCatalog(false);
    }
  }, [isOpen, initialServiceName, defaultLocation]);

  if (!isOpen) return null;

  const handleConsult = async () => {
    if (!serviceName.trim()) {
      setError('Por favor, informe o nome ou descrição do serviço.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await estimateServicePrice(serviceName, location, details);
      setSuggestion(result);
      setChosenPrice(result.suggestedPrice);
      setChosenUnit(result.unit || 'un');
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível calcular a estimativa. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPredefinedPrice = (price: number) => {
    setChosenPrice(price);
  };

  const handleConfirm = () => {
    onApply({
      name: suggestion?.serviceName || serviceName,
      price: chosenPrice,
      unit: chosenUnit,
      description: suggestion?.justification,
      saveToCatalog: mode === 'quote' ? saveToCatalog : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Consultor de Preço com IA</h3>
              <p className="text-xs text-blue-100">Sugestão de valor justo com base no mercado brasileiro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Formulário de Consulta */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Qual serviço o cliente pediu? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Ex: Instalação de ar-condicionado 12000 BTUs, Troca de torneira..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleConsult()}
              />

              {/* Sugestões rápidas de preenchimento */}
              {!suggestion && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {QUICK_IDEAS.map((idea, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setServiceName(idea)}
                      className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Cidade ou Região (opcional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: São Paulo - SP, Curitiba..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Detalhes / Complexidade (opcional)
                </label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Ex: Altura de 3m, fiação antiga..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleConsult}
                disabled={isLoading || !serviceName.trim()}
                icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-md shadow-blue-500/20"
              >
                {isLoading ? 'Calculando estimativa...' : suggestion ? 'Recalcular com IA' : 'Consultar Preço com IA'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Resultado da Sugestão da IA */}
          {suggestion && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md">
                    Sugestão de Mercado
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {suggestion.serviceName}
                  </h4>
                </div>
                {suggestion.estimatedHours && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-slate-200 w-fit">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tempo: <strong>{suggestion.estimatedHours}</strong></span>
                  </div>
                )}
              </div>

              {/* Seletor de Faixa de Preço */}
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium">
                  Escolha uma faixa ou ajuste manualmente o valor final:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPredefinedPrice(suggestion.minPrice)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      chosenPrice === suggestion.minPrice
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Mínimo</span>
                    <span className="text-sm font-bold block">{formatCurrency(suggestion.minPrice)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPredefinedPrice(suggestion.suggestedPrice)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      chosenPrice === suggestion.suggestedPrice
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-blue-600 block">Recomendado</span>
                    <span className="text-sm font-extrabold text-blue-700 block">{formatCurrency(suggestion.suggestedPrice)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPredefinedPrice(suggestion.maxPrice)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      chosenPrice === suggestion.maxPrice
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Máximo</span>
                    <span className="text-sm font-bold block">{formatCurrency(suggestion.maxPrice)}</span>
                  </button>
                </div>
              </div>

              {/* Ajuste Fino de Valor e Unidade */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap sm:flex-nowrap items-center gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Preço a ser aplicado (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={chosenPrice}
                      onChange={(e) => setChosenPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="w-28">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Unidade
                  </label>
                  <input
                    type="text"
                    value={chosenUnit}
                    onChange={(e) => setChosenUnit(e.target.value)}
                    placeholder="un, m², h..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Justificativa e Dicas */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-blue-900 font-semibold block mb-0.5">Por que este valor?</strong>
                    <p className="text-slate-700 leading-relaxed">{suggestion.justification}</p>
                  </div>
                </div>

                {suggestion.tips && suggestion.tips.length > 0 && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-amber-900 font-semibold block mb-0.5">Dicas para seu orçamento:</strong>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        {suggestion.tips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkbox para salvar no catálogo se estiver dentro do editor de orçamento */}
              {mode === 'quote' && (
                <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveToCatalog}
                    onChange={(e) => setSaveToCatalog(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Salvar também este serviço no meu <strong>Catálogo</strong> para usar nos próximos orçamentos
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Rodapé da Modal com Ações */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose} size="sm">
            Cancelar
          </Button>

          {suggestion ? (
            <Button
              variant="primary"
              onClick={handleConfirm}
              icon={<Check className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 border-none shadow-md shadow-emerald-600/20"
            >
              {mode === 'catalog' ? 'Preencher no Item' : 'Adicionar ao Orçamento'}
            </Button>
          ) : (
            <span className="text-xs text-slate-400">Preencha o serviço para consultar</span>
          )}
        </div>
      </div>
    </div>
  );
};
