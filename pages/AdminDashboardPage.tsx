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
  Check
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

  // Modal para associar usuário a uma parceria
  const [userToPartner, setUserToPartner] = useState<SaaSUserRecord | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

  // Modal / formulário para adicionar/editar empresa parceira
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerCompany | null>(null);
  const [partnerForm, setPartnerForm] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    notes: '',
    accessType: 'vitalicio' as 'vitalicio' | 'dias',
    accessDays: 365
  });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
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

  const handleActivate = async (email: string, days: number = 30, plan: SubscriptionPlanId = 'pro') => {
    await saasService.activateSubscriptionForUser(email, days, plan, `Liberado pelo Administrador em ${new Date().toLocaleDateString('pt-BR')}`);
    loadData();
    refreshUserStatus();
    setFeedback(`Assinatura (${plan.toUpperCase()}) de ${email} ativada por mais ${days} dias com sucesso!`);
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
  const handleAssignPartner = (u: SaaSUserRecord) => {
    setUserToPartner(u);
    if (partners.length > 0) {
      setSelectedPartnerId(partners[0].id);
    }
  };

  const confirmAssignPartner = async () => {
    if (!userToPartner) return;
    const partner = partners.find(p => p.id === selectedPartnerId);
    if (!partner) {
      setFeedback("Selecione uma empresa parceira válida.");
      return;
    }

    const days = partner.accessType === 'dias' ? partner.accessDays : undefined;
    await saasService.setPartnerAccessForUser(userToPartner.email, partner.name, partner.code, days);
    partnerService.incrementUsage(partner.code);

    loadData();
    refreshUserStatus();
    setFeedback(`Acesso liberado para ${userToPartner.email} como parceiro de "${partner.name}"!`);
    setUserToPartner(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Salvar nova empresa parceira ou edição
  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPartner) {
        partnerService.updatePartner(editingPartner.id, {
          code: partnerForm.code,
          name: partnerForm.name,
          contactPerson: partnerForm.contactPerson,
          phone: partnerForm.phone,
          notes: partnerForm.notes,
          accessType: partnerForm.accessType,
          accessDays: Number(partnerForm.accessDays) || 365
        });
        setFeedback(`Parceria "${partnerForm.name}" atualizada com sucesso!`);
      } else {
        partnerService.addPartner({
          code: partnerForm.code,
          name: partnerForm.name,
          contactPerson: partnerForm.contactPerson,
          phone: partnerForm.phone,
          notes: partnerForm.notes,
          active: true,
          accessType: partnerForm.accessType,
          accessDays: Number(partnerForm.accessDays) || 365
        });
        setFeedback(`Nova parceria "${partnerForm.name}" cadastrada! Código: ${partnerForm.code.toUpperCase()}`);
      }
      setIsPartnerModalOpen(false);
      setEditingPartner(null);
      setPartnerForm({
        code: '',
        name: '',
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

  // Métricas do SaaS
  const totalUsers = users.length;
  const activePaidUsers = users.filter(u => u.subscriptionStatus === 'active' && u.role !== 'admin').length;
  const partnerUsers = users.filter(u => u.subscriptionStatus === 'partner').length;
  const trialUsers = users.filter(u => u.subscriptionStatus === 'trial').length;
  const expiredUsers = users.filter(u => u.subscriptionStatus === 'expired').length;
  const monthlyRevenue = activePaidUsers * saasService.getMonthlyPrice();

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.partnerCompany && u.partnerCompany.toLowerCase().includes(search.toLowerCase()))
  );

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
              Gerencie quem tem acesso ao sistema, libere acessos para empresas parceiras e aprove pagamentos PIX.
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

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Total Cadastros</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalUsers}</span>
          <p className="text-[11px] text-slate-400 mt-1">Clientes na base</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-bold uppercase mb-2">
            <span>Assinantes Pagantes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600">{activePaidUsers}</span>
          <p className="text-[11px] text-slate-400 mt-1">Plano Pro (R$ 59,90/mês)</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-200/90 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-bold uppercase mb-2">
            <span>Empresas Parceiras</span>
            <Handshake className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-indigo-700">{partnerUsers}</span>
          <p className="text-[11px] text-indigo-500 mt-1">{partners.length} convênio(s) cadastrado(s)</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 text-xs font-bold uppercase mb-2">
            <span>Em Teste (Trial)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-600">{trialUsers}</span>
          <p className="text-[11px] text-slate-400 mt-1">Dentro dos 7 dias</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 text-xs font-bold uppercase mb-2">
            <span>Vencidos / Expirados</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-rose-600">{expiredUsers}</span>
          <p className="text-[11px] text-slate-400 mt-1">Bloqueados no paywall</p>
        </div>
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
                <p className="text-xs text-slate-500">Total de {filteredUsers.length} usuários encontrados</p>
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
                    <th className="py-3.5 px-4">Status / Plano</th>
                    <th className="py-3.5 px-4">Validade do Acesso</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isMasterAdmin = u.email.toLowerCase() === saasService.getAdminEmail().toLowerCase();
                    const isPartner = u.subscriptionStatus === 'partner';
                    const isTrial = u.subscriptionStatus === 'trial';
                    const isActive = u.subscriptionStatus === 'active';
                    const isExpired = u.subscriptionStatus === 'expired';

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
                                : isPartner
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">{u.name}</span>
                              <span className="text-slate-500 text-xs block font-mono truncate">{u.email}</span>
                              {u.partnerCompany && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 font-semibold mt-0.5">
                                  <Building2 className="w-3 h-3" />
                                  <span>{u.partnerCompany}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isMasterAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <Shield className="w-3 h-3" /> Dono (Admin)
                            </span>
                          ) : isPartner ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <Handshake className="w-3 h-3" /> Parceria Liberada
                            </span>
                          ) : isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Assinante Pro
                            </span>
                          ) : isTrial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" /> Teste Grátis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertCircle className="w-3 h-3" /> Vencido / Bloqueado
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isMasterAdmin ? (
                            <span className="text-slate-500 font-semibold text-xs">Vitalício</span>
                          ) : isPartner && (!u.subscriptionValidUntil || new Date(u.subscriptionValidUntil).getFullYear() > 2090) ? (
                            <span className="text-indigo-600 font-bold text-xs flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              Vitalício (Parceiro)
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
                              {/* Botão de Liberar Parceria */}
                              <button
                                onClick={() => handleAssignPartner(u)}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                                title="Vincular a uma empresa parceira e liberar acesso sem cobrar comissão"
                              >
                                <Handshake className="w-3.5 h-3.5" />
                                <span>{isPartner ? 'Alterar Parceria' : 'Vincular Parceria'}</span>
                              </button>

                              <button
                                onClick={() => handleActivate(u.email, 30)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                                title="Aprovar pagamento PIX e conceder 30 dias de acesso"
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

      {/* ABA 2: GESTÃO DE EMPRESAS PARCEIRAS */}
      {activeSubTab === 'partners' && (
        <div className="space-y-6">
          {/* Card explicativo do Modelo de Parceria */}
          <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-3xl p-6 text-white border border-indigo-800 shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-indigo-200 text-xs font-semibold">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span>Substituição Estratégica de Comissões por Acesso Liberado</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black">Como funciona sua estratégia de parcerias:</h3>
                <p className="text-sm text-indigo-100">
                  Em vez de pagar comissões financeiras para lojas de materiais, construtoras, marcenarias e prestadores parceiros, 
                  você cria um código de acesso exclusivo para a empresa parceira. Os prestadores indicados pela empresa parceira ganham 
                  acesso gratuito ao sistema, e em troca a empresa indica o seu aplicativo para todos os clientes e prestadores da região.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingPartner(null);
                  setPartnerForm({
                    code: '',
                    name: '',
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
                <span>Cadastrar Nova Empresa Parceira</span>
              </button>
            </div>
          </div>

          {/* Grid de Empresas Parceiras */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map((p) => {
              const usersWithThisCode = users.filter(u => u.partnerCode === p.code || u.partnerCompany === p.name).length;

              return (
                <div 
                  key={p.id}
                  className={`bg-white rounded-3xl border p-5 shadow-sm space-y-4 transition-all relative overflow-hidden ${
                    p.active ? 'border-slate-200/90' : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
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
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Cupom / Código de Ativação */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-indigo-600" />
                        Código do Convênio:
                      </span>
                      <button
                        onClick={() => handleCopyCode(p.code)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                        title="Copiar código para enviar no WhatsApp"
                      >
                        {copiedCode === p.code ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-black text-slate-900 bg-white px-3 py-1 rounded-xl border border-slate-300 tracking-wider">
                        {p.code}
                      </span>

                      <span className="text-xs font-semibold text-slate-600">
                        {p.accessType === 'vitalicio' ? 'Acesso Vitalício' : `${p.accessDays || 365} dias`}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes de Contato e Estatística */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    {p.phone && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-semibold">WhatsApp/Tel:</span>
                        <strong className="text-slate-800">{p.phone}</strong>
                      </p>
                    )}
                    {p.notes && (
                      <p className="text-slate-500 italic bg-slate-50 p-2 rounded-xl text-[11px]">
                        "{p.notes}"
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">Usuários ativados:</span>
                      <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                        {usersWithThisCode} usuários
                      </span>
                    </div>
                  </div>

                  {/* Ações do Card */}
                  <div className="pt-2 flex items-center justify-between gap-2">
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
                        title="Editar parceria"
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

      {/* Modal para Vincular Usuário Existente a uma Parceria */}
      {userToPartner && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Handshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Liberar Parceria para Cliente</h3>
                <p className="text-xs text-slate-500">Concede acesso livre ao sistema para este cliente</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-semibold block">Cliente Selecionado:</span>
              <strong className="text-sm text-slate-900 block">{userToPartner.name}</strong>
              <span className="text-xs text-slate-600 font-mono block">{userToPartner.email}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Escolha a Empresa Parceira do Convênio:
              </label>
              <select
                value={selectedPartnerId}
                onChange={e => setSelectedPartnerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Código: {p.code}) - {p.accessType === 'vitalicio' ? 'Vitalício' : `${p.accessDays} dias`}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>O que acontece ao confirmar:</span>
              </p>
              <p className="text-indigo-700">
                O cliente terá acesso 100% liberado sem bloqueios no paywall e com o distintivo VIP de <strong>PARCEIRO</strong> em sua barra lateral.
              </p>
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
                Confirmar Liberação
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
                    {editingPartner ? 'Editar Empresa Parceira' : 'Cadastrar Empresa Parceira'}
                  </h3>
                  <p className="text-xs text-slate-500">Crie o convênio e gere o código de acesso liberado</p>
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
                    Nome da Empresa Parceira *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Comercial Elétrica Silva & Santos"
                    value={partnerForm.name}
                    onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de Ativação / Cupom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: SILVA-VIP"
                    value={partnerForm.code}
                    onChange={e => setPartnerForm({ ...partnerForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Os clientes digitarão no cadastro</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Acesso Concedido
                  </label>
                  <select
                    value={partnerForm.accessType}
                    onChange={e => setPartnerForm({ ...partnerForm, accessType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="vitalicio">Vitalício (Sem Expiração)</option>
                    <option value="dias">Por Prazo (dias)</option>
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
                    Nome do Contato / Gerente
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Roberto"
                    value={partnerForm.contactPerson}
                    onChange={e => setPartnerForm({ ...partnerForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp da Empresa Parceira
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
                    placeholder="Ex: Em troca do acesso livre, o parceiro divulga o OrçaFácil Pro em seu balcão e no grupo de clientes do WhatsApp."
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

