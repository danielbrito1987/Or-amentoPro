import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  UserCheck, 
  UserX, 
  PlusCircle, 
  Calendar, 
  DollarSign, 
  CreditCard,
  QrCode,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Mail,
  Shield,
  HelpCircle,
  Building2,
  Handshake,
  Tag,
  Gift,
  Trash2,
  Edit2,
  Copy,
  Check,
  Crown,
  Layers,
  Zap
} from 'lucide-react';
import { saasService, SaaSUserRecord, SubscriptionPlanId } from '../services/saasService';
import { partnerService, PartnerCompany } from '../services/partnerService';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';

export const AdminDashboardPage: React.FC = () => {
  const { user, refreshUserStatus } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'partners'>('users');
  const [users, setUsers] = useState<SaaSUserRecord[]>([]);
  const [partners, setPartners] = useState<PartnerCompany[]>([]);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [userToBlock, setUserToBlock] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'partner' | 'trial' | 'expired'>('all');

  // Modal para alterar o plano do cliente (Básico, Pro ou Premium)
  const [userToChangePlan, setUserToChangePlan] = useState<SaaSUserRecord | null>(null);
  const [selectedPlanToSet, setSelectedPlanToSet] = useState<SubscriptionPlanId>('pro');
  const [alsoActivateDays, setAlsoActivateDays] = useState<boolean>(false);
  const [activateDaysCount, setActivateDaysCount] = useState<number>(30);

  // Modal para associar usuário a uma parceria
  const [userToPartner, setUserToPartner] = useState<SaaSUserRecord | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [assignMode, setAssignMode] = useState<'partner_vip' | 'referred_client'>('partner_vip');
  const [selectedPartnerForReferrals, setSelectedPartnerForReferrals] = useState<PartnerCompany | null>(null);

  // Modal / formulário para adicionar/editar empresa parceira
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerCompany | null>(null);
  const [partnerForm, setPartnerForm] = useState({
    code: '',
    name: '',
    partnerEmail: '',
    contactPerson: '',
    phone: '',
    notes: '',
    accessType: 'vitalicio' as 'vitalicio' | 'dias',
    accessDays: 365
  });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleCopyLink = (code: string) => {
    const link = partnerService.generateReferralLink(code);
    navigator.clipboard.writeText(link);
    setCopiedLink(code);
    setTimeout(() => setCopiedLink(null), 3000);
  };
  
  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    try {
      const res = await saasService.syncWithSupabase();
      loadData();
      refreshUserStatus();
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback("Erro ao conectar com Supabase: " + (err.message || "tente novamente"));
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadData = () => {
    setUsers(saasService.getAllUsers());
    setPartners(partnerService.getPartners());
  };

  useEffect(() => {
    loadData();
    handleSyncSupabase();
  }, []);

  const handleOpenChangePlan = (u: SaaSUserRecord) => {
    setUserToChangePlan(u);
    setSelectedPlanToSet(u.plan || 'pro');
    setAlsoActivateDays(false);
    setActivateDaysCount(30);
  };

  const confirmChangePlan = async () => {
    if (!userToChangePlan) return;
    const planName = selectedPlanToSet === 'premium' ? 'Premium' : selectedPlanToSet === 'pro' ? 'Pro' : 'Básico';

    await saasService.updateUserPlan(userToChangePlan.email, selectedPlanToSet);

    if (alsoActivateDays && activateDaysCount > 0) {
      await saasService.activateSubscriptionForUser(
        userToChangePlan.email,
        activateDaysCount,
        selectedPlanToSet,
        `Plano atualizado para ${planName} com liberação de +${activateDaysCount} dias pelo Administrador em ${new Date().toLocaleDateString('pt-BR')}`
      );
    }

    loadData();
    refreshUserStatus();
    setFeedback(`Plano de ${userToChangePlan.name || userToChangePlan.email} alterado para ${planName.toUpperCase()} com sucesso!`);
    setUserToChangePlan(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleActivate = async (email: string, days: number = 30, plan?: SubscriptionPlanId) => {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const targetPlan = plan || (existing && existing.plan) || 'pro';
    await saasService.activateSubscriptionForUser(email, days, targetPlan, `Liberado pelo Administrador em ${new Date().toLocaleDateString('pt-BR')}`);
    loadData();
    refreshUserStatus();
    setFeedback(`Assinatura (${targetPlan.toUpperCase()}) de ${email} ativada por mais ${days} dias com sucesso!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleResetTrial = (email: string, days: number = 7) => {
    saasService.resetTrialForUser(email, days);
    loadData();
    refreshUserStatus();
    setFeedback(`Período de teste de ${days} dias reiniciado para ${email}!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleBlock = (email: string) => {
    setUserToBlock(email);
  };

  const confirmBlockUser = () => {
    if (!userToBlock) return;
    saasService.blockUserAccess(userToBlock, 'Acesso bloqueado pelo Administrador');
    loadData();
    refreshUserStatus();
    setFeedback(`Acesso de ${userToBlock} suspenso.`);
    setUserToBlock(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Aplica liberação de parceiro para um usuário
  const handleAssignPartner = (u: SaaSUserRecord, initialMode: 'partner_vip' | 'referred_client' = 'partner_vip') => {
    setUserToPartner(u);
    setAssignMode(initialMode);
    if (partners.length > 0) {
      setSelectedPartnerId(partners[0].id);
    }
  };

  const confirmAssignPartner = async () => {
    if (!userToPartner) return;
    const partner = partners.find(p => p.id === selectedPartnerId);
    if (!partner) {
      setFeedback("Selecione um parceiro válido.");
      return;
    }

    if (assignMode === 'partner_vip') {
      const days = partner.accessType === 'dias' ? partner.accessDays : undefined;
      await saasService.setPartnerAccessForUser(userToPartner.email, partner.name, partner.code, days);
      setFeedback(`Acesso VIP gratuito liberado para a conta do profissional parceiro "${partner.name}" (${userToPartner.email})!`);
    } else {
      await saasService.linkUserToReferralPartner(userToPartner.email, partner.name, partner.code);
      setFeedback(`Usuário ${userToPartner.email} vinculado como empresa indicada por "${partner.name}". A assinatura segue o fluxo normal de pagamento.`);
    }

    loadData();
    refreshUserStatus();
    setUserToPartner(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Salvar nova empresa parceira ou edição
  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const email = partnerForm.partnerEmail ? partnerForm.partnerEmail.trim().toLowerCase() : undefined;

      if (editingPartner) {
        partnerService.updatePartner(editingPartner.id, {
          code: partnerForm.code,
          name: partnerForm.name,
          partnerEmail: email,
          contactPerson: partnerForm.contactPerson,
          phone: partnerForm.phone,
          notes: partnerForm.notes,
          accessType: partnerForm.accessType,
          accessDays: Number(partnerForm.accessDays) || 365
        });

        // Se informou e-mail do parceiro, garante o acesso gratuito na conta dele
        if (email) {
          const days = partnerForm.accessType === 'dias' ? (Number(partnerForm.accessDays) || 365) : undefined;
          await saasService.setPartnerAccessForUser(email, partnerForm.name, partnerForm.code, days);
        }

        setFeedback(`Parceria com "${partnerForm.name}" atualizada com sucesso!`);
      } else {
        const newP = partnerService.addPartner({
          code: partnerForm.code,
          name: partnerForm.name,
          partnerEmail: email,
          contactPerson: partnerForm.contactPerson,
          phone: partnerForm.phone,
          notes: partnerForm.notes,
          active: true,
          accessType: partnerForm.accessType,
          accessDays: Number(partnerForm.accessDays) || 365
        });

        // Se informou e-mail do parceiro, já libera o acesso VIP para ele
        if (email) {
          const days = partnerForm.accessType === 'dias' ? (Number(partnerForm.accessDays) || 365) : undefined;
          await saasService.setPartnerAccessForUser(email, newP.name, newP.code, days);
        }

        setFeedback(`Parceria com "${partnerForm.name}" cadastrada com sucesso! Código: ${partnerForm.code.toUpperCase()}`);
      }
      setIsPartnerModalOpen(false);
      setEditingPartner(null);
      setPartnerForm({
        code: '',
        name: '',
        partnerEmail: '',
        contactPerson: '',
        phone: '',
        notes: '',
        accessType: 'vitalicio',
        accessDays: 365
      });
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(err.message || 'Erro ao salvar parceiro.');
    }
  };

  const handleOpenEditPartner = (p: PartnerCompany) => {
    setEditingPartner(p);
    setPartnerForm({
      code: p.code,
      name: p.name,
      partnerEmail: p.partnerEmail || '',
      contactPerson: p.contactPerson || '',
      phone: p.phone || '',
      notes: p.notes || '',
      accessType: p.accessType || 'vitalicio',
      accessDays: p.accessDays || 365
    });
    setIsPartnerModalOpen(true);
  };

  const handleTogglePartnerActive = (id: string, current: boolean) => {
    partnerService.updatePartner(id, { active: !current });
    loadData();
  };

  const handleDeletePartner = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover a parceria com "${name}"? Os clientes já cadastrados continuarão no sistema, mas novos cadastros com este código não serão permitidos.`)) {
      partnerService.deletePartner(id);
      loadData();
      setFeedback(`Parceria "${name}" removida.`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Métricas do SaaS calculadas dinamicamente com base na validade e datas reais
  const totalUsers = users.length;
  const activePaidUsers = users.filter(u => saasService.getEffectiveUserStatus(u) === 'active' && u.role !== 'admin').length;
  const partnerUsers = users.filter(u => saasService.getEffectiveUserStatus(u) === 'partner').length;
  const trialUsers = users.filter(u => saasService.getEffectiveUserStatus(u) === 'trial').length;
  const expiredUsers = users.filter(u => saasService.getEffectiveUserStatus(u) === 'expired').length;
  const monthlyRevenue = users
    .filter(u => saasService.getEffectiveUserStatus(u) === 'active' && u.role !== 'admin')
    .reduce((acc, u) => {
      const plan = u.plan || 'pro';
      return acc + (plan === 'premium' ? 199.90 : plan === 'basic' ? 29.90 : 59.90);
    }, 0);

  const filteredUsers = users.filter(u => {
    const effectiveStatus = saasService.getEffectiveUserStatus(u);
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        if (effectiveStatus !== 'active' || u.role === 'admin') return false;
      } else if (statusFilter === 'partner') {
        if (effectiveStatus !== 'partner') return false;
      } else if (statusFilter === 'trial') {
        if (effectiveStatus !== 'trial') return false;
      } else if (statusFilter === 'expired') {
        if (effectiveStatus !== 'expired') return false;
      }
    }

    const matchesSearch = 
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.partnerCompany && u.partnerCompany.toLowerCase().includes(search.toLowerCase()));

    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Cabeçalho do Painel Admin */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Painel do Dono do SaaS</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Gestão de Assinantes &bull; OrçaFácil Pro
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Gerencie quem tem acesso ao sistema, altere os planos dos clientes (Básico, Pro e Premium), libere parceiros e aprove PIX.
            </p>
          </div>

          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncSupabase}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl font-bold text-xs md:text-sm shadow-lg shadow-blue-500/30 transition-all cursor-pointer border border-blue-400/40 active:scale-95"
              title="Consultar cadastros diretamente no banco de dados do Supabase"
            >
              <RefreshCw className={"w-4 h-4 " + (isSyncing ? "animate-spin" : "")} />
              <span>{isSyncing ? "Sincronizando..." : "Sincronizar com Supabase"}</span>
            </button>

            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-right">
              <span className="text-[11px] text-blue-200 uppercase tracking-wider font-semibold block">
                Faturamento Mensal Estimado
              </span>
              <span className="text-2xl md:text-3xl font-black text-emerald-400">
                {formatCurrency(monthlyRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">Fechar</button>
        </div>
      )}

      {/* Cards de Métricas com filtro interativo por clique */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Total Cadastros</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalUsers}</span>
          <p className="text-[11px] text-slate-400 mt-1">Clientes na base</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
            statusFilter === 'active'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 text-xs font-bold uppercase mb-2">
            <span>Assinantes Pagantes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600">{activePaidUsers}</span>
          <p className="text-[11px] text-slate-400 mt-1">Básico, Pro e Premium</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'partner' ? 'all' : 'partner')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
            statusFilter === 'partner'
              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
              : 'bg-white border-indigo-200/90 hover:border-indigo-300 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-700 text-xs font-bold uppercase mb-2">
            <span>Empresas Parceiras</span>
            <Handshake className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-indigo-700">{partnerUsers}</span>
          <p className="text-[11px] text-indigo-500 mt-1">{partners.length} convênio(s) cadastrado(s)</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'trial' ? 'all' : 'trial')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
            statusFilter === 'trial'
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 text-xs font-bold uppercase mb-2">
            <span>Em Teste (Trial)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-600">{trialUsers}</span>
          <p className="text-[11px] text-slate-400 mt-1">Dentro dos 7 dias</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
            statusFilter === 'expired'
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 text-xs font-bold uppercase mb-2">
            <span>Vencidos / Expirados</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-rose-600">{expiredUsers}</span>
          <p className="text-[11px] text-slate-400 mt-1">Bloqueados no paywall</p>
        </button>
      </div>

      {/* Tabs Principais do Admin: Lista de Clientes vs Empresas Parceiras */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeSubTab === 'users'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestão de Clientes & Assinaturas ({filteredUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('partners')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeSubTab === 'partners'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>Estrutura de Parcerias & Cupons VIP ({partners.length})</span>
        </button>
      </div>

      {/* ABA 1: LISTA DE USUÁRIOS */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Caixa de Informações da Chave PIX */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-xl shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Sua Chave PIX de Recebimento: <span className="font-mono text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-200">{saasService.getPixKey()}</span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Valor da assinatura: <strong>{formatCurrency(saasService.getMonthlyPrice())}/mês</strong> &bull; Período de teste: <strong>7 dias</strong>
                </p>
              </div>
            </div>
            <div className="text-xs text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200 shrink-0">
              Para liberar parcerias ou assinaturas pagas, use as ações na tabela abaixo.
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">Lista de Clientes do Sistema</h3>
                  <button
                    onClick={handleSyncSupabase}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    title="Sincronizar cadastros agora com o Supabase"
                  >
                    <RefreshCw className={"w-3.5 h-3.5 " + (isSyncing ? "animate-spin" : "")} />
                    <span>{isSyncing ? "Sincronizando..." : "Sincronizar"}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-500">Total de {filteredUsers.length} usuário(s) exibido(s)</p>
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                      <span>Filtrando por: <strong>
                        {statusFilter === 'expired' ? 'Vencidos / Expirados' :
                         statusFilter === 'trial' ? 'Em Teste (Trial)' :
                         statusFilter === 'active' ? 'Assinantes Pagantes' :
                         'Empresas Parceiras'}
                      </strong></span>
                      <button
                        onClick={() => setStatusFilter('all')}
                        className="text-slate-400 hover:text-slate-700 font-bold ml-1 text-sm leading-none"
                        title="Limpar filtro"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                </div>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por e-mail, nome ou parceiro..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Usuário / E-mail</th>
                    <th className="py-3.5 px-4">Cadastro</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Plano Atual</th>
                    <th className="py-3.5 px-4">Validade do Acesso</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isMasterAdmin = u.email.toLowerCase() === saasService.getAdminEmail().toLowerCase();
                    const effectiveStatus = saasService.getEffectiveUserStatus(u);
                    const isPartner = effectiveStatus === 'partner' || u.isPartnerAccount;
                    const isTrial = effectiveStatus === 'trial';
                    const isActive = effectiveStatus === 'active';
                    const isExpired = effectiveStatus === 'expired';
                    const userPlan: SubscriptionPlanId = (isMasterAdmin ? 'premium' : (u.plan || 'pro'));

                    // Cálculo de dias restantes
                    const trialEnd = new Date(u.trialEndsAt);
                    const validUntil = u.subscriptionValidUntil ? new Date(u.subscriptionValidUntil) : null;
                    const dateToCompare = validUntil || trialEnd;
                    const diffDays = Math.ceil((dateToCompare.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <tr key={u.id || u.email} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isMasterAdmin 
                                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                : isPartner || u.isPartnerAccount
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">{u.name}</span>
                              <span className="text-slate-500 text-xs block font-mono truncate">{u.email}</span>
                              {u.isPartnerAccount ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full font-bold mt-0.5">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                  Conta VIP do Parceiro ({u.partnerCompany})
                                </span>
                              ) : u.partnerCompany ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full font-semibold mt-0.5">
                                  <Building2 className="w-2.5 h-2.5 text-blue-500" />
                                  Indicado por: {u.partnerCompany}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                        </td>

                        {/* Status da Conta */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isMasterAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <Shield className="w-3 h-3" /> Dono (Admin)
                            </span>
                          ) : isPartner || u.isPartnerAccount ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <Sparkles className="w-3 h-3 text-amber-500" /> Parceiro VIP
                            </span>
                          ) : isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Assinante Ativo
                            </span>
                          ) : isTrial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" /> Teste ({diffDays > 0 ? `${diffDays}d rest.` : '7d'})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertCircle className="w-3 h-3" /> Vencido / Expirado
                            </span>
                          )}
                        </td>

                        {/* Plano do Usuário (com botão de edição rápida) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isMasterAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
                              <Crown className="w-3.5 h-3.5 text-purple-600" /> Premium Total
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {userPlan === 'premium' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 border border-amber-300 shadow-sm">
                                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Premium (R$ 199)</span>
                                </span>
                              ) : userPlan === 'basic' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Básico (R$ 29)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Pro (R$ 59)</span>
                                </span>
                              )}
                              <button
                                onClick={() => handleOpenChangePlan(u)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Alterar plano deste cliente (Básico, Pro ou Premium)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isMasterAdmin ? (
                            <span className="text-slate-500 font-semibold text-xs">Vitalício</span>
                          ) : (isPartner || u.isPartnerAccount) && (!u.subscriptionValidUntil || new Date(u.subscriptionValidUntil).getFullYear() > 2090) ? (
                            <span className="text-indigo-600 font-bold text-xs flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              Vitalício (VIP Parceiro)
                            </span>
                          ) : (
                            <div>
                              <span className="font-semibold text-slate-800 block text-xs">
                                {dateToCompare.toLocaleDateString('pt-BR')}
                              </span>
                              <span className={`text-[11px] font-bold ${diffDays > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {diffDays > 0 ? `${diffDays} dias restantes` : 'Expirou'}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          {isMasterAdmin ? (
                            <span className="text-xs text-slate-400 italic">Conta Mestre</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botão de Alterar Plano */}
                              <button
                                onClick={() => handleOpenChangePlan(u)}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                                title="Alterar plano (Básico, Pro ou Premium) para este cliente"
                              >
                                <Crown className="w-3.5 h-3.5 text-amber-600" />
                                <span>Mudar Plano</span>
                              </button>

                              {/* Botão de Vincular Parceiro */}
                              <button
                                onClick={() => handleAssignPartner(u)}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                                title="Configurar vínculo com parceiro (VIP ou Indicação)"
                              >
                                <Handshake className="w-3.5 h-3.5" />
                                <span>Parceria</span>
                              </button>

                              <button
                                onClick={() => handleActivate(u.email, 30)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                                title="Aprovar pagamento PIX e conceder 30 dias de acesso no plano atual"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Liberar +30 Dias</span>
                              </button>

                              <button
                                onClick={() => handleResetTrial(u.email, 7)}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                                title="Dar mais 7 dias grátis de teste"
                              >
                                +7d Teste
                              </button>

                              <button
                                onClick={() => handleBlock(u.email)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                                title="Bloquear usuário imediatamente"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: GESTÃO DE PARCEIROS ESTRATÉGICOS */}
      {activeSubTab === 'partners' && (
        <div className="space-y-6">
          {/* Card explicativo do Modelo de Parceria */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 rounded-3xl p-6 text-white border border-indigo-800 shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-indigo-200 text-xs font-semibold">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modelo de Parceria Estratégica</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black">Como funciona sua estratégia de parcerias:</h3>
                <p className="text-sm text-indigo-100 leading-relaxed">
                  Você disponibiliza <strong>acesso 100% gratuito e vitalício</strong> para o designer ou arquiteto parceiro utilizar nos projetos dele. Em contrapartida, ele divulga o OrçaFácil para a rede dele de marcenarias, construtoras e clientes. <strong>As empresas indicadas pagam o sistema normalmente</strong> (após o teste de 7 dias grátis), gerando receita recorrente para você!
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingPartner(null);
                  setPartnerForm({
                    code: '',
                    name: '',
                    partnerEmail: '',
                    contactPerson: '',
                    phone: '',
                    notes: '',
                    accessType: 'vitalicio',
                    accessDays: 365
                  });
                  setIsPartnerModalOpen(true);
                }}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Cadastrar Novo Parceiro</span>
              </button>
            </div>
          </div>

          {/* Grid de Parceiros Estratégicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map((p) => {
              // Identifica o próprio parceiro e as empresas indicadas por ele
              const partnerAccountUser = p.partnerEmail 
                ? users.find(u => u.email.toLowerCase() === p.partnerEmail!.toLowerCase()) 
                : users.find(u => u.partnerCode === p.code && u.isPartnerAccount);
              
              const isPartnerVipActive = partnerAccountUser && partnerAccountUser.subscriptionStatus === 'partner';

              const referredUsers = users.filter(u => 
                (u.partnerCode === p.code || u.partnerCompany === p.name) && 
                (!u.isPartnerAccount && u.email.toLowerCase() !== (p.partnerEmail || '').toLowerCase())
              );

              const totalReferred = referredUsers.length;
              const payingReferred = referredUsers.filter(u => u.subscriptionStatus === 'active').length;
              const monthlyGenerated = payingReferred * saasService.getMonthlyPrice();
              const referralUrl = partnerService.generateReferralLink(p.code);

              return (
                <div 
                  key={p.id}
                  className={`bg-white rounded-3xl border p-5 shadow-sm space-y-4 transition-all relative overflow-hidden flex flex-col justify-between ${
                    p.active ? 'border-slate-200/90' : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base leading-tight">{p.name}</h4>
                          {p.contactPerson && (
                            <p className="text-xs text-slate-500 mt-0.5">Contato: {p.contactPerson}</p>
                          )}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.active 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {p.active ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>

                    {/* Status da Conta VIP do Parceiro */}
                    <div className="bg-indigo-50/60 p-2.5 rounded-2xl border border-indigo-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Conta VIP do Parceiro:
                        </span>
                        {isPartnerVipActive ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            VIP Ativo Grátis
                          </span>
                        ) : p.partnerEmail ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                            Aguardando Cadastro
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Sem e-mail vinculado
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-slate-800 text-[11px] font-bold mt-1 truncate">
                        {p.partnerEmail || 'Clique em editar para adicionar o e-mail'}
                      </p>
                    </div>

                    {/* Código e Link de Divulgação */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-indigo-600" />
                          Código de Divulgação:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyCode(p.code)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                            title="Copiar código"
                          >
                            {copiedCode === p.code ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar Código</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-black text-slate-900 bg-white px-3 py-1 rounded-xl border border-slate-300 tracking-wider">
                          {p.code}
                        </span>

                        <button
                          onClick={() => handleCopyLink(p.code)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-all"
                          title="Copiar link direto de cadastro com o código do parceiro"
                        >
                          {copiedLink === p.code ? (
                            <span className="text-emerald-600">Link Copiado!</span>
                          ) : (
                            <span>Copiar Link Divulgação</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Métricas de Indicações e Faturamento Gerado */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">Indicados</span>
                        <strong className="text-slate-900 text-sm font-black">{totalReferred}</strong>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
                        <span className="text-[10px] text-emerald-600 block font-semibold">Assinantes</span>
                        <strong className="text-emerald-700 text-sm font-black">{payingReferred}</strong>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-xl">
                        <span className="text-[10px] text-indigo-600 block font-semibold">Receita/mês</span>
                        <strong className="text-indigo-700 text-xs font-black">{formatCurrency(monthlyGenerated)}</strong>
                      </div>
                    </div>

                    {/* Botão de Ver Lista de Empresas Indicadas */}
                    <button
                      onClick={() => setSelectedPartnerForReferrals(p)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver Empresas Indicadas ({totalReferred})</span>
                    </button>
                  </div>

                  {/* Ações do Card */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleTogglePartnerActive(p.id, p.active)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                        p.active 
                          ? 'border-slate-200 text-slate-600 hover:bg-slate-100' 
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {p.active ? 'Pausar Código' : 'Reativar Código'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditPartner(p)}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Editar parceria e e-mail do parceiro"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeletePartner(p.id, p.name)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Excluir parceiro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal para Vincular Usuário a uma Parceria */}
      {userToPartner && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Handshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Configurar Vínculo de Parceria</h3>
                <p className="text-xs text-slate-500">Defina se o usuário é o próprio parceiro ou uma empresa indicada</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-semibold block">Usuário Selecionado:</span>
              <strong className="text-sm text-slate-900 block">{userToPartner.name}</strong>
              <span className="text-xs text-slate-600 font-mono block">{userToPartner.email}</span>
            </div>

            {/* Seleção do Tipo de Vínculo: Parceiro VIP vs Empresa Indicada */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Como este usuário se relaciona com a parceria?
              </label>

              <div className="grid grid-cols-1 gap-2">
                <label 
                  onClick={() => setAssignMode('partner_vip')}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    assignMode === 'partner_vip'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="assignMode"
                    checked={assignMode === 'partner_vip'}
                    onChange={() => setAssignMode('partner_vip')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-indigo-950 block">
                      É o(a) Próprio(a) Parceiro(a) (Designer / Arquiteto)
                    </strong>
                    <span className="text-[11px] text-indigo-700 block mt-0.5">
                      Libera <strong>acesso 100% gratuito e vitalício</strong> para ele utilizar o sistema livremente.
                    </span>
                  </div>
                </label>

                <label 
                  onClick={() => setAssignMode('referred_client')}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    assignMode === 'referred_client'
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="assignMode"
                    checked={assignMode === 'referred_client'}
                    onChange={() => setAssignMode('referred_client')}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      É uma Empresa ou Prestador Indicado(a)
                    </strong>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Registra a indicação para relatórios. A empresa <strong>continua pagando a assinatura normalmente</strong> (com 7 dias grátis de teste).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Escolha o Parceiro Estratégico:
              </label>
              <select
                value={selectedPartnerId}
                onChange={e => setSelectedPartnerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Código: {p.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToPartner(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmAssignPartner}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Confirmar Vínculo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Criar/Editar Empresa Parceira */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 my-auto space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    {editingPartner ? 'Editar Parceiro Estratégico' : 'Cadastrar Novo Parceiro'}
                  </h3>
                  <p className="text-xs text-slate-500">Crie o convênio e libere o acesso VIP exclusivo para o profissional</p>
                </div>
              </div>
              <button
                onClick={() => setIsPartnerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Parceiro / Escritório *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Designer Lucas Mendes ou Estúdio Arquitetura & Decor"
                    value={partnerForm.name}
                    onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>E-mail da Conta VIP do Parceiro (Acesso Grátis)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Ex: lucas@designermendes.com.br"
                    value={partnerForm.partnerEmail}
                    onChange={e => setPartnerForm({ ...partnerForm, partnerEmail: e.target.value })}
                    className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <span className="text-[11px] text-indigo-600 mt-1 block">
                    O profissional que usar este e-mail terá acesso <strong>100% gratuito vitalício</strong>. As empresas indicadas por ele pagarão normalmente.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de Indicação *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: DESIGNER-LUCAS"
                    value={partnerForm.code}
                    onChange={e => setPartnerForm({ ...partnerForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">O parceiro divulgará este código/link</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Acesso da Conta VIP do Parceiro
                  </label>
                  <select
                    value={partnerForm.accessType}
                    onChange={e => setPartnerForm({ ...partnerForm, accessType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="vitalicio">Vitalício Gratuito</option>
                    <option value="dias">Por Prazo Determinado</option>
                  </select>
                </div>

                {partnerForm.accessType === 'dias' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quantidade de Dias de Acesso Gratuito
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={partnerForm.accessDays}
                      onChange={e => setPartnerForm({ ...partnerForm, accessDays: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Responsável / Contato
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lucas Mendes"
                    value={partnerForm.contactPerson}
                    onChange={e => setPartnerForm({ ...partnerForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp do Parceiro
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={partnerForm.phone}
                    onChange={e => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Acordo da Parceria / Anotações
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: O designer ganha acesso gratuito vitalício para orçar seus projetos e indica o sistema para as marcenarias e clientes dele."
                    value={partnerForm.notes}
                    onChange={e => setPartnerForm({ ...partnerForm, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {editingPartner ? 'Salvar Alterações' : 'Cadastrar Parceria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Visualizar Empresas Indicadas pelo Parceiro */}
      {selectedPartnerForReferrals && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 my-auto space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Empresas Indicadas por {selectedPartnerForReferrals.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Código de Indicação: <span className="font-mono font-bold text-indigo-600">{selectedPartnerForReferrals.code}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPartnerForReferrals(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Resumo de Conversão do Parceiro */}
            {(() => {
              const referredList = users.filter(u => 
                (u.partnerCode === selectedPartnerForReferrals.code || u.partnerCompany === selectedPartnerForReferrals.name) && 
                (!u.isPartnerAccount && u.email.toLowerCase() !== (selectedPartnerForReferrals.partnerEmail || '').toLowerCase())
              );
              const payingCount = referredList.filter(u => u.subscriptionStatus === 'active').length;
              const revenue = payingCount * saasService.getMonthlyPrice();

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-500 block font-semibold">Total de Cadastros</span>
                      <strong className="text-xl font-black text-slate-900">{referredList.length}</strong>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
                      <span className="text-[11px] text-emerald-700 block font-semibold">Assinantes Pagantes</span>
                      <strong className="text-xl font-black text-emerald-700">{payingCount}</strong>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-200 text-center">
                      <span className="text-[11px] text-indigo-700 block font-semibold">Receita Gerada/mês</span>
                      <strong className="text-lg font-black text-indigo-700">{formatCurrency(revenue)}</strong>
                    </div>
                  </div>

                  {referredList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-600">Nenhuma empresa cadastrada com este código ainda.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Envie o link de indicação para o parceiro divulgar para a rede dele!
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden border border-slate-200 rounded-2xl max-h-72 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                          <tr>
                            <th className="p-3">Empresa / Usuário</th>
                            <th className="p-3">Cadastro</th>
                            <th className="p-3">Status de Pagamento</th>
                            <th className="p-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {referredList.map((refUser) => (
                            <tr key={refUser.email} className="hover:bg-slate-50/80">
                              <td className="p-3">
                                <strong className="text-slate-900 block">{refUser.name}</strong>
                                <span className="text-slate-500 font-mono text-[11px]">{refUser.email}</span>
                              </td>
                              <td className="p-3 text-slate-600">
                                {new Date(refUser.createdAt).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="p-3">
                                {refUser.subscriptionStatus === 'active' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" /> Assinante Ativo (R$ 59,90/mês)
                                  </span>
                                ) : refUser.subscriptionStatus === 'trial' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                    <Clock className="w-3 h-3" /> Teste Grátis (7d)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                    <AlertCircle className="w-3 h-3" /> Vencido / Aguarda PIX
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleActivate(refUser.email, 30)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all"
                                  title="Aprovar pagamento PIX"
                                >
                                  +30d PIX
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedPartnerForReferrals(null)}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal para Alterar Plano do Cliente (Básico, Pro ou Premium) */}
      {userToChangePlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 my-auto space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Alterar Plano do Cliente
                  </h3>
                  <p className="text-xs text-slate-500">
                    Altere o plano de qualquer cliente (antigo ou recente) pelo seu painel.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserToChangePlan(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Informações do Usuário */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Cliente selecionado</span>
                <span className="text-sm font-bold text-slate-900 block">{userToChangePlan.name || 'Sem nome'}</span>
                <span className="text-xs font-mono text-slate-600">{userToChangePlan.email}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-semibold">Plano Atual</span>
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  {userToChangePlan.plan || 'pro'}
                </span>
              </div>
            </div>

            {/* Seleção de Novo Plano */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Escolha o Novo Plano:
              </span>

              {/* Básico */}
              <label
                onClick={() => setSelectedPlanToSet('basic')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlanToSet === 'basic'
                    ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="planChoice"
                  checked={selectedPlanToSet === 'basic'}
                  onChange={() => setSelectedPlanToSet('basic')}
                  className="mt-1 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-slate-600" />
                      <span className="font-black text-slate-900 text-sm">Plano Básico</span>
                    </div>
                    <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                      R$ 29,90 / mês
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Até 15 orçamentos por mês. Ideal para iniciantes.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-medium">
                    <span>&bull; Limite de 15 orçamentos/mês</span>
                    <span className="text-slate-400">&bull; Sem IA</span>
                    <span className="text-slate-400">&bull; Sem Contratos</span>
                  </div>
                </div>
              </label>

              {/* Pro */}
              <label
                onClick={() => setSelectedPlanToSet('pro')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlanToSet === 'pro'
                    ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="planChoice"
                  checked={selectedPlanToSet === 'pro'}
                  onChange={() => setSelectedPlanToSet('pro')}
                  className="mt-1 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span className="font-black text-slate-900 text-sm">Plano Pro</span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">Mais Popular</span>
                    </div>
                    <span className="text-xs font-black text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-lg">
                      R$ 59,90 / mês
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Orçamentos ilimitados + Consultor de Preços Inteligente com IA.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1 font-medium">
                    <span className="text-emerald-700 font-bold">&bull; Orçamentos Ilimitados</span>
                    <span className="text-blue-700 font-bold">&bull; Consultor IA</span>
                    <span className="text-slate-400">&bull; Sem Contratos</span>
                  </div>
                </div>
              </label>

              {/* Premium */}
              <label
                onClick={() => setSelectedPlanToSet('premium')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlanToSet === 'premium'
                    ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="planChoice"
                  checked={selectedPlanToSet === 'premium'}
                  onChange={() => setSelectedPlanToSet('premium')}
                  className="mt-1 text-amber-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-600" />
                      <span className="font-black text-slate-900 text-sm">Plano Premium</span>
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full">Completo</span>
                    </div>
                    <span className="text-xs font-black text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-lg">
                      R$ 199,90 / mês
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Tudo liberado: Orçamentos + Consultor IA + Gestor de Contratos Jurídicos e Assinatura Digital.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] mt-1 font-bold text-amber-900">
                    <span className="text-emerald-700">&bull; Ilimitado</span>
                    <span className="text-blue-700">&bull; Consultor IA</span>
                    <span className="text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">&bull; Contratos & Assinatura Digital</span>
                  </div>
                </div>
              </label>
            </div>

            {/* Opção adicional: Ativar período pago */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoActivateDays}
                  onChange={e => setAlsoActivateDays(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800">
                  Renovar / adicionar dias de acesso para este plano agora
                </span>
              </label>

              {alsoActivateDays && (
                <div className="flex items-center gap-2 pl-6 pt-1">
                  <span className="text-xs text-slate-600 font-semibold">Adicionar:</span>
                  <select
                    value={activateDaysCount}
                    onChange={e => setActivateDaysCount(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>+30 dias (1 mês)</option>
                    <option value={60}>+60 dias (2 meses)</option>
                    <option value={90}>+90 dias (3 meses)</option>
                    <option value={180}>+180 dias (6 meses)</option>
                    <option value={365}>+365 dias (1 ano)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setUserToChangePlan(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmChangePlan}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              >
                Salvar Alteração de Plano
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(userToBlock)}
        title="Suspender / Bloquear Acesso?"
        message={`Tem certeza que deseja bloquear imediatamente o acesso do usuário ${userToBlock || ''}? Ele verá a tela de bloqueio e não poderá acessar o sistema até que seja reativado.`}
        confirmLabel="Sim, Bloquear"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmBlockUser}
        onClose={() => setUserToBlock(null)}
      />

    </div>
  );
};

