
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

  // Estados para controlar se os dados já foram carregados uma vez
  const [loadedSections, setLoadedSections] = useState({
    quotes: false,
    catalog: false,
    provider: false
  });

  // Funções de busca individuais
  const fetchQuotes = useCallback(async () => {
    if (!user?.companyId) return;
    setIsFetchingData(true);
    try {
      const data = await storageService.getQuotes(user.companyId);
      setQuotes(data);
      setLoadedSections(prev => ({ ...prev, quotes: true }));
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
    } finally {
      setIsFetchingData(false);
    }
  }, [user?.companyId]);

  const fetchCatalog = useCallback(async () => {
    if (!user?.companyId) return;
    setIsFetchingData(true);
    try {
      const data = await storageService.getCatalog(user.companyId);
      setCatalog(data);
      setLoadedSections(prev => ({ ...prev, catalog: true }));
    } catch (error) {
      console.error("Erro ao carregar catálogo:", error);
    } finally {
      setIsFetchingData(false);
    }
  }, [user?.companyId]);

  const fetchProvider = useCallback(async () => {
    if (!user?.companyId) return;
    setIsFetchingData(true);
    try {
      const data = await storageService.getProviderInfo(user.companyId);
      if (data) setProviderInfo(data);
      setLoadedSections(prev => ({ ...prev, provider: true }));
      return data;
    } catch (error) {
      console.error("Erro ao carregar dados do profissional:", error);
    } finally {
      setIsFetchingData(false);
    }
  }, [user?.companyId]);

  // Carregamento sob demanda baseado na aba ativa
  useEffect(() => {
    if (!isAuthenticated || !user?.companyId) return;

    if (activeTab === 'quotes' && !loadedSections.quotes) {
      fetchQuotes();
    } else if (activeTab === 'catalog' && !loadedSections.catalog) {
      fetchCatalog();
    } else if (activeTab === 'settings' && !loadedSections.provider) {
      fetchProvider();
    }
  }, [activeTab, isAuthenticated, user?.companyId, loadedSections, fetchQuotes, fetchCatalog, fetchProvider]);

  const handleStartNewQuote = async () => {
    let currentProvider = providerInfo;
    
    // Se for iniciar um orçamento e os dados do prestador ainda não foram carregados, carrega agora
    if (!loadedSections.provider || providerInfo.name === 'Carregando...') {
      const fetched = await fetchProvider();
      if (fetched) currentProvider = fetched;
    }

    // Se o catálogo não estiver carregado, carrega para o Quick Select do editor
    if (!loadedSections.catalog) {
      fetchCatalog();
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
      companyId: user?.companyId
    };
    setSelectedQuote(newQuote);
    setIsEditingQuote(true);
  };

  const saveCatalogItem = async (item: Partial<CatalogItem>, isEditing: boolean) => {
    setIsFetchingData(true);
    try {
      const itemToSave = { ...item, companyId: user?.companyId } as CatalogItem;
      if (isEditing) {
        await storageService.updateCatalogItem(itemToSave);
      } else {
        await storageService.saveCatalogItem(itemToSave);
      }
      // Refresh local
      const updated = await storageService.getCatalog(user?.companyId);
      setCatalog(updated);
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
    setIsFetchingData(true);
    try {
      const quoteWithCompany = { 
        ...q, 
        companyId: user?.companyId,
        providerInfo: { ...q.providerInfo, companyId: user?.companyId }
      };
      await storageService.saveQuote(quoteWithCompany);
      // Recarrega a lista para manter sincronia
      await fetchQuotes();
      setIsEditingQuote(false);
      setSelectedQuote(null);
    } catch (error) {
      alert("Erro ao salvar orçamento.");
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsFetchingData(true);
    try {
      const infoWithCompany = { ...providerInfo, companyId: user?.companyId };
      await storageService.saveProviderInfo(infoWithCompany); 
      setProviderInfo(infoWithCompany);
      alert('Dados profissionais salvos com sucesso!'); 
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
        <div className="fixed inset-0 bg-white/50 z-[100] flex items-center justify-center backdrop-blur-[1px] no-print">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
