
import React, { useState, useEffect, useCallback } from 'react';
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
  const [providerInfo, setProviderInfo] = useState<ProviderInfo>({
    name: 'Carregando...',
    document: '',
    phone: '',
    email: '',
    address: ''
  });
  
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Estados para controlar se os dados já foram carregados com sucesso
  const [loadedSections, setLoadedSections] = useState({
    quotes: false,
    catalog: false,
    provider: false
  });

  // Funções de busca individuais
  const fetchQuotes = useCallback(async (compId: string) => {
    setIsFetchingData(true);
    try {
      const data = await storageService.getQuotes(compId);
      setQuotes(data);
      setLoadedSections(prev => ({ ...prev, quotes: true }));
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  const fetchCatalog = useCallback(async (compId: string) => {
    setIsFetchingData(true);
    try {
      const data = await storageService.getCatalog(compId);
      setCatalog(data);
      setLoadedSections(prev => ({ ...prev, catalog: true }));
    } catch (error) {
      console.error("Erro ao carregar catálogo:", error);
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  const fetchProvider = useCallback(async (compId: string) => {
    setIsFetchingData(true);
    try {
      const data = await storageService.getProviderInfo(compId);
      if (data) setProviderInfo(data);
      setLoadedSections(prev => ({ ...prev, provider: true }));
      return data;
    } catch (error) {
      console.error("Erro ao carregar dados do profissional:", error);
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  // Handler para troca de abas (CARREGAMENTO SOB DEMANDA AQUI)
  const handleTabChange = (tab: 'quotes' | 'catalog' | 'settings') => {
    setActiveTab(tab);
    setSelectedQuote(null);
    setIsEditingQuote(false);
    setIsSidebarOpen(false);

    const compId = user?.sub || (authService.getCurrentUser()?.sub);
    if (!compId) return;

    // Dispara a busca apenas se a seção ainda não estiver carregada
    if (tab === 'quotes') {
      fetchQuotes(compId);
    } else if (tab === 'catalog') {
      fetchCatalog(compId);
    } else if (tab === 'settings') {
      fetchProvider(compId);
    }
  };

  // Carregamento inicial de segurança para a aba padrão
  useEffect(() => {
    if (isAuthenticated && user!.sub && !loadedSections.quotes && activeTab === 'quotes') {
      fetchQuotes(user!.sub);
    }
  }, [isAuthenticated, user, activeTab, loadedSections.quotes, fetchQuotes]);

  const handleStartNewQuote = async () => {
    const compId = user!.sub;
    if (!compId) return;

    let currentProvider = providerInfo;
    
    // Garante que temos os dados antes de abrir o editor
    if (!loadedSections.provider) {
      const fetched = await fetchProvider(compId);
      if (fetched) currentProvider = fetched;
    }

    if (!loadedSections.catalog) {
      await fetchCatalog(compId);
    }

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
      providerInfo: currentProvider,
      companyId: compId
    };
    setSelectedQuote(newQuote);
    setIsEditingQuote(true);
  };

  const saveCatalogItem = async (item: Partial<CatalogItem>, isEditing: boolean) => {
    const compId = user!.sub;
    if (!compId) return;
    setIsFetchingData(true);
    try {
      const itemToSave = { ...item, companyId: compId } as CatalogItem;
      if (isEditing) {
        await storageService.updateCatalogItem(itemToSave);
      } else {
        await storageService.saveCatalogItem(itemToSave);
      }
      const updated = await storageService.getCatalog(compId);
      setCatalog(updated);
    } catch (error) {
      alert("Erro ao salvar: " + error);
    } finally {
      setIsFetchingData(false);
    }
  };

  const deleteCatalogItem = async (id: string) => {
    const compId = user!.sub;
    if (!compId) return;
    if (confirm("Deseja remover este item?")) {
      setIsFetchingData(true);
      try {
        await storageService.deleteCatalogItem(id);
        setCatalog(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        alert("Erro ao remover item.");
      } finally {
        setIsFetchingData(false);
      }
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
      setIsFetchingData(true);
      try {
        await storageService.deleteQuote(id);
        setQuotes(prev => prev.filter(q => q.id !== id));
      } catch (error) {
        alert("Erro ao excluir orçamento.");
      } finally {
        setIsFetchingData(false);
      }
    }
  };

  const handleSaveQuote = async (q: Quote) => {
    const compId = user!.sub;
    if (!compId) return;
    setIsFetchingData(true);
    try {
      const quoteWithCompany = { 
        ...q, 
        companyId: compId,
        providerInfo: { ...q.providerInfo, companyId: compId }
      };
      await storageService.saveQuote(quoteWithCompany);
      await fetchQuotes(compId);
      setIsEditingQuote(false);
      setSelectedQuote(null);
    } catch (error) {
      alert("Erro ao salvar orçamento.");
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleSaveSettings = async () => {
    const compId = user!.sub;
    if (!compId) return;
    setIsFetchingData(true);
    try {
      const infoWithCompany = { ...providerInfo, companyId: compId };
      await storageService.saveProviderInfo(infoWithCompany); 
      setProviderInfo(infoWithCompany);
      alert('Dados profissionais salvos!'); 
    } catch (error) {
      alert("Erro ao salvar.");
    } finally {
      setIsFetchingData(false);
    }
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
      {isFetchingData && (
        <div className="fixed inset-0 bg-white/40 z-[100] flex items-center justify-center backdrop-blur-[2px] no-print">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center border border-slate-100">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            <p className="text-sm font-medium text-slate-600">Sincronizando...</p>
          </div>
        </div>
      )}

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
        onTabChange={handleTabChange} 
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
              onDeleteQuote={handleDeleteQuote} 
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
              onSave={handleSaveSettings} 
            />
          )}

          {isEditingQuote && selectedQuote && (
            <QuoteEditorPage 
              quote={selectedQuote} 
              catalog={catalog} 
              onBack={() => { setIsEditingQuote(false); setSelectedQuote(null); }} 
              onUpdateQuote={setSelectedQuote}
              onSave={handleSaveQuote} 
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

// Import necessário para o compId de segurança no handleTabChange
import { authService } from './services/authService';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
