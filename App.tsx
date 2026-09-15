
import React, { useState, useEffect, useCallback } from 'react';
import { Quote, Contract, ContractSignature, CatalogItem, ProviderInfo } from './types';
import { storageService } from './services/storageService';
import { contractService } from './services/contractService';
import { authService } from './services/authService';
import { Sidebar } from './components/Sidebar';
import { QuotesPage } from './pages/QuotesPage';
import { CatalogPage } from './pages/CatalogPage';
import { SettingsPage } from './pages/SettingsPage';
import { QuoteEditorPage } from './pages/QuoteEditorPage';
import { QuoteViewPage } from './pages/QuoteViewPage';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { ContractsPage } from './pages/ContractsPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FileText, Menu, X, Loader2 } from 'lucide-react';
import { SyncIndicator } from './components/SyncIndicator';
import { AccountSuspendedModal } from './components/AccountSuspendedModal';
import { SubscriptionPaywallModal } from './components/SubscriptionPaywallModal';
import { TrialBanner } from './components/TrialBanner';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AppLogo } from './components/AppLogo';
import { InteractiveGuideModal } from './components/InteractiveGuideModal';
import { ConfirmModal } from './components/ConfirmModal';
import { saasService, BASIC_MONTHLY_QUOTES_LIMIT, SUBSCRIPTION_PLANS } from './services/saasService';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isSuspended, subscriptionInfo, isLoading, logout, refreshUserStatus, loginAsDemo } = useAuth();
  
  // Controle de exibição pública: landing page ou tela de login/cadastro
  const [publicView, setPublicView] = useState<'landing' | 'login' | 'register'>('landing');

  const [showQuoteLimitModal, setShowQuoteLimitModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'quotes' | 'contracts' | 'catalog' | 'settings' | 'admin'>('quotes');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [providerInfo, setProviderInfo] = useState<ProviderInfo>({
    name: 'Carregando...',
    document: '',
    phone: '',
    email: '',
    address: ''
  });
  
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Estados dos modais de confirmação de exclusão
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [catalogItemToDelete, setCatalogItemToDelete] = useState<CatalogItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Controle de estado para saber o que já foi carregado
  const [loadedSections, setLoadedSections] = useState({
    quotes: false,
    contracts: false,
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

  const fetchContracts = useCallback(async (compId: string) => {
    setIsFetchingData(true);
    try {
      const c = await contractService.getAllContracts(compId);
      setContracts(c);
      setLoadedSections(prev => ({ ...prev, contracts: true }));
    } catch (e) {
      console.error("Erro ao buscar contratos:", e);
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
      console.error("Erro ao carregar dados profissionais:", error);
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  // HANDLER PRINCIPAL: Carrega os dados SOB DEMANDA ao trocar de aba
  const handleTabChange = (tab: 'quotes' | 'catalog' | 'settings' | 'contracts') => {
    setActiveTab(tab);
    setSelectedQuote(null);
    setSelectedContract(null);
    setIsEditingQuote(false);
    setIsEditingContract(false);
    setIsSidebarOpen(false);

    // Tenta pegar o ID do estado ou direto do storage (fallback para logo após login)
    const currentCompId = user?.companyId || authService.getCurrentUser()?.companyId;
    if (!currentCompId) return;

    if (tab === 'quotes' && !loadedSections.quotes) {
      fetchQuotes(currentCompId);
    } else if (tab === 'contracts' && !loadedSections.contracts) {
      fetchContracts(currentCompId);
    } else if (tab === 'catalog' && !loadedSections.catalog) {
      fetchCatalog(currentCompId);
    } else if (tab === 'settings' && !loadedSections.provider) {
      fetchProvider(currentCompId);
    }
  };

  // Carregamento e sincronização completa por conta de usuário (previne vazamento de dados entre contas)
  useEffect(() => {
    if (!isAuthenticated || !user?.companyId) {
      // Usuário deslogado: zera todos os dados da memória
      setQuotes([]);
      setContracts([]);
      setCatalog([]);
      setSelectedQuote(null);
      setSelectedContract(null);
      setIsEditingQuote(false);
      setIsEditingContract(false);
      setProviderInfo({
        name: '',
        document: '',
        phone: '',
        email: '',
        address: ''
      });
      setLoadedSections({
        quotes: false,
        contracts: false,
        catalog: false,
        provider: false
      });
      return;
    }

    const currentCompId = user.companyId;

    // Inicializa o providerInfo com os dados limpos do usuário atual enquanto busca os dados salvos
    setProviderInfo({
      name: user.name || 'Prestador de Serviços',
      document: '',
      phone: '',
      email: user.email || '',
      address: '',
      companyId: currentCompId
    });

    // Limpa dados em memória da conta anterior
    setQuotes([]);
    setContracts([]);
    setCatalog([]);
    setSelectedQuote(null);
    setSelectedContract(null);
    setIsEditingQuote(false);
    setIsEditingContract(false);

    // Marca seções para carregamento da nova conta
    setLoadedSections({
      quotes: false,
      contracts: false,
      catalog: false,
      provider: false
    });

    // Busca dados exclusivos da conta atual
    fetchProvider(currentCompId);
    fetchQuotes(currentCompId);
    fetchContracts(currentCompId);
    fetchCatalog(currentCompId);
  }, [isAuthenticated, user?.id, user?.companyId, fetchProvider, fetchQuotes, fetchContracts, fetchCatalog]);

  const handleStartNewQuote = async () => {
    const currentCompId = user?.companyId || authService.getCurrentUser()?.companyId;
    if (!currentCompId) return;

    // Checagem de limite mensal de orçamentos (Plano Básico vs Pro)
    const limitCheck = saasService.checkQuoteCreationLimit(user, quotes);
    if (!limitCheck.allowed) {
      setShowQuoteLimitModal(true);
      return;
    }

    let currentProvider = providerInfo;
    
    // Se for criar orçamento e não tiver dados, carrega agora
    if (!loadedSections.provider) {
      const fetched = await fetchProvider(currentCompId);
      if (fetched) currentProvider = fetched;
    }

    if (!loadedSections.catalog) {
      await fetchCatalog(currentCompId);
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

  /*const newContract: Contract = {
    id: crypto.randomUUID(),
    contractNumber: `CONT-${String(contracts.length + 1).padStart(4, '0')}`,
    quoteId: selectedQuote.id,
    quoteNumber: selectedQuote.number,
    userEmail: '',
    status: 'draft',
    providerName: providerInfo.name,
    providerDocument: providerInfo.document,
    providerAddress: providerInfo.address,
    providerEmail: providerInfo.email,
    providerPhone: providerInfo.phone,
    clientName: selectedQuote.customerName,
    clientDocument: '',
    clientAddress: selectedQuote.customerAddress,
    clientEmail: selectedQuote.customerEmail,
    clientPhone: selectedQuote.customerPhone,
  };*/

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
      setCatalog(updated);
    } catch (error) {
      alert("Erro ao salvar no catálogo: " + error);
    } finally {
      setIsFetchingData(false);
    }
  };

  // Exclusão de item do catálogo com modal próprio
  const handleRequestDeleteCatalogItem = (id: string) => {
    const found = catalog.find(i => i.id === id);
    if (found) {
      setCatalogItemToDelete(found);
    } else {
      setCatalogItemToDelete({ id, name: 'Item do catálogo' } as CatalogItem);
    }
  };

  const confirmDeleteCatalogItem = async () => {
    if (!catalogItemToDelete) return;
    setIsDeletingItem(true);
    try {
      await storageService.deleteCatalogItem(catalogItemToDelete.id);
      setCatalog(prev => prev.filter(i => i.id !== catalogItemToDelete.id));
      setDeleteToast('Item removido do catálogo com sucesso!');
      setTimeout(() => setDeleteToast(null), 3500);
    } catch (error) {
      console.error("Erro ao remover do catálogo:", error);
      setDeleteToast('Erro ao remover item do catálogo.');
      setTimeout(() => setDeleteToast(null), 3500);
    } finally {
      setIsDeletingItem(false);
      setCatalogItemToDelete(null);
    }
  };

  // Exclusão de orçamento com modal próprio
  const handleRequestDeleteQuote = (id: string) => {
    const found = quotes.find(q => q.id === id) || (selectedQuote?.id === id ? selectedQuote : null);
    if (found) {
      setQuoteToDelete(found);
    } else {
      setQuoteToDelete({ id, number: 'Orçamento', customerName: '' } as Quote);
    }
  };

  const confirmDeleteQuote = async () => {
    if (!quoteToDelete) return;
    setIsDeletingItem(true);
    try {
      await storageService.deleteQuote(quoteToDelete.id);
      setQuotes(prev => prev.filter(q => q.id !== quoteToDelete.id));
      if (selectedQuote?.id === quoteToDelete.id) {
        setSelectedQuote(null);
        setIsEditingQuote(false);
      }
      setDeleteToast(`Orçamento ${quoteToDelete.number || ''} excluído com sucesso!`);
      setTimeout(() => setDeleteToast(null), 3500);
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      setDeleteToast('Erro ao excluir orçamento. Tente novamente.');
      setTimeout(() => setDeleteToast(null), 3500);
    } finally {
      setIsDeletingItem(false);
      setQuoteToDelete(null);
    }
  };

  const handleSaveQuote = async (q: Quote) => {
    const currentCompId = user?.companyId || authService.getCurrentUser()?.companyId;
    if (!currentCompId) return;

    // Se for um novo orçamento sendo salvo, valida o limite do plano
    const isExisting = quotes.some(item => item.id === q.id);
    if (!isExisting) {
      const limitCheck = saasService.checkQuoteCreationLimit(user, quotes);
      if (!limitCheck.allowed) {
        setShowQuoteLimitModal(true);
        return;
      }
    }

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
      
      // Abre direto a tela de visualização/compartilhamento do orçamento salvo
      const savedQuote = updatedQuotes.find(item => item.id === quoteWithCompany.id) || quoteWithCompany;
      setSelectedQuote(savedQuote);
      setIsEditingQuote(false);
      setDeleteToast(`Orçamento ${savedQuote.number} salvo com sucesso!`);
      setTimeout(() => setDeleteToast(null), 3500);
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

  const handleLogout = () => {
    logout();
    setQuotes([]);
    setContracts([]);
    setCatalog([]);
    setSelectedQuote(null);
    setSelectedContract(null);
    setIsEditingQuote(false);
    setIsEditingContract(false);
    setProviderInfo({
      name: '',
      document: '',
      phone: '',
      email: '',
      address: ''
    });
    setLoadedSections({
      quotes: false,
      contracts: false,
      catalog: false,
      provider: false
    });
    setActiveTab('quotes');
    setPublicView('landing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (publicView === 'login') {
      return (
        <LoginPage 
          initialMode="login" 
          onBackToLanding={() => setPublicView('landing')} 
        />
      );
    }

    if (publicView === 'register') {
      return (
        <LoginPage 
          initialMode="register" 
          onBackToLanding={() => setPublicView('landing')} 
        />
      );
    }

    return (
      <LandingPage 
        onGoToLogin={() => setPublicView('login')}
        onGoToRegister={() => setPublicView('register')}
      />
    );
  }

  if (isSuspended) {
    // Se o usuário estiver bloqueado por término de trial ou mensalidade, exibe a tela de pagamento PIX
    if (subscriptionInfo.status === 'expired') {
      return (
        <SubscriptionPaywallModal
          userEmail={user?.email}
          userName={user?.name}
          onLogout={handleLogout}
          onCheckStatus={refreshUserStatus}
        />
      );
    }

    return (
      <AccountSuspendedModal
        userEmail={user?.email}
        reason={user?.statusReason}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-x-hidden">
      {isFetchingData && (
        <div className="fixed inset-0 bg-white/40 z-[100] flex items-center justify-center backdrop-blur-[2px] no-print">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center border border-slate-100">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            <p className="text-sm font-medium text-slate-600">Atualizando dados...</p>
          </div>
        </div>
      )}

      <div className="md:hidden flex items-center justify-between p-3.5 bg-slate-900 text-white no-print border-b border-slate-800">
        <AppLogo size="sm" />
        <div className="flex items-center space-x-2">
          <SyncIndicator isCollapsed={true} />
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        providerInfo={providerInfo} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <main className="flex-1 overflow-y-auto bg-gray-50 pb-20 md:pb-0 flex flex-col">
        {/* Barra superior de aviso de dias restantes de teste grátis */}
        <TrialBanner />

        <div className="max-w-6xl w-full mx-auto p-4 md:p-8 flex-1">
          {activeTab === 'quotes' && !isEditingQuote && !selectedQuote && (
            <QuotesPage 
              quotes={quotes} 
              onNewQuote={handleStartNewQuote} 
              onSelectQuote={setSelectedQuote} 
              onDeleteQuote={handleRequestDeleteQuote}
              onOpenGuide={() => setIsGuideOpen(true)}
            />
          )}

          {activeTab === 'contracts' && !isEditingContract && (
            <ContractsPage 
              onUpgradeToPremium={() => setIsPaywallOpen(true)} 
              quotes={quotes}
              onSelectQuote={(q) => {
                setSelectedQuote(q);
                setActiveTab('quotes');
              }}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogPage 
              catalog={catalog} 
              onSaveItem={saveCatalogItem} 
              onDeleteItem={handleRequestDeleteCatalogItem} 
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage 
              providerInfo={providerInfo} 
              onUpdate={setProviderInfo} 
              onSave={handleSaveSettings} 
            />
          )}

          {activeTab === 'admin' && (
            <AdminDashboardPage />
          )}

          {isEditingQuote && selectedQuote && (
            <QuoteEditorPage 
              quote={selectedQuote} 
              catalog={catalog} 
              onBack={() => { setIsEditingQuote(false); setSelectedQuote(null); }} 
              onUpdateQuote={setSelectedQuote}
              onSave={handleSaveQuote} 
              onSaveCatalogItem={saveCatalogItem}
            />
          )}

          {selectedQuote && !isEditingQuote && (
            <QuoteViewPage 
              quote={selectedQuote} 
              providerInfo={providerInfo} 
              onBack={() => setSelectedQuote(null)} 
              onEdit={() => setIsEditingQuote(true)} 
              onDelete={() => handleRequestDeleteQuote(selectedQuote.id)}
              onApproveQuote={async (q) => {
                const updated = { ...q, status: 'approved' as const };
                await storageService.saveQuote(updated);
                setSelectedQuote(updated);
                if (user?.companyId) await fetchQuotes(user.companyId);
                setDeleteToast('Orçamento marcado como Aprovado!');
                setTimeout(() => setDeleteToast(null), 3000);
              }}
              onGenerateContract={async (quoteToContract) => {
                // Checa se usuário possui plano Premium
                if (!saasService.canUseContracts(user).allowed) {
                  setIsPaywallOpen(true);
                  return;
                }
                try {
                  setIsFetchingData(true);
                  const newContract = await contractService.createContractFromQuote(
                    quoteToContract,
                    providerInfo,
                    user?.email,
                    user?.companyId
                  );
                  const updatedQuote = {
                    ...quoteToContract,
                    status: 'approved' as const,
                    contractId: newContract.id
                  };
                  await storageService.saveQuote(updatedQuote);
                  if (user?.companyId) {
                    await fetchQuotes(user.companyId);
                    await fetchContracts(user.companyId);
                  }
                  setSelectedQuote(null);
                  setActiveTab('contracts');
                  setDeleteToast(`Contrato ${newContract.contractNumber} gerado com sucesso!`);
                  setTimeout(() => setDeleteToast(null), 4000);
                } catch (err: any) {
                  console.error('Erro ao gerar contrato:', err);
                  alert('Erro ao gerar contrato: ' + (err.message || 'Tente novamente.'));
                } finally {
                  setIsFetchingData(false);
                }
              }}
              onViewContract={(contractId) => {
                setSelectedQuote(null);
                setActiveTab('contracts');
              }}
            />
          )}
        </div>
      </main>

      {/* Notificação toast de feedback */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
          {deleteToast}
        </div>
      )}

      {/* Modal de confirmação para exclusão de orçamento */}
      <ConfirmModal
        isOpen={Boolean(quoteToDelete)}
        title="Excluir Orçamento?"
        message={`Tem certeza que deseja excluir definitivamente o orçamento ${quoteToDelete?.number || ''}${quoteToDelete?.customerName ? ` de "${quoteToDelete.customerName}"` : ''}? Esta ação removerá o registro do seu painel e não poderá ser desfeita.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeletingItem}
        onConfirm={confirmDeleteQuote}
        onClose={() => setQuoteToDelete(null)}
      />

      {/* Modal de confirmação para exclusão de item do catálogo */}
      <ConfirmModal
        isOpen={Boolean(catalogItemToDelete)}
        title="Remover Item do Catálogo?"
        message={`Deseja remover o item "${catalogItemToDelete?.name || ''}" do seu catálogo?`}
        confirmLabel="Sim, Remover"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeletingItem}
        onConfirm={confirmDeleteCatalogItem}
        onClose={() => setCatalogItemToDelete(null)}
      />

      <InteractiveGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onNavigateToTab={(tab) => {
          handleTabChange(tab);
          setIsGuideOpen(false);
        }}
        onStartNewQuote={() => {
          setIsGuideOpen(false);
          handleStartNewQuote();
        }}
      />

      {showQuoteLimitModal && (
        <SubscriptionPaywallModal
          userEmail={user?.email}
          userName={user?.name}
          onLogout={() => { setShowQuoteLimitModal(false); handleLogout(); }}
          onClose={() => setShowQuoteLimitModal(false)}
          onCheckStatus={() => {
            if (refreshUserStatus) refreshUserStatus();
            setShowQuoteLimitModal(false);
          }}
          initialPlan="pro"
          customBadge={`Limite Mensal Atingido (${BASIC_MONTHLY_QUOTES_LIMIT}/${BASIC_MONTHLY_QUOTES_LIMIT})`}
          customTitle="Limite de Orçamentos Mensais Atingido"
          customSubtitle={`Você atingiu o limite de ${BASIC_MONTHLY_QUOTES_LIMIT} orçamentos mensais do Plano Básico. Faça o upgrade para o Plano Pro para emitir orçamentos ilimitados e desbloquear o Consultor de Preços com IA!`}
        />
      )}
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
