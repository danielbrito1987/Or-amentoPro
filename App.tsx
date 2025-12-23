
import React, { useState, useEffect, useCallback } from 'react';
import { Quote, CatalogItem, ProviderInfo } from './types';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
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

  // Controle de estado para saber o que já foi carregado
  const [loadedSections, setLoadedSections] = useState({
    quotes: false,
    catalog: false,
    provider: false
  });

  useEffect(() => {
    fetchProvider(user != null ? user!.sub : "")
  }, [])

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

  // const fetchCatalog = useCallback(async (compId: string) => {
  //   setIsFetchingData(true);
  //   try {
  //     const data = await storageService.getCatalog(compId);
  //     setCatalog(data);
  //     setLoadedSections(prev => ({ ...prev, catalog: true }));
  //   } catch (error) {
  //     console.error("Erro ao carregar catálogo:", error);
  //   } finally {
  //     setIsFetchingData(false);
  //   }
  // }, []);

  const fetchProvider = useCallback(async (compId: string) => {
    setIsFetchingData(true);
    try {
      const data = await storageService.getProviderInfo(compId);
      if (data) setProviderInfo(data);
      setLoadedSections(prev => ({ ...prev, provider: true }));
      return data;
    } catch (error) {
      console.error("Erro ao carregar dados profissionais:", error);
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  // HANDLER PRINCIPAL: Carrega os dados SOB DEMANDA ao trocar de aba
  const handleTabChange = (tab: 'quotes' | 'catalog' | 'settings') => {
    setActiveTab(tab);
    setSelectedQuote(null);
    setIsEditingQuote(false);
    setIsSidebarOpen(false);

    // Tenta pegar o ID do estado ou direto do storage (fallback para logo após login)
    const currentCompId = user?.companyId || authService.getCurrentUser()?.companyId;
    if (!currentCompId) return;

    if (tab === 'quotes' && !loadedSections.quotes) {
      fetchQuotes(currentCompId);
    } else if (tab === 'catalog' && !loadedSections.catalog) {
      //fetchCatalog(currentCompId);
    } else if (tab === 'settings' && !loadedSections.provider) {
      fetchProvider(currentCompId);
    }
  };

  // Carregamento inicial (Apenas a primeira página ativa)
  useEffect(() => {
    if (isAuthenticated && !loadedSections.quotes && activeTab === 'quotes') {
      const currentCompId = user?.companyId || authService.getCurrentUser()?.companyId;
      if (currentCompId) fetchQuotes(currentCompId);
    }
  }, [isAuthenticated, user, activeTab, loadedSections.quotes, fetchQuotes]);

  const handleStartNewQuote = async () => {
    const currentCompId = user?.sub || authService.getCurrentUser()?.sub;
    if (!currentCompId) return;

    let currentProvider = providerInfo;
    
    // Se for criar orçamento e não tiver dados, carrega agora
    if (!loadedSections.provider) {
      const fetched = await fetchProvider(currentCompId);
      if (fetched) currentProvider = fetched;
    }

    if (!loadedSections.catalog) {
      //await fetchCatalog(currentCompId);
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
      companyId: currentCompId
    };
    setSelectedQuote(newQuote);
    setIsEditingQuote(true);
  };

  const saveCatalogItem = async (item: Partial<CatalogItem>, isEditing: boolean) => {
    const currentCompId = user?.companyId || authService.getCurrentUser()?.companyId;
    if (!currentCompId) return;
    setIsFetchingData(true);
    try {
      const itemToSave = { ...item, companyId: currentCompId } as CatalogItem;
      if (isEditing) {
        await storageService.updateCatalogItem(itemToSave);
      } else {
        await storageService.saveCatalogItem(itemToSave);
      }
      const updated = await storageService.getCatalog(currentCompId);
      //setCatalog(updated);
    } catch (error) {
      alert("Erro ao salvar no catálogo: " + error);
    } finally {
      setIsFetchingData(false);
    }
  };

  const deleteCatalogItem = async (id: string) => {
    if (confirm("Deseja remover este item?")) {
      setIsFetchingData(true);
      try {
        await storageService.deleteCatalogItem(id);
        //setCatalog(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        alert("Erro ao remover.");
      } finally {
        setIsFetchingData(false);
      }
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (confirm("Excluir este orçamento definitivamente?")) {
      setIsFetchingData(true);
      try {
        await storageService.deleteQuote(id);
        setQuotes(prev => prev.filter(q => q.id !== id));
      } catch (error) {
        alert("Erro ao excluir.");
      } finally {
        setIsFetchingData(false);
      }
    }
  };

  const handleSaveQuote = async (q: Quote) => {
    const currentCompId = user?.companyId || authService.getCurrentUser()?.companyId;
    if (!currentCompId) return;
    setIsFetchingData(true);
    try {
      const quoteWithCompany = { 
        ...q, 
        companyId: currentCompId,
        providerInfo: { ...q.providerInfo, companyId: currentCompId }
      };
      await storageService.saveQuote(quoteWithCompany);
      const updatedQuotes = await storageService.getQuotes(currentCompId);
      setQuotes(updatedQuotes);
      setIsEditingQuote(false);
      setSelectedQuote(null);
    } catch (error) {
      alert("Erro ao salvar orçamento.");
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleSaveSettings = async () => {
    const currentCompId = user?.companyId || authService.getCurrentUser()?.companyId;
    if (!currentCompId) return;
    setIsFetchingData(true);
    try {
      const infoWithCompany = { ...providerInfo, companyId: currentCompId };
      await storageService.saveProviderInfo(infoWithCompany); 
      setProviderInfo(infoWithCompany);
      alert('Configurações salvas!'); 
    } catch (error) {
      alert("Erro ao salvar configurações.");
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
            <p className="text-sm font-medium text-slate-600">Atualizando dados...</p>
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
