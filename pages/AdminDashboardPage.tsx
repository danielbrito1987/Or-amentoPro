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
  HelpCircle
} from 'lucide-react';
import { saasService, SaaSUserRecord } from '../services/saasService';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';

export const AdminDashboardPage: React.FC = () => {
  const { user, refreshUserStatus } = useAuth();
  const [users, setUsers] = useState<SaaSUserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<SaaSUserRecord | null>(null);
  const [daysToAdd, setDaysToAdd] = useState<number>(30);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [userToBlock, setUserToBlock] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  
  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    try {
      const res = await saasService.syncWithSupabase();
      loadUsers();
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

  const loadUsers = () => {
    const list = saasService.getAllUsers();
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
    handleSyncSupabase();
  }, []);

  const handleActivate = (email: string, days: number = 30) => {
    saasService.activateSubscriptionForUser(email, days, `Liberado pelo Administrador em ${new Date().toLocaleDateString('pt-BR')}`);
    loadUsers();
    refreshUserStatus();
    setFeedback(`Assinatura de ${email} ativada por mais ${days} dias com sucesso!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleResetTrial = (email: string, days: number = 7) => {
    saasService.resetTrialForUser(email, days);
    loadUsers();
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
    loadUsers();
    refreshUserStatus();
    setFeedback(`Acesso de ${userToBlock} suspenso.`);
    setUserToBlock(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Métricas do SaaS
  const totalUsers = users.length;
  const activePaidUsers = users.filter(u => u.subscriptionStatus === 'active' && u.role !== 'admin').length;
  const trialUsers = users.filter(u => u.subscriptionStatus === 'trial').length;
  const expiredUsers = users.filter(u => u.subscriptionStatus === 'expired').length;
  const monthlyRevenue = activePaidUsers * saasService.getMonthlyPrice();

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
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
              Gerencie quem tem acesso ao sistema, aprove pagamentos via PIX e libere assinaturas mensais de <strong className="text-white">R$ 59,90/mês</strong>.
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Total Cadastros</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalUsers}</span>
          <p className="text-[11px] text-slate-400 mt-1">Clientes cadastrados</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-bold uppercase mb-2">
            <span>Assinantes Pagantes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600">{activePaidUsers}</span>
          <p className="text-[11px] text-slate-400 mt-1">Plano Pro (R$ 59,90/mês)</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 text-xs font-bold uppercase mb-2">
            <span>Em Teste Grátis (Trial)</span>
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
          Quando o cliente te mandar o comprovante, localize o e-mail abaixo e clique em <strong>"Liberar +30 Dias"</strong>.
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
                <span>{isSyncing ? "Sincronizando..." : "Sincronizar Supabase"}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">Total de {filteredUsers.length} usuários encontrados</p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por e-mail ou nome..."
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
                <th className="py-3.5 px-4">Status Atual</th>
                <th className="py-3.5 px-4">Validade do Acesso</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isMasterAdmin = u.email.toLowerCase() === saasService.getAdminEmail().toLowerCase();
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
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{u.name}</span>
                          <span className="text-slate-500 text-xs block font-mono truncate">{u.email}</span>
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
