import React, { useState, useRef, useEffect } from 'react';
import { Quote, CatalogItem, QuoteItem, ItemType } from '../types';
import { Button } from '../components/Button';
import { 
  ChevronLeft, 
  Search, 
  MapPin, 
  Trash2, 
  TrendingUp, 
  Plus, 
  Sparkles, 
  Check, 
  Minus, 
  Package, 
  Wrench, 
  Tag, 
  ChevronDown, 
  ChevronUp,
  Calculator,
  ArrowDown
} from 'lucide-react';
import { maskPhone, formatCurrency } from '../utils/formatters';
import { generateQuoteNotes } from '../services/geminiService';
import { AiPriceConsultantModal } from '../components/AiPriceConsultantModal';

interface QuoteEditorPageProps {
  quote: Quote;
  catalog: CatalogItem[];
  onBack: () => void;
  onSave: (quote: Quote) => void;
  onUpdateQuote: (quote: Quote) => void;
  onSaveCatalogItem?: (item: Partial<CatalogItem>, isEditing: boolean) => void;
}

export const QuoteEditorPage: React.FC<QuoteEditorPageProps> = ({ 
  quote, 
  catalog, 
  onBack, 
  onSave, 
  onUpdateQuote,
  onSaveCatalogItem 
}) => {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(
    Boolean(quote.customerAddress && quote.customerAddress.trim() !== '')
  );

  // Estados do formulário de inclusão de item
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);

  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState<number | ''>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnit, setItemUnit] = useState<string>('un');
  const [itemType, setItemType] = useState<ItemType>(ItemType.SERVICE);
  const [itemDescription, setItemDescription] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Itens filtrados no catálogo
  const filteredCatalog = catalog.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  // Cálculo do subtotal do formulário em tempo real
  const parsedPrice = typeof itemPrice === 'number' ? itemPrice : (parseFloat(String(itemPrice).replace(',', '.')) || 0);
  const parsedQuantity = itemQuantity > 0 ? itemQuantity : 1;
  const calculatedSubtotal = parsedPrice * parsedQuantity;

  // Seleção de um item do catálogo no formulário
  const handleSelectCatalogItem = (item: CatalogItem) => {
    setSelectedCatalogItem(item);
    setItemName(item.name);
    setItemPrice(item.price);
    setItemUnit(item.unit || 'un');
    setItemType(item.type || ItemType.SERVICE);
    setItemDescription(item.description || '');
    setSearchQuery(item.name);
    setIsDropdownOpen(false);
    
    // Foca na quantidade para agilizar
    setTimeout(() => {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }, 100);
  };

  // Inclusão do item no orçamento
  const handleIncludeItem = () => {
    const trimmedName = itemName.trim();
    if (!trimmedName) {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      return;
    }

    const price = parsedPrice;
    const quantity = parsedQuantity;

    const newItem: QuoteItem = {
      id: selectedCatalogItem ? selectedCatalogItem.id : ('item_' + Date.now()),
      name: trimmedName,
      price: price,
      unit: itemUnit.trim() || 'un',
      description: itemDescription.trim(),
      type: itemType,
      quantity: quantity,
    };

    // Verifica se o item já existe na lista atual do orçamento
    const existingIndex = quote.items.findIndex(i => 
      (selectedCatalogItem && i.id === selectedCatalogItem.id) ||
      i.name.toLowerCase().trim() === trimmedName.toLowerCase()
    );

    let updatedItems: QuoteItem[];
    if (existingIndex >= 0) {
      updatedItems = [...quote.items];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + quantity,
        price: price, // atualiza valor unitário caso o usuário tenha ajustado
        unit: itemUnit.trim() || updatedItems[existingIndex].unit,
      };
    } else {
      updatedItems = [...quote.items, newItem];
    }

    const updatedTotal = updatedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    onUpdateQuote({ ...quote, items: updatedItems, total: updatedTotal });

    // Mensagem de feedback temporária
    setFeedbackMessage(`"${trimmedName}" incluído com sucesso!`);
    setTimeout(() => setFeedbackMessage(null), 2500);

    // Limpa os campos do formulário para permitir nova inserção rápida
    setItemName('');
    setItemPrice('');
    setItemQuantity(1);
    setItemUnit('un');
    setItemDescription('');
    setSelectedCatalogItem(null);
    setSearchQuery('');
    setIsDropdownOpen(false);

    // Foca novamente no campo de busca para o próximo item
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const updateQuantity = (idx: number, qty: number) => {
    if (qty < 0) return;
    const newItems = [...quote.items];
    if (qty === 0) {
      removeItem(idx);
      return;
    }
    newItems[idx].quantity = qty;
    const newTotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    onUpdateQuote({ ...quote, items: newItems, total: newTotal });
  };

  const removeItem = (idx: number) => {
    const newItems = quote.items.filter((_, i) => i !== idx);
    const newTotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    onUpdateQuote({ ...quote, items: newItems, total: newTotal });
  };

  const generateAI = async () => {
    const suggestion = await generateQuoteNotes(quote.items, quote.customerName);
    onUpdateQuote({ ...quote, notes: suggestion });
  };

  // Aplica sugestão da IA diretamente ao formulário para conferência antes de incluir
  const handleApplyAiItem = (data: {
    name: string;
    price: number;
    unit: string;
    description?: string;
    saveToCatalog?: boolean;
  }) => {
    setItemName(data.name);
    setSearchQuery(data.name);
    setItemPrice(data.price);
    setItemUnit(data.unit || 'un');
    setItemDescription(data.description || '');
    setItemType(ItemType.SERVICE);
    setItemQuantity(1);
    setSelectedCatalogItem(null);

    // Salva no catálogo do prestador se solicitado
    if (data.saveToCatalog && onSaveCatalogItem) {
      onSaveCatalogItem({
        name: data.name,
        price: data.price,
        unit: data.unit || 'un',
        description: data.description || '',
        type: ItemType.SERVICE,
      }, false);
    }

    // Leva a tela até o formulário de itens e foca na quantidade
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 300);
  };

  const quoteLocation = [quote.customerCity, quote.customerState].filter(Boolean).join(' - ');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <AiPriceConsultantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        defaultLocation={quoteLocation}
        mode="quote"
        onApply={handleApplyAiItem}
      />

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ChevronLeft size={20} className="mr-1" /> Voltar
          </Button>
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Edição de Orçamento</span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">{quote.number}</h2>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Total Geral</span>
          <span className="text-xl md:text-2xl font-black text-slate-900">{formatCurrency(quote.total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Cliente, Formulário de Itens e Listagem */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. DADOS DO CLIENTE (Compacto e organizado) */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base md:text-lg flex items-center text-slate-800">
                <Search size={18} className="mr-2 text-blue-600" /> 
                Dados do Cliente
              </h3>
              <button
                type="button"
                onClick={() => setShowFullAddress(!showFullAddress)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <MapPin size={13} />
                <span>{showFullAddress ? 'Ocultar endereço' : '+ Endereço completo'}</span>
                {showFullAddress ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={quote.customerName} 
                  onChange={e => onUpdateQuote({...quote, customerName: e.target.value})} 
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="Ex: Carlos Silva" 
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp / Telefone</label>
                <input 
                  type="text" 
                  value={quote.customerPhone} 
                  onChange={e => onUpdateQuote({...quote, customerPhone: maskPhone(e.target.value)})} 
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="(00) 00000-0000" 
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail (opcional)</label>
                <input 
                  type="email" 
                  value={quote.customerEmail} 
                  onChange={e => onUpdateQuote({...quote, customerEmail: e.target.value})} 
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="cliente@email.com" 
                />
              </div>

              <div className="sm:col-span-1 grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                  <input 
                    type="text" 
                    value={quote.customerCity} 
                    onChange={e => onUpdateQuote({...quote, customerCity: e.target.value})} 
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                    placeholder="Cidade" 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">UF</label>
                  <input 
                    type="text" 
                    value={quote.customerState} 
                    onChange={e => onUpdateQuote({...quote, customerState: e.target.value.toUpperCase()})} 
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-center uppercase transition-all" 
                    placeholder="UF" 
                    maxLength={2} 
                  />
                </div>
              </div>

              {/* Endereço Detalhado Expansível */}
              {showFullAddress && (
                <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rua, Número e Complemento</label>
                  <input 
                    type="text" 
                    value={quote.customerAddress} 
                    onChange={e => onUpdateQuote({...quote, customerAddress: e.target.value})} 
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                    placeholder="Rua das Flores, 123, Apto 4" 
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. SEÇÃO DE ITENS COM FORMULÁRIO DE INCLUSÃO + LISTAGEM */}
          <div ref={formSectionRef} className="bg-white p-5 md:p-6 rounded-2xl border border-blue-100 shadow-sm space-y-6">
            
            {/* Cabeçalho da Seção de Itens */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span>Itens e Serviços do Orçamento</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pesquise no catálogo ou digite o item, ajuste a quantidade e clique em incluir
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 text-xs font-semibold border border-blue-200/70 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Calcular Preço com IA</span>
              </button>
            </div>

            {/* FORMULÁRIO DE PESQUISA, QUANTIDADE E CÁLCULO DE VALOR */}
            <div className="bg-slate-50/90 border border-blue-100 rounded-2xl p-4 md:p-5 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  Adicionar Novo Item
                </span>
                {selectedCatalogItem && (
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Item do Catálogo Selecionado
                  </span>
                )}
              </div>

              {/* Linha 1: Campo de Busca / Nome do Item com Autocomplete */}
              <div className="relative mb-3.5">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Item / Serviço / Material <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setItemName(e.target.value);
                      setIsDropdownOpen(true);
                      if (selectedCatalogItem && e.target.value !== selectedCatalogItem.name) {
                        setSelectedCatalogItem(null);
                      }
                    }}
                    placeholder="Digite para pesquisar no catálogo ou digite um novo item..."
                    className="w-full pl-10 pr-10 py-2.5 bg-white text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setItemName('');
                        setSelectedCatalogItem(null);
                        setItemPrice('');
                        setIsDropdownOpen(false);
                        searchInputRef.current?.focus();
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown de Sugestões do Catálogo */}
                {isDropdownOpen && (
                  <div 
                    ref={dropdownRef}
                    className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar p-1.5"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Sugestões do seu Catálogo ({filteredCatalog.length})
                    </div>
                    {filteredCatalog.length > 0 ? (
                      <div className="space-y-1">
                        {filteredCatalog.map(item => (
                          <div
                            key={item.id}
                            onMouseDown={() => handleSelectCatalogItem(item)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors group"
                          >
                            <div className="overflow-hidden pr-2">
                              <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-400">
                                  {item.type === ItemType.SERVICE ? 'Serviço' : 'Produto'}
                                </span>
                                {item.unit && (
                                  <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded">
                                    {item.unit}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                                {formatCurrency(item.price)}
                              </span>
                              <span className="block text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                Selecionar
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-500">
                        Nenhum item com este nome encontrado no catálogo.
                      </div>
                    )}

                    {searchQuery.trim() && (
                      <div
                        onMouseDown={() => {
                          setItemName(searchQuery.trim());
                          setIsDropdownOpen(false);
                          setTimeout(() => quantityInputRef.current?.focus(), 100);
                        }}
                        className="mt-1 p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 cursor-pointer border border-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-between"
                      >
                        <span className="truncate">Usar <strong>"{searchQuery.trim()}"</strong> como item avulso</span>
                        <Plus className="w-3.5 h-3.5 shrink-0 ml-1" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Linha 2: Preço Unitário, Quantidade, Unidade, Cálculo em Tempo Real e Botão Incluir */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                
                {/* Preço Unitário */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Valor Unitário (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemPrice === '' ? '' : itemPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItemPrice(val === '' ? '' : parseFloat(val));
                      }}
                      placeholder="0,00"
                      className="w-full pl-9 pr-3 py-2 bg-white text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Quantidade com botões rápidos - e + */}
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">Quantidade</label>
                    <span className="text-[11px] text-slate-400">{itemUnit || 'un'}</span>
                  </div>
                  <div className="flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                    <button
                      type="button"
                      onClick={() => setItemQuantity(prev => Math.max(1, (prev || 1) - 1))}
                      className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0"
                      title="Diminuir quantidade"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={quantityInputRef}
                      type="number"
                      min="1"
                      step="any"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full py-2 text-sm text-center font-bold text-slate-800 outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setItemQuantity(prev => (prev || 0) + 1)}
                      className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0"
                      title="Aumentar quantidade"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtotal Calculado em Tempo Real */}
                <div className="sm:col-span-3">
                  <div className="p-2 bg-white border border-slate-200/90 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Calculator className="w-3 h-3 text-emerald-500" />
                      <span>Subtotal Calculado</span>
                    </div>
                    <div className="text-base font-black text-emerald-700 truncate mt-0.5">
                      {formatCurrency(calculatedSubtotal)}
                    </div>
                  </div>
                </div>

                {/* Botão de Inclusão */}
                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={handleIncludeItem}
                    disabled={!itemName.trim()}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                      itemName.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98] shadow-blue-500/20'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Incluir Item</span>
                  </button>
                </div>
              </div>

              {/* Mensagem de Feedback de Inclusão */}
              {feedbackMessage && (
                <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{feedbackMessage}</span>
                </div>
              )}
            </div>

            {/* LISTAGEM DE ITENS INCLUÍDOS NO ORÇAMENTO */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Itens Incluídos</span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                    {quote.items.length} {quote.items.length === 1 ? 'item' : 'itens'}
                  </span>
                </h4>
                {quote.items.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium">
                    Subtotal dos itens: <strong className="text-slate-800">{formatCurrency(quote.total)}</strong>
                  </span>
                )}
              </div>

              {quote.items.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    Nenhum item adicionado ainda
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    Utilize o formulário acima para pesquisar no catálogo, ajustar a quantidade e clicar em <strong>"Incluir Item"</strong>.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (searchInputRef.current) {
                          searchInputRef.current.focus();
                          setIsDropdownOpen(true);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
                    >
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      Buscar no Catálogo
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Consultar Preço com IA
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {quote.items.map((item, idx) => {
                    const itemSubtotal = item.price * item.quantity;
                    return (
                      <div 
                        key={item.id || idx} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 bg-white hover:border-blue-200 transition-all shadow-xs"
                      >
                        {/* Info do Item */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                            <p className="font-semibold text-slate-800 text-sm truncate">
                              {item.name}
                            </p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium shrink-0">
                              {item.unit || 'un'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 pl-7">
                            Valor unitário: {formatCurrency(item.price)}
                          </p>
                        </div>

                        {/* Controles: Quantidade, Subtotal e Exclusão */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-7 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          {/* Ajuste de Quantidade Rápido */}
                          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                            <button 
                              type="button"
                              onClick={() => updateQuantity(idx, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded transition-colors text-xs"
                              title="Diminuir"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button 
                              type="button"
                              onClick={() => updateQuantity(idx, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded transition-colors text-xs"
                              title="Aumentar"
                            >
                              +
                            </button>
                          </div>

                          {/* Subtotal do Item */}
                          <div className="w-24 text-right">
                            <span className="text-sm font-bold text-slate-900 block">
                              {formatCurrency(itemSubtotal)}
                            </span>
                          </div>

                          {/* Excluir */}
                          <button 
                            type="button"
                            onClick={() => removeItem(idx)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. OBSERVAÇÕES E CONDIÇÕES */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base text-slate-800">Observações e Condições</h3>
              <button 
                type="button"
                onClick={generateAI} 
                className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
              >
                <TrendingUp size={14} /> 
                Gerar com IA
              </button>
            </div>
            <textarea 
              value={quote.notes} 
              onChange={e => onUpdateQuote({...quote, notes: e.target.value})} 
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 h-28" 
              placeholder="Descreva termos de pagamento, prazo de entrega, garantias ou observações importantes..." 
            />
          </div>
        </div>

        {/* Coluna Lateral: Resumo / Salvar e Catálogo Rápido */}
        <div className="space-y-6">
          
          {/* Card de Fechamento / Total Geral */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-5 sticky top-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Resumo Geral
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                {quote.items.length} {quote.items.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <div>
              <p className="text-slate-400 text-xs font-medium uppercase mb-1">Valor Total</p>
              <h3 className="text-3xl font-black text-white">{formatCurrency(quote.total)}</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Calculado automaticamente a partir dos itens incluídos
              </p>
            </div>

            <Button 
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 border-none text-base font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]" 
              onClick={() => onSave(quote)}
            >
              Salvar Orçamento
            </Button>
          </div>

          {/* Catálogo Rápido com Atalho para o Formulário */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-slate-800">Catálogo Rápido</h3>
              <span className="text-[11px] text-slate-400">{catalog.length} cadastrados</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Clique em um item para carregá-lo no formulário e definir a quantidade:
            </p>

            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 p-2.5 mb-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Calcular Preço com IA</span>
            </button>

            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
              {catalog.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    handleSelectCatalogItem(item);
                    if (formSectionRef.current) {
                      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }} 
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-100 transition-all group"
                  title="Clique para carregar no formulário"
                >
                  <div className="overflow-hidden pr-2">
                    <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{item.unit || 'un'}</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                      {formatCurrency(item.price)}
                    </span>
                    <Plus size={15} className="text-slate-300 group-hover:text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
