
import React, { useState, useEffect } from 'react';
import { Quote, CatalogItem, ProviderInfo } from './types';
import { storageService } from './services/storageService';
import { Sidebar } from './components/Sidebar';
import { QuotesPage } from './pages/QuotesPage';
import { CatalogPage } from './pages/CatalogPage';
import { SettingsPage } from './pages/SettingsPage';
import { QuoteEditorPage } from './pages/QuoteEditorPage';
import { QuoteViewPage } from './pages/QuoteViewPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FileText, Menu, X, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'quotes' | 'catalog' | 'settings'>('quotes');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [providerInfo, setProviderInfo] = useState<ProviderInfo>(storageService.getProviderInfo());
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      getQuotes();
      getCatalog();
    }
  }, [isAuthenticated]);

  const getQuotes = async () => {
    const quotes = await storageService.getQuotes(user!.id);
    setQuotes(quotes);
  }

  const getCatalog = async () => {
    const catalog = await storageService.getCatalog(user!.id);
    setCatalog(catalog);
  }

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

  const saveCatalogItem = (item: Partial<CatalogItem>, isEditing: boolean) => {
    let updatedCatalog;
    if (isEditing) {
      updatedCatalog = catalog.map(i => i.id === (item as CatalogItem).id ? { ...i, ...item } as CatalogItem : i);
    } else {
      updatedCatalog = [...catalog, { ...item, id: crypto.randomUUID() } as CatalogItem];
    }
    setCatalog(updatedCatalog);
    storageService.saveCatalog(user!.id, item as CatalogItem);
  };

  const deleteCatalogItem = (id: string) => {
    const updated = catalog.filter(i => i.id !== id);
    setCatalog(updated);
    //storageService.saveCatalog(user!.id, updated as CatalogItem);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white no-print">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-1.5 rounded-lg"><FileText className="w-5 h-5 text-white" /></div>
          <h1 className="text-lg font-bold">OrçaFácil</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setSelectedQuote(null); setIsEditingQuote(false); }} 
        providerInfo={providerInfo} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onLogout={logout}
      />

      <main className="flex-1 overflow-y-auto bg-gray-50 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {activeTab === 'quotes' && !isEditingQuote && !selectedQuote && (
            <QuotesPage 
              quotes={quotes} 
              onNewQuote={handleStartNewQuote} 
              onSelectQuote={setSelectedQuote} 
              onDeleteQuote={(id) => { storageService.deleteQuote(id, user!.id); getQuotes(); }} 
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogPage 
              catalog={catalog} 
              onSaveItem={saveCatalogItem} 
              onDeleteItem={deleteCatalogItem} 
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage 
              providerInfo={providerInfo} 
              onUpdate={setProviderInfo} 
              onSave={() => { storageService.saveProviderInfo(providerInfo); alert('Dados salvos!'); }} 
            />
          )}

          {isEditingQuote && selectedQuote && (
            <QuoteEditorPage 
              quote={selectedQuote} 
              catalog={catalog} 
              onBack={() => { setIsEditingQuote(false); setSelectedQuote(null); }} 
              onUpdateQuote={setSelectedQuote}
              onSave={(q) => { storageService.saveQuote(q, user!.id); getQuotes(); setIsEditingQuote(false); setSelectedQuote(null); }} 
            />
          )}

          {selectedQuote && !isEditingQuote && (
            <QuoteViewPage 
              quote={selectedQuote} 
              providerInfo={providerInfo} 
              onBack={() => setSelectedQuote(null)} 
              onEdit={() => setIsEditingQuote(true)} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
