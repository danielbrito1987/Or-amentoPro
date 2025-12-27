
import React, { useCallback, useEffect, useState } from 'react';
import { Quote } from '../types';
import { Button } from '../components/Button';
import { Plus, Search, X, Filter, TrendingUp, MessageCircle, ChevronRight, Trash2, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { storageService } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

interface QuotesPageProps {
  onNewQuote: () => void;
  onSelectQuote: (quote: Quote) => void;
  onDeleteQuote: (id: string) => void;
}

export const QuotesPage: React.FC<QuotesPageProps> = ({ onNewQuote, onSelectQuote, onDeleteQuote }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    fetchQuotes(user!.sub)
  }, [])

  const fetchQuotes = useCallback(async (compId: string) => {
    try {
      const data = await storageService.getBudgets(compId);
      setQuotes(data);
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
    }
  }, []);

  const filteredQuotes = quotes.filter(quote => {
    const term = searchTerm.toLowerCase();
    const rawTerm = searchTerm.replace(/\D/g, '');
    const nameMatch = quotes ?? quote.clientName.toLowerCase().includes(term);
    const phoneMatch = quotes ?? quote.clientPhone.replace(/\D/g, '').includes(rawTerm);
    const numberMatch = quotes ?? quote.number.toLowerCase().includes(term);
    return nameMatch || (rawTerm !== '' && phoneMatch) || numberMatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Orçamentos</h2>
          <p className="text-slate-500">Gerencie suas propostas comerciais</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          <Button onClick={onNewQuote} icon={<Plus size={20} />} className="w-full sm:w-auto shadow-lg shadow-blue-500/20">
            Novo Orçamento
          </Button>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 md:p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Nenhum orçamento ainda</h3>
          <p className="text-slate-500 mt-1 max-w-xs">Crie seu primeiro orçamento profissional clicando no botão acima.</p>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            <Filter size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Nenhum resultado</h3>
          <p className="text-slate-500">Não encontramos orçamentos para "{searchTerm}"</p>
          <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 font-medium hover:underline">
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuotes.map(quote => (
            <div
              key={quote.id}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1"
              onClick={() => onSelectQuote(quote)}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">
                  {quote.number}
                </span>
                <span className="text-xs text-gray-400">{new Date(quote.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
                {quote.clientName || 'Cliente sem nome'}
              </h3>
              <p className="text-sm text-gray-500 mb-4 truncate flex items-center">
                <MessageCircle size={14} className="mr-1.5 opacity-40" />
                {quote.clientPhone || 'Sem contato'}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xl font-bold text-slate-900">
                  {formatCurrency(quote.total)}
                </span>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1.5 hover:bg-red-50 hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); onDeleteQuote(quote.id); }}
                  >
                    <Trash2 size={18} />
                  </Button>
                  <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
