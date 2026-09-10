import React, { useState } from 'react';
import { Sparkles, X, Loader2, Check, Clock, TrendingUp, Info, Lightbulb, MapPin, Plus, Minus } from 'lucide-react';
import { Button } from './Button';
import { PriceSuggestion } from '../types';
import { estimateServicePrice } from '../services/geminiService';
import { normalizeUnit } from '../services/marketEstimator';
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
    quantity?: number;
    description?: string;
    saveToCatalog?: boolean;
  }) => void;
}

const QUICK_IDEAS = [
  'Instalação de 3 ventiladores de teto',
  'Instalação de chuveiro elétrico',
  'Pintura de parede por m²',
  'Instalação de ar-condicionado split',
  'Troca de 4 tomadas ou interruptores',
  'Montagem de guarda-roupa 6 portas',
  'Desentupimento de pia ou ralo'
];

const COMMON_UNITS = [
  { value: 'un', label: 'un (unidade)' },
  { value: 'ponto', label: 'ponto' },
  { value: 'serviço', label: 'serviço' },
  { value: 'm²', label: 'm²' },
  { value: 'm', label: 'metro' },
  { value: 'diária', label: 'diária' },
  { value: 'hora', label: 'hora' },
  { value: 'kg', label: 'kg' },
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
  
  // Valor total e quantidade selecionados ou editados
  const [chosenPrice, setChosenPrice] = useState<number>(0);
  const [chosenQuantity, setChosenQuantity] = useState<number>(1);
  const [chosenUnit, setChosenUnit] = useState<string>('un');
  const [billingMode, setBillingMode] = useState<'unit' | 'package'>('unit');
  const [saveToCatalog, setSaveToCatalog] = useState(false);

  // Sincroniza se abrir com nome inicial
  React.useEffect(() => {
    if (isOpen) {
      setServiceName(initialServiceName);
      setLocation(defaultLocation);
      setError(null);
      setSuggestion(null);
      setSaveToCatalog(false);
      setChosenQuantity(1);
      setChosenUnit('un');
      setBillingMode('unit');
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

      const parsedQty = result.quantity && result.quantity > 0 ? result.quantity : 1;
      const cleanUnit = normalizeUnit(result.unit);

      setChosenQuantity(parsedQty);
      setChosenPrice(result.suggestedPrice);
      setChosenUnit(cleanUnit);
      setBillingMode('unit');
    } catch (err: any) {
      console.error('Erro ao consultar IA:', err);
      setError(err?.message || 'Não foi possível calcular a estimativa. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPredefinedPrice = (price: number) => {
    setChosenPrice(price);
  };

  // Valor unitário calculado a partir do total
  const unitPriceCalculated = chosenQuantity > 0 
    ? Math.round((chosenPrice / chosenQuantity) * 100) / 100 
    : chosenPrice;

  const handleConfirm = () => {
    const isUnitBilling = billingMode === 'unit' && chosenQuantity > 1;
    const finalQuantity = isUnitBilling ? chosenQuantity : 1;
    const finalUnit = isUnitBilling 
      ? normalizeUnit(chosenUnit) 
      : (chosenQuantity > 1 ? 'serviço' : normalizeUnit(chosenUnit));
    
    // Se cobrar por unidade, passa o preço unitário para multiplicar pela quantidade
    // Se cobrar valor fechado, passa o preço total com quantidade 1
    const finalPrice = isUnitBilling ? unitPriceCalculated : chosenPrice;

    onApply({
      name: suggestion?.serviceName || serviceName,
      price: mode === 'catalog' ? unitPriceCalculated : finalPrice,
      unit: mode === 'catalog' ? normalizeUnit(chosenUnit) : finalUnit,
      quantity: mode === 'catalog' ? 1 : finalQuantity,
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
                placeholder="Ex: Instalação de 3 ventiladores de teto, Troca de chuveiro..."
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
                  Escolha uma faixa recomendada para o valor total:
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
                    {chosenQuantity > 1 && (
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {formatCurrency(suggestion.minPrice / chosenQuantity)}/{chosenUnit}
                      </span>
                    )}
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
                    {chosenQuantity > 1 && (
                      <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
                        {formatCurrency(suggestion.suggestedPrice / chosenQuantity)}/{chosenUnit}
                      </span>
                    )}
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
                    {chosenQuantity > 1 && (
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {formatCurrency(suggestion.maxPrice / chosenQuantity)}/{chosenUnit}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Se houver mais de 1 item detectado, permite escolher o formato no orçamento */}
              {mode === 'quote' && chosenQuantity > 1 && (
                <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      Formato no Orçamento ({chosenQuantity} {chosenUnit})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBillingMode('unit')}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        billingMode === 'unit'
                          ? 'bg-white border-blue-600 text-blue-950 shadow-sm ring-1 ring-blue-500'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900">Cobrar por Unidade</span>
                        {billingMode === 'unit' && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Ativo</span>}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {chosenQuantity} {chosenUnit} × {formatCurrency(unitPriceCalculated)} = <strong>{formatCurrency(chosenPrice)}</strong>
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBillingMode('package')}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        billingMode === 'package'
                          ? 'bg-white border-blue-600 text-blue-950 shadow-sm ring-1 ring-blue-500'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900">Valor Fechado / Pacote</span>
                        {billingMode === 'package' && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Ativo</span>}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        1 serviço fechado = <strong>{formatCurrency(chosenPrice)}</strong>
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Ajuste Fino de Quantidade, Preço e Unidade */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Quantidade */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Quantidade
                    </label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          const newQty = Math.max(1, chosenQuantity - 1);
                          setChosenQuantity(newQty);
                        }}
                        className="p-2 text-slate-500 hover:bg-slate-200 shrink-0"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={chosenQuantity}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setChosenQuantity(val);
                        }}
                        className="w-full py-1.5 text-center font-bold text-slate-900 bg-transparent outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setChosenQuantity(chosenQuantity + 1)}
                        className="p-2 text-slate-500 hover:bg-slate-200 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Unidade */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Unidade de Medida
                    </label>
                    <select
                      value={chosenUnit}
                      onChange={(e) => setChosenUnit(normalizeUnit(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                    >
                      {COMMON_UNITS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Preço Total ou Unitário */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      {billingMode === 'unit' && chosenQuantity > 1 ? 'Valor Total do Serviço' : 'Preço a Aplicar'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={chosenPrice}
                        onChange={(e) => setChosenPrice(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Resumo do Cálculo quando quantidade > 1 */}
                {chosenQuantity > 1 && (
                  <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs text-slate-600 border border-slate-100">
                    <span>
                      {billingMode === 'unit' ? (
                        <>Valor Unitário: <strong>{formatCurrency(unitPriceCalculated)}</strong> por {chosenUnit}</>
                      ) : (
                        <>Valor Fechado para os <strong>{chosenQuantity} itens</strong></>
                      )}
                    </span>
                    <span className="font-bold text-slate-900">
                      Total: {formatCurrency(chosenPrice)}
                    </span>
                  </div>
                )}
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
