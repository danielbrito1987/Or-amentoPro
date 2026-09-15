import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Share2, 
  Mail, 
  CheckCircle2, 
  Clock, 
  PenTool, 
  Trash2, 
  ArrowRight, 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles,
  AlertCircle,
  FileCheck,
  Building,
  UserCheck,
  Send,
  RefreshCw
} from 'lucide-react';
import { Contract, Quote, ProviderInfo } from '../types';
import { contractService } from '../services/contractService';
import { generateContractPdf } from '../services/contractPdfService';
import { saasService } from '../services/saasService';
import { useAuth } from '../contexts/AuthContext';
import { DigitalSignatureModal } from '../components/DigitalSignatureModal';
import { Button } from '../components/Button';
import { formatCurrency } from '../utils/formatters';
import { storageService } from '../services/storageService';

interface ContractsPageProps {
  onUpgradeToPremium: () => void;
  quotes?: Quote[];
  onSelectQuote?: (quote: Quote) => void;
}

export const ContractsPage: React.FC<ContractsPageProps> = ({ 
  onUpgradeToPremium,
  quotes = [],
  onSelectQuote
}) => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'signed'>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Modal de Assinatura Eletrônica
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signTarget, setSignTarget] = useState<'provider' | 'client'>('provider');

  // Modal para Criar Contrato a partir de Orçamento
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQuoteForContract, setSelectedQuoteForContract] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const permission = saasService.canUseContracts(user);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const list = await contractService.getAllContracts(user?.companyId);
      setContracts(list);
      if (list.length > 0) {
        // Mantém seleção anterior se existir
        setSelectedContract(prev => {
          if (!prev) return list[0];
          const found = list.find(c => c.id === prev.id);
          return found || list[0];
        });
      } else {
        setSelectedContract(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [user?.companyId]);

  // Checa se há parâmetro ?contractId na URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get('contractId');
      if (targetId && contracts.length > 0) {
        const found = contracts.find(c => c.id === targetId);
        if (found) setSelectedContract(found);
      }
    }
  }, [contracts]);

  // Métricas do Dashboard de Contratos
  const stats = useMemo(() => {
    const total = contracts.length;
    const completed = contracts.filter(c => c.status === 'signed').length;
    const pending = contracts.filter(c => c.status !== 'signed').length;
    const totalValue = contracts.reduce((acc, c) => acc + (c.totalValue || 0), 0);
    return { total, completed, pending, totalValue };
  }, [contracts]);

  // Lista filtrada
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        c.contractNumber.toLowerCase().includes(term) ||
        c.clientName.toLowerCase().includes(term) ||
        c.quoteNumber.toLowerCase().includes(term) ||
        c.providerName.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (statusFilter === 'pending') return c.status !== 'signed';
      if (statusFilter === 'signed') return c.status === 'signed';
      return true;
    });
  }, [contracts, searchTerm, statusFilter]);

  // Orçamentos aprovados ou disponíveis para virar contrato
  const eligibleQuotes = useMemo(() => {
    const existingQuoteIds = new Set(contracts.map(c => c.quoteId));
    return quotes.filter(q => !existingQuoteIds.has(q.id));
  }, [quotes, contracts]);

  const handleCreateContractFromQuote = async () => {
    if (!selectedQuoteForContract) return;
    const quote = quotes.find(q => q.id === selectedQuoteForContract);
    if (!quote) return;

    setIsCreating(true);
    try {
      const provider = await storageService.getProviderInfo(user?.companyId || 'default');
      const newContract = await contractService.createContractFromQuote(
        quote,
        provider,
        user?.email,
        user?.companyId
      );

      // Atualiza status do orçamento para aprovado e vincula o contrato
      await storageService.saveQuote({
        ...quote,
        status: 'approved',
        contractId: newContract.id
      });

      await loadContracts();
      setSelectedContract(newContract);
      setIsCreateModalOpen(false);
      setSelectedQuoteForContract('');
    } catch (err: any) {
      alert('Erro ao gerar contrato: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmSignature = async (data: {
    signatureDataUrl: string;
    name: string;
    doc: string;
    email?: string;
    phone?: string;
  }) => {
    if (!selectedContract) return;
    const updated = await contractService.signContract(
      selectedContract.id,
      signTarget,
      {
        name: data.name,
        document: data.doc,
        email: data.email,
        phone: data.phone,
        signatureDataUrl: data.signatureDataUrl,
        ipAddress: '177.136.24.102',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      }
    );

    if (updated) {
      setSelectedContract(updated);
      setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
    }
  };

  const handleDeleteContract = async (contract: Contract) => {
    if (!window.confirm(`Tem certeza que deseja excluir o Contrato ${contract.contractNumber}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    await contractService.deleteContract(contract.id);
    await loadContracts();
  };

  const handleCopySigningLink = (contract: Contract) => {
    const url = contractService.getSigningUrl(contract.id);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyClauses = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  // Se o usuário não possui permissão (não é Premium / Enterprise / Admin)
  if (!permission.allowed) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-indigo-900/50 shadow-2xl">
          {/* Luz de fundo decorativa */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Novo Módulo Exclusivo • Plano Premium
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
              Formalize Seus Orçamentos com <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-indigo-300">Contratos & Assinatura Digital</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Assim que o cliente aprova o orçamento, transforme a proposta em um contrato oficial de prestação de serviços com validade jurídica plena (MP 2.200-2/2001 e Lei 14.063/2020), enviado por WhatsApp ou E-mail e assinado pelo celular por ambas as partes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3 bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Geração Automática</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Cláusulas de serviços, valores, prazos e garantia de 90 dias do CDC automáticos.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Assinatura Eletrônica na Tela</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Rubrica pelo dedo ou mouse, com carimbo de IP, data/hora e hash de integridade.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Envio por WhatsApp e E-mail</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Envie o link para o cliente assinar em segundos diretamente no WhatsApp dele.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Armazenado no Supabase</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Histórico completo seguro e sincronizado com PDF executivo exportável.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 border-t border-white/10">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-amber-400">R$ 199,90</span>
                <span className="text-xs text-slate-400">/mês no Plano Premium</span>
              </div>
              <Button
                onClick={onUpgradeToPremium}
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 text-sm sm:text-base px-8 py-3.5"
              >
                Fazer Upgrade para Plano Premium
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Topo do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileCheck className="w-7 h-7 text-indigo-600" />
              Contratos & Assinaturas Digitais
            </h1>
            <span className="bg-amber-100 text-amber-800 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-200">
              Premium
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gere contratos a partir de orçamentos aprovados, colha assinaturas eletrônicas com validade jurídica e envie por WhatsApp ou E-mail.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={loadContracts}
            disabled={loading}
            title="Sincronizar contratos do Supabase"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sincronizar
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
            icon={<Plus className="w-4 h-4" />}
          >
            Gerar Contrato de Orçamento
          </Button>
        </div>
      </div>

      {/* Barra de Estatísticas / Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total de Contratos</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <span className="text-[11px] text-slate-400">Armazenados no Supabase</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Totalmente Assinados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{stats.completed}</p>
          <span className="text-[11px] text-slate-400">Prestador e Cliente assinaram</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Pendentes de Assinatura</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
          <span className="text-[11px] text-slate-400">Aguardando rubrica</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Volume em Contratos</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalValue)}</p>
          <span className="text-[11px] text-slate-400">Valor global formalizado</span>
        </div>
      </div>

      {/* Controles de Busca e Filtro */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número, cliente ou orçamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Todos ({contracts.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'pending' ? 'bg-white text-amber-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Pendentes ({stats.pending})
          </button>
          <button
            onClick={() => setStatusFilter('signed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'signed' ? 'bg-white text-emerald-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Concluídos ({stats.completed})
          </button>
        </div>
      </div>

      {/* Layout Principal: Lista Lateral + Painel de Detalhes */}
      {contracts.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 sm:p-14 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <FileCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Nenhum contrato gerado ainda</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Assim que um cliente aprovar seu orçamento, gere o contrato oficial de prestação de serviços com apenas 1 clique.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md shadow-indigo-600/20"
            icon={<Plus className="w-4 h-4" />}
          >
            Criar Primeiro Contrato
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Lista de Contratos */}
          <div className="lg:col-span-5 space-y-3">
            {filteredContracts.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                Nenhum contrato encontrado para o filtro aplicado.
              </div>
            ) : (
              filteredContracts.map(contract => {
                const isSelected = selectedContract?.id === contract.id;
                const isFullySigned = contract.status === 'signed';
                const isPartiallySigned = contract.status === 'partially_signed';

                return (
                  <div
                    key={contract.id}
                    onClick={() => setSelectedContract(contract)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {contract.contractNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Orçamento Ref: <strong className="text-slate-700">{contract.quoteNumber}</strong>
                        </span>
                      </div>
                      <span className="font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        {formatCurrency(contract.totalValue)}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 truncate mb-2">
                      Cliente: {contract.clientName}
                    </p>

                    {/* Status das Assinaturas */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-2">
                        {isFullySigned ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Totalmente Assinado
                          </span>
                        ) : isPartiallySigned ? (
                          <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" /> Assinado Parcialmente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Aguardando Assinaturas
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Coluna Direita: Detalhes do Contrato Selecionado */}
          <div className="lg:col-span-7">
            {selectedContract ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                {/* Cabeçalho do Detalhe */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedContract.contractNumber}
                      </h2>
                      {selectedContract.status === 'signed' ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          Concluído
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          Pendente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vinculado ao Orçamento nº {selectedContract.quoteNumber} • Criado em{' '}
                      {new Date(selectedContract.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* Ações Rápidas de Compartilhamento e PDF */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateContractPdf(selectedContract)}
                      className="text-xs"
                      icon={<Download className="w-3.5 h-3.5 text-slate-600" />}
                    >
                      Baixar PDF
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => contractService.sendViaWhatsApp(selectedContract, 'client')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs shadow-emerald-600/20"
                      icon={<Share2 className="w-3.5 h-3.5" />}
                    >
                      WhatsApp
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => contractService.sendViaEmail(selectedContract, 'client')}
                      className="text-xs"
                      icon={<Mail className="w-3.5 h-3.5 text-slate-600" />}
                    >
                      E-mail
                    </Button>

                    <button
                      onClick={() => handleDeleteContract(selectedContract)}
                      title="Excluir contrato"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Banner de Link de Assinatura Online */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950">Link Público para Assinatura Eletrônica</h4>
                      <p className="text-[11px] text-indigo-700">
                        O cliente pode assinar pelo smartphone com validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020).
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopySigningLink(selectedContract)}
                    className="shrink-0 bg-white text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Link Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copiar Link
                      </>
                    )}
                  </Button>
                </div>

                {/* Painel das Assinaturas Eletrônicas */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Assinaturas das Partes Contratantes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Assinatura da Contratada (Prestador) */}
                    {(() => {
                      const sig = selectedContract.signatures.find(s => s.signerType === 'provider');
                      const isSigned = sig?.status === 'signed';

                      return (
                        <div className={`p-4 rounded-2xl border ${isSigned ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-indigo-600" />
                              Contratada (Prestador)
                            </span>
                            {isSigned ? (
                              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> Assinado
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                                Pendente
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-sm text-slate-900">{sig?.name || selectedContract.providerName}</p>
                            <p className="text-xs text-slate-500">{sig?.document ? `CPF/CNPJ: ${sig.document}` : 'Documento a registrar'}</p>
                          </div>

                          {isSigned ? (
                            <div className="pt-2 border-t border-emerald-200/60 space-y-1.5">
                              {sig?.signatureDataUrl && (
                                <div className="bg-white p-2 rounded-xl border border-emerald-100 flex items-center justify-center max-h-16 overflow-hidden">
                                  <img
                                    src={sig.signatureDataUrl}
                                    alt="Rubrica da Contratada"
                                    className="max-h-12 object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              <p className="text-[10px] text-slate-500">
                                Assinado em: {sig?.signedAt ? new Date(sig.signedAt).toLocaleString('pt-BR') : ''}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Hash: {sig?.hash || 'BR-EID-VAL'}
                              </p>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-8"
                              onClick={() => {
                                setSignTarget('provider');
                                setIsSignModalOpen(true);
                              }}
                            >
                              <PenTool className="w-3 h-3 mr-1.5" />
                              Assinar como Contratada
                            </Button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Assinatura da Contratante (Cliente) */}
                    {(() => {
                      const sig = selectedContract.signatures.find(s => s.signerType === 'client');
                      const isSigned = sig?.status === 'signed';

                      return (
                        <div className={`p-4 rounded-2xl border ${isSigned ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Contratante (Cliente)
                            </span>
                            {isSigned ? (
                              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> Assinado
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                                Pendente
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-sm text-slate-900">{sig?.name || selectedContract.clientName}</p>
                            <p className="text-xs text-slate-500">{sig?.document ? `CPF/CNPJ: ${sig.document}` : (selectedContract.clientPhone || 'Aguardando cliente')}</p>
                          </div>

                          {isSigned ? (
                            <div className="pt-2 border-t border-emerald-200/60 space-y-1.5">
                              {sig?.signatureDataUrl && (
                                <div className="bg-white p-2 rounded-xl border border-emerald-100 flex items-center justify-center max-h-16 overflow-hidden">
                                  <img
                                    src={sig.signatureDataUrl}
                                    alt="Rubrica da Contratante"
                                    className="max-h-12 object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              <p className="text-[10px] text-slate-500">
                                Assinado em: {sig?.signedAt ? new Date(sig.signedAt).toLocaleString('pt-BR') : ''}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Hash: {sig?.hash || 'BR-EID-VAL'}
                              </p>
                            </div>
                          ) : (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-8"
                                onClick={() => {
                                  setSignTarget('client');
                                  setIsSignModalOpen(true);
                                }}
                              >
                                <PenTool className="w-3 h-3 mr-1" />
                                Colher Agora
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8"
                                onClick={() => contractService.sendViaWhatsApp(selectedContract, 'client')}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Cobrar no Whats
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Minuta Contratual / Cláusulas Formatadas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Minuta Contratual Completa
                    </h3>
                    <button
                      onClick={() => handleCopyClauses(selectedContract.content)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Cláusulas Copiadas
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Cláusulas
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 max-h-96 overflow-y-auto text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed select-text">
                    {selectedContract.content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
                Selecione um contrato na lista ao lado para ver os detalhes.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Assinatura Digital */}
      {selectedContract && (
        <DigitalSignatureModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          title={`Contrato ${selectedContract.contractNumber} (${selectedContract.clientName})`}
          signerType={signTarget}
          defaultName={signTarget === 'provider' ? selectedContract.providerName : selectedContract.clientName}
          defaultDoc={signTarget === 'provider' ? selectedContract.providerDocument : selectedContract.clientDocument}
          defaultEmail={signTarget === 'provider' ? selectedContract.providerEmail : selectedContract.clientEmail}
          defaultPhone={signTarget === 'provider' ? selectedContract.providerPhone : selectedContract.clientPhone}
          onConfirmSignature={handleConfirmSignature}
        />
      )}

      {/* Modal para Gerar Contrato a partir de Orçamento */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Gerar Contrato de Prestação de Serviços
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Selecione o orçamento para o qual você deseja gerar a minuta contratual oficial:
            </p>

            {quotes.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-600 mb-4">
                Você ainda não possui orçamentos cadastrados. Crie um orçamento primeiro.
              </div>
            ) : (
              <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
                {quotes.map(quote => {
                  const alreadyHasContract = contracts.some(c => c.quoteId === quote.id);
                  const isSelected = selectedQuoteForContract === quote.id;

                  return (
                    <div
                      key={quote.id}
                      onClick={() => !alreadyHasContract && setSelectedQuoteForContract(quote.id)}
                      className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                        alreadyHasContract
                          ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 cursor-pointer shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {quote.number}
                          </span>
                          <span className="font-semibold text-sm text-slate-900">
                            {quote.customerName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {quote.items.length} itens cadastrados • Criado em {new Date(quote.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-slate-900 block">
                          {formatCurrency(quote.total)}
                        </span>
                        {alreadyHasContract && (
                          <span className="text-[10px] text-emerald-600 font-bold">
                            ✓ Contrato Existente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateContractFromQuote}
                disabled={!selectedQuoteForContract || isCreating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {isCreating ? 'Gerando Minuta...' : 'Gerar Contrato'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
