
import React, { useState, useEffect } from 'react';
import { Quote, CatalogItem, ProviderInfo, ItemType } from './types';
import { storageService } from './services/storageService';
import { Button } from './components/Button';
import { 
  FileText, 
  Package, 
  Settings, 
  Plus, 
  Trash2, 
  Printer, 
  ChevronLeft,
  Search,
  ChevronRight,
  TrendingUp,
  Box,
  Briefcase,
  Menu,
  X,
  MapPin
} from 'lucide-react';
import { generateQuoteNotes } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quotes' | 'catalog' | 'settings'>('quotes');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [providerInfo, setProviderInfo] = useState<ProviderInfo>(storageService.getProviderInfo());
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // New item states
  const [newItem, setNewItem] = useState<Partial<CatalogItem>>({ type: ItemType.SERVICE, price: 0 });
  const [editingCatalogItem, setEditingCatalogItem] = useState<string | null>(null);

  useEffect(() => {
    setQuotes(storageService.getQuotes());
    setCatalog(storageService.getCatalog());
  }, []);

  const handleSaveCatalogItem = () => {
    if (!newItem.name || newItem.price === undefined) return;
    
    let updatedCatalog;
    if (editingCatalogItem) {
      updatedCatalog = catalog.map(item => 
        item.id === editingCatalogItem ? { ...item, ...newItem } as CatalogItem : item
      );
    } else {
      const itemToAdd: CatalogItem = {
        id: crypto.randomUUID(),
        name: newItem.name || '',
        description: newItem.description || '',
        price: newItem.price || 0,
        type: newItem.type || ItemType.SERVICE,
        unit: newItem.unit || 'un'
      };
      updatedCatalog = [...catalog, itemToAdd];
    }
    
    setCatalog(updatedCatalog);
    storageService.saveCatalog(updatedCatalog);
    setNewItem({ type: ItemType.SERVICE, price: 0 });
    setEditingCatalogItem(null);
  };

  const handleStartNewQuote = () => {
    const newQuote: Quote = {
      id: crypto.randomUUID(),
      number: `ORC-${String(quotes.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
      customerCity: '',
      customerState: '',
      items: [],
      total: 0,
      notes: '',
      providerInfo: providerInfo
    };
    setSelectedQuote(newQuote);
    setIsEditingQuote(true);
  };

  const handleSaveQuote = (quote: Quote) => {
    storageService.saveQuote(quote);
    setQuotes(storageService.getQuotes());
    setSelectedQuote(null);
    setIsEditingQuote(false);
  };

  const handleDeleteQuote = (id: string) => {
    if (window.confirm('Deseja realmente excluir este orçamento?')) {
      storageService.deleteQuote(id);
      setQuotes(storageService.getQuotes());
      setSelectedQuote(null);
    }
  };

  const handleSaveProvider = () => {
    storageService.saveProviderInfo(providerInfo);
    alert('Dados salvos com sucesso!');
  };

  const NavButtons = () => (
    <>
      <button 
        onClick={() => { setActiveTab('quotes'); setIsEditingQuote(false); setSelectedQuote(null); setIsSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'quotes' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
      >
        <TrendingUp className="w-5 h-5" />
        <span className="font-medium">Orçamentos</span>
      </button>
      <button 
        onClick={() => { setActiveTab('catalog'); setIsEditingQuote(false); setSelectedQuote(null); setIsSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'catalog' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
      >
        <Package className="w-5 h-5" />
        <span className="font-medium">Catálogo</span>
      </button>
      <button 
        onClick={() => { setActiveTab('settings'); setIsEditingQuote(false); setSelectedQuote(null); setIsSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
      >
        <Settings className="w-5 h-5" />
        <span className="font-medium">Meus Dados</span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white no-print">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">OrçaFácil</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile Menu */}
      <nav className={`no-print fixed inset-0 z-50 md:relative md:flex md:w-64 bg-slate-900 text-white flex-shrink-0 flex-col transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">OrçaFácil</h1>
        </div>
        
        <div className="flex-1 px-4 space-y-2 mt-4">
          <NavButtons />
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 p-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
              {providerInfo.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm overflow-hidden">
              <p className="font-medium truncate">{providerInfo.name}</p>
              <p className="text-slate-500 text-xs truncate">Configurações</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden no-print" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          
          {/* Quotes List Tab */}
          {activeTab === 'quotes' && !isEditingQuote && !selectedQuote && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Orçamentos</h2>
                  <p className="text-slate-500">Gerencie suas propostas comerciais</p>
                </div>
                <Button onClick={handleStartNewQuote} icon={<Plus size={20} />} className="w-full sm:w-auto">
                  Novo Orçamento
                </Button>
              </div>

              {quotes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 md:p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <FileText size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Nenhum orçamento ainda</h3>
                  <p className="text-slate-500 mt-1 max-w-xs">Crie seu primeiro orçamento profissional clicando no botão acima.</p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {quotes.map(quote => (
                    <div 
                      key={quote.id} 
                      className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => setSelectedQuote(quote)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">
                          {quote.number}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(quote.date).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">{quote.customerName || 'Cliente sem nome'}</h3>
                      <p className="text-sm text-gray-500 mb-4 truncate">{quote.customerPhone || 'Sem contato'}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xl font-bold text-slate-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total)}
                        </span>
                        <div className="flex space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteQuote(quote.id); }}
                          >
                            <Trash2 size={18} className="text-red-400" />
                          </Button>
                          <ChevronRight size={20} className="text-gray-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Catalog Tab */}
          {activeTab === 'catalog' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Catálogo de Itens</h2>
                  <p className="text-slate-500">Produtos e serviços pré-cadastrados</p>
                </div>
              </div>

              <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
                {/* Form to add/edit item */}
                <div className="lg:col-span-1 order-1">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-8">
                    <h3 className="font-bold text-lg mb-4">{editingCatalogItem ? 'Editar Item' : 'Novo Item'}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <div className="flex p-1 bg-gray-100 rounded-lg">
                          <button 
                            onClick={() => setNewItem({ ...newItem, type: ItemType.SERVICE })}
                            className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${newItem.type === ItemType.SERVICE ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                          >
                            <Briefcase size={16} className="mr-2" /> Serviço
                          </button>
                          <button 
                            onClick={() => setNewItem({ ...newItem, type: ItemType.PRODUCT })}
                            className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${newItem.type === ItemType.PRODUCT ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                          >
                            <Box size={16} className="mr-2" /> Produto
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <input 
                          type="text" 
                          value={newItem.name || ''} 
                          onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Ex: Pintura Residencial"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea 
                          value={newItem.description || ''} 
                          onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          rows={2}
                          placeholder="Detalhes opcionais..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                          <input 
                            type="number" 
                            value={newItem.price || ''} 
                            onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                          <input 
                            type="text" 
                            value={newItem.unit || ''} 
                            onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: un, m², h"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1" onClick={handleSaveCatalogItem}>
                          {editingCatalogItem ? 'Atualizar' : 'Salvar'}
                        </Button>
                        {editingCatalogItem && (
                          <Button variant="secondary" onClick={() => { setEditingCatalogItem(null); setNewItem({ type: ItemType.SERVICE, price: 0 }); }}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* List of items */}
                <div className="lg:col-span-2 space-y-4 order-2">
                  <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Preço</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {catalog.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                              Nenhum item cadastrado no catálogo.
                            </td>
                          </tr>
                        ) : (
                          catalog.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-lg ${item.type === ItemType.SERVICE ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                    {item.type === ItemType.SERVICE ? <Briefcase size={18} /> : <Box size={18} />}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800">{item.name}</p>
                                    <p className="text-xs text-gray-400">{item.description || 'Sem descrição'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="font-bold text-slate-900">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                </p>
                                <p className="text-xs text-gray-400">por {item.unit || 'un'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center space-x-2">
                                  <button 
                                    onClick={() => { setEditingCatalogItem(item.id); setNewItem(item); }}
                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                  >
                                    <Settings size={18} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const updated = catalog.filter(i => i.id !== item.id);
                                      setCatalog(updated);
                                      storageService.saveCatalog(updated);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards for Catalog */}
                  <div className="md:hidden space-y-3">
                    {catalog.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                           <div className={`p-2 rounded-lg ${item.type === ItemType.SERVICE ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                            {item.type === ItemType.SERVICE ? <Briefcase size={18} /> : <Box size={18} />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{item.name}</p>
                            <p className="text-xs text-gray-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)} / {item.unit}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                           <button onClick={() => { setEditingCatalogItem(item.id); setNewItem(item); }} className="p-2 text-blue-500"><Settings size={18} /></button>
                           <button onClick={() => {
                              const updated = catalog.filter(i => i.id !== item.id);
                              setCatalog(updated);
                              storageService.saveCatalog(updated);
                           }} className="p-2 text-red-500"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Meus Dados Profissionais</h2>
                <p className="text-slate-500">Estas informações aparecerão no cabeçalho dos seus orçamentos</p>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa ou Profissional</label>
                    <input 
                      type="text" 
                      value={providerInfo.name} 
                      onChange={e => setProviderInfo({...providerInfo, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
                    <input 
                      type="text" 
                      value={providerInfo.document} 
                      onChange={e => setProviderInfo({...providerInfo, document: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input 
                      type="text" 
                      value={providerInfo.phone} 
                      onChange={e => setProviderInfo({...providerInfo, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Comercial</label>
                    <input 
                      type="email" 
                      value={providerInfo.email} 
                      onChange={e => setProviderInfo({...providerInfo, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <textarea 
                      value={providerInfo.address} 
                      onChange={e => setProviderInfo({...providerInfo, address: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="w-full py-4 text-lg" onClick={handleSaveProvider}>Salvar Informações</Button>
                </div>
              </div>
            </div>
          )}

          {/* Quote Editor View */}
          {isEditingQuote && selectedQuote && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" onClick={() => { setIsEditingQuote(false); setSelectedQuote(null); }}>
                    <ChevronLeft size={20} className="mr-1" /> Voltar
                  </Button>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800">{selectedQuote.number}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: Form Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Customer Info */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 flex items-center">
                      <Search size={20} className="mr-2 text-blue-500" /> Dados do Cliente
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <input 
                          type="text" 
                          value={selectedQuote.customerName} 
                          onChange={e => setSelectedQuote({...selectedQuote, customerName: e.target.value})}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Celular / WhatsApp</label>
                        <input 
                          type="text" 
                          value={selectedQuote.customerPhone} 
                          onChange={e => setSelectedQuote({...selectedQuote, customerPhone: e.target.value})}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input 
                          type="email" 
                          value={selectedQuote.customerEmail} 
                          onChange={e => setSelectedQuote({...selectedQuote, customerEmail: e.target.value})}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="cliente@email.com"
                        />
                      </div>
                      <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center">
                          <MapPin size={14} className="mr-1" /> Endereço de Entrega/Serviço
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <div className="sm:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro (Rua, Nº, Compl.)</label>
                            <input 
                              type="text" 
                              value={selectedQuote.customerAddress} 
                              onChange={e => setSelectedQuote({...selectedQuote, customerAddress: e.target.value})}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ex: Rua das Flores, 123 - Apto 4"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                            <input 
                              type="text" 
                              value={selectedQuote.customerCity} 
                              onChange={e => setSelectedQuote({...selectedQuote, customerCity: e.target.value})}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ex: São Paulo"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
                            <input 
                              type="text" 
                              value={selectedQuote.customerState} 
                              onChange={e => setSelectedQuote({...selectedQuote, customerState: e.target.value})}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ex: SP"
                              maxLength={2}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">Itens do Orçamento</h3>
                      <p className="text-sm text-gray-400">{selectedQuote.items.length} itens</p>
                    </div>
                    
                    {selectedQuote.items.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 italic">
                        Adicione itens do catálogo ao lado.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedQuote.items.map((item, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-gray-100">
                            <div className="flex-1 w-full">
                              <p className="font-semibold text-slate-800">{item.name}</p>
                              <p className="text-xs text-gray-400">{item.unit || 'un'}</p>
                            </div>
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                              <div className="w-20">
                                <input 
                                  type="number" 
                                  value={item.quantity}
                                  min="1"
                                  onChange={e => {
                                    const newItems = [...selectedQuote.items];
                                    newItems[idx].quantity = parseFloat(e.target.value) || 0;
                                    const newTotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                                    setSelectedQuote({...selectedQuote, items: newItems, total: newTotal});
                                  }}
                                  className="w-full px-2 py-1 border rounded-lg text-center font-medium"
                                />
                              </div>
                              <div className="w-24 text-right">
                                <p className="font-bold text-slate-900 text-sm">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                                </p>
                              </div>
                              <button 
                                onClick={() => {
                                  const newItems = selectedQuote.items.filter((_, i) => i !== idx);
                                  const newTotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                                  setSelectedQuote({...selectedQuote, items: newItems, total: newTotal});
                                }}
                                className="text-red-400 p-1"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes & AI Generation */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">Observações</h3>
                      <button 
                        onClick={async () => {
                          const suggestion = await generateQuoteNotes(selectedQuote.items, selectedQuote.customerName);
                          setSelectedQuote({...selectedQuote, notes: suggestion});
                        }}
                        className="text-blue-600 text-sm font-medium hover:underline flex items-center"
                      >
                        <TrendingUp size={16} className="mr-1" /> Gerar com IA
                      </button>
                    </div>
                    <textarea 
                      value={selectedQuote.notes}
                      onChange={e => setSelectedQuote({...selectedQuote, notes: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 h-32"
                      placeholder="Condições, prazos, etc..."
                    />
                  </div>
                </div>

                {/* Right side: Catalog Search & Summary */}
                <div className="space-y-6">
                  {/* Catalog Quick Search */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4">Catálogo</h3>
                    <div className="space-y-2 max-h-[300px] lg:max-h-[400px] overflow-y-auto pr-2">
                      {catalog.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4 italic">Sem itens.</p>
                      ) : (
                        catalog.map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => {
                              const alreadyExists = selectedQuote.items.findIndex(i => i.id === item.id);
                              let newItems;
                              if (alreadyExists >= 0) {
                                newItems = [...selectedQuote.items];
                                newItems[alreadyExists].quantity += 1;
                              } else {
                                newItems = [...selectedQuote.items, { ...item, quantity: 1 }];
                              }
                              const newTotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                              setSelectedQuote({...selectedQuote, items: newItems, total: newTotal});
                            }}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-100 transition-all group"
                          >
                            <div className="overflow-hidden">
                              <p className="text-sm font-semibold text-slate-700 truncate">{item.name}</p>
                              <p className="text-xs text-gray-400">R$ {item.price.toFixed(2)} / {item.unit}</p>
                            </div>
                            <Plus size={18} className="text-gray-300 group-hover:text-blue-600 flex-shrink-0" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Summary & Save */}
                  <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl space-y-6 sticky top-8">
                    <div>
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Total Geral</p>
                      <h3 className="text-3xl md:text-4xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedQuote.total)}
                      </h3>
                    </div>
                    
                    <div className="space-y-3 pt-4">
                      <Button className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 border-none text-lg font-bold" onClick={() => handleSaveQuote(selectedQuote)}>
                        Salvar
                      </Button>
                      <Button variant="ghost" className="w-full text-slate-400 hover:bg-slate-800 border-none" onClick={() => { setIsEditingQuote(false); setSelectedQuote(null); }}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quote View/Print Mode */}
          {selectedQuote && !isEditingQuote && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
                <Button variant="secondary" onClick={() => setSelectedQuote(null)} className="w-full sm:w-auto">
                  <ChevronLeft size={20} className="mr-2" /> Lista
                </Button>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="secondary" onClick={() => setIsEditingQuote(true)} className="flex-1 sm:flex-none">
                    Editar
                  </Button>
                  <Button onClick={() => window.print()} icon={<Printer size={20} />} className="flex-1 sm:flex-none">
                    Imprimir / PDF
                  </Button>
                </div>
              </div>

              {/* Printable Document Design */}
              <div className="bg-white p-6 md:p-12 rounded-lg shadow-sm max-w-[210mm] mx-auto min-h-[297mm] border border-gray-100 overflow-x-auto overflow-y-hidden">
                <div className="min-w-[600px] md:min-w-0">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">{providerInfo.name}</h1>
                      <div className="text-xs md:text-sm text-gray-500 space-y-0.5">
                        <p>CPF/CNPJ: {providerInfo.document}</p>
                        <p>Fone: {providerInfo.phone}</p>
                        <p>{providerInfo.email}</p>
                        <p className="max-w-xs">{providerInfo.address}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-blue-600 text-lg md:text-xl font-bold uppercase tracking-widest mb-1">Orçamento</h2>
                      <p className="text-slate-800 font-bold text-lg">{selectedQuote.number}</p>
                      <p className="text-sm text-gray-400">Emissão: {new Date(selectedQuote.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Customer Section */}
                  <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div>
                      <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase mb-2">Para o Cliente</p>
                      <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-1">{selectedQuote.customerName || '(Não informado)'}</h3>
                      <p className="text-xs md:text-sm text-slate-600">{selectedQuote.customerPhone}</p>
                      <p className="text-xs md:text-sm text-slate-600">{selectedQuote.customerEmail}</p>
                      {(selectedQuote.customerAddress || selectedQuote.customerCity) && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-slate-500 leading-tight">
                            {selectedQuote.customerAddress}
                            {selectedQuote.customerAddress && (selectedQuote.customerCity || selectedQuote.customerState) && <br />}
                            {selectedQuote.customerCity}{selectedQuote.customerCity && selectedQuote.customerState ? `, ${selectedQuote.customerState}` : selectedQuote.customerState}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-12">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="py-4 font-bold text-slate-800 text-sm">Item</th>
                          <th className="py-4 px-4 text-center font-bold text-slate-800 text-sm">Qtd</th>
                          <th className="py-4 px-4 text-right font-bold text-slate-800 text-sm">Unitário</th>
                          <th className="py-4 text-right font-bold text-slate-800 text-sm">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedQuote.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-4">
                              <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                              <p className="text-[10px] text-gray-400">{item.description}</p>
                            </td>
                            <td className="py-4 px-4 text-center text-slate-600 text-sm">{item.quantity} {item.unit}</td>
                            <td className="py-4 px-4 text-right text-slate-600 text-sm">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                            </td>
                            <td className="py-4 text-right font-bold text-slate-900 text-sm">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="pt-8 text-right font-medium text-slate-500 text-sm">Valor Total</td>
                          <td className="pt-8 text-right text-2xl md:text-3xl font-extrabold text-blue-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedQuote.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Notes Section */}
                  {selectedQuote.notes && (
                    <div className="border-t border-slate-100 pt-8">
                      <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">Observações Importantes</p>
                      <div className="text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {selectedQuote.notes}
                      </div>
                    </div>
                  )}

                  {/* Footer Signature Area */}
                  <div className="mt-20 flex justify-center gap-12 md:gap-24 text-center">
                    <div className="w-40 md:w-48">
                      <div className="border-t border-slate-300 pt-2 text-[10px] text-gray-400 font-medium uppercase">Assinatura do Prestador</div>
                    </div>
                    <div className="w-40 md:w-48">
                      <div className="border-t border-slate-300 pt-2 text-[10px] text-gray-400 font-medium uppercase">Aceite do Cliente</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
