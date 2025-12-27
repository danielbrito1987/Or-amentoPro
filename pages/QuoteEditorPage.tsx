
import React, { useEffect, useState } from 'react';
import { Quote, CatalogItem } from '../types';
import { Button } from '../components/Button';
import { ChevronLeft, Search, MapPin, Trash2, TrendingUp, Plus } from 'lucide-react';
import { maskPhone, formatCurrency } from '../utils/formatters';
import { generateQuoteNotes } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';

interface QuoteEditorPageProps {
  quote: Quote;
  onBack: () => void;
  onSave: (quote: Quote) => void;
  onUpdateQuote: (quote: Quote) => void;
}

export const QuoteEditorPage: React.FC<QuoteEditorPageProps> = ({ quote, onBack, onSave, onUpdateQuote }) => {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  const loadCatalog = async () => {
    try {
      const data = await apiService.get<CatalogItem[]>(`/products/${user?.sub}`);
      setCatalog(data);
    } catch (error) {
      console.error("Erro ao carregar catálogo:", error);
    }
  }

  useEffect(() => {
    loadCatalog()
  }, [])

  const addItem = (item: CatalogItem) => {
    const alreadyExists = quote.items.findIndex(i => i.id === item.id);
    let newItems;
    if (alreadyExists >= 0) {
      newItems = [...quote.items];
      newItems[alreadyExists].quantity += 1;
    } else {
      newItems = [...quote.items, { ...item, quantity: 1 }];
    }
    const newTotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    onUpdateQuote({ ...quote, items: newItems, total: newTotal });
  };

  const updateQuantity = (idx: number, qty: number) => {
    const newItems = [...quote.items];
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
    const suggestion = await generateQuoteNotes(quote.items, quote.clientName);
    onUpdateQuote({ ...quote, notes: suggestion });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center space-x-4 mb-4">
        <Button variant="ghost" onClick={onBack}><ChevronLeft size={20} className="mr-1" /> Voltar</Button>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">{quote.number}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center text-slate-800"><Search size={20} className="mr-2 text-blue-500" /> Dados do Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input type="text" value={quote.clientName} onChange={e => onUpdateQuote({ ...quote, clientName: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome do cliente" />
              </div>
              <input type="text" value={quote.clientPhone} onChange={e => onUpdateQuote({ ...quote, clientPhone: maskPhone(e.target.value) })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="WhatsApp" />
              <input type="email" value={quote.clientEmail} onChange={e => onUpdateQuote({ ...quote, clientEmail: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="E-mail" />
              <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center"><MapPin size={14} className="mr-1" /> Endereço</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input type="text" value={quote.address} onChange={e => onUpdateQuote({ ...quote, address: e.target.value })} className="sm:col-span-3 w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rua, número, apto..." />
                  <input type="text" value={quote.city} onChange={e => onUpdateQuote({ ...quote, city: e.target.value })} className="sm:col-span-2 w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cidade" />
                  <input type="text" value={quote.state} onChange={e => onUpdateQuote({ ...quote, state: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="UF" maxLength={2} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Itens</h3>
            {quote.items.length === 0 ? <p className="text-center py-8 text-gray-400">Adicione itens do catálogo ao lado.</p> : (
              <div className="space-y-3">
                {quote.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex-1 w-full"><p className="font-semibold">{item.description}</p><p className="text-xs text-gray-400">{item.unit}</p></div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <input type="number" value={item.quantity} min="1" onChange={e => updateQuantity(idx, parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center" />
                      <div className="w-24 text-right font-bold">{formatCurrency(item.price * item.quantity)}</div>
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Observações</h3><button onClick={generateAI} className="text-blue-600 text-sm font-medium hover:underline flex items-center"><TrendingUp size={16} className="mr-1" /> Gerar com IA</button></div>
            <textarea value={quote.notes} onChange={e => onUpdateQuote({ ...quote, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none h-32" placeholder="Termos, garantia, prazos..." />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold mb-4">Catálogo Rápido</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {catalog.map(item => (
                <div key={item.id} onClick={() => addItem(item)} className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-100 transition-all group">
                  <div className="overflow-hidden"><p className="text-sm font-semibold truncate">{item.description}</p><p className="text-xs text-gray-400">{formatCurrency(item.price)}</p></div>
                  <Plus size={18} className="text-gray-300 group-hover:text-blue-600" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-6 sticky top-8">
            <div><p className="text-slate-400 text-xs font-medium uppercase mb-2">Total</p><h3 className="text-3xl font-bold">{formatCurrency(quote.total)}</h3></div>
            <Button className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 border-none text-lg font-bold" onClick={() => onSave(quote)}>Salvar Orçamento</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
