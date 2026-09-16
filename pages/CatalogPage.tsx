
import React, { useState } from 'react';
import { CatalogItem, ItemType } from '../types';
import { Button } from '../components/Button';
import { Briefcase, Box, Settings, Trash2, Sparkles, FileText, ChevronDown, Check, ShieldCheck } from 'lucide-react';
import { formatCurrency, maskCurrencyInput } from '../utils/formatters';
import { normalizeUnit } from '../services/marketEstimator';
import { AiPriceConsultantModal } from '../components/AiPriceConsultantModal';
import { CONTRACT_CLAUSE_PRESETS, generateDefaultItemClause } from '../services/contractClausesTemplates';
import { useAuth } from '../contexts/AuthContext';
import { saasService } from '../services/saasService';

interface CatalogPageProps {
  catalog: CatalogItem[];
  onSaveItem: (item: Partial<CatalogItem>, isEditing: boolean) => void;
  onDeleteItem: (id: string) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ catalog, onSaveItem, onDeleteItem }) => {
  const { user } = useAuth();
  const isPremium = saasService.isPremiumUser(user);
  const hasAiConsultant = saasService.canUseAiConsultant(user).allowed;

  const [newItem, setNewItem] = useState<Partial<CatalogItem>>({ type: ItemType.SERVICE, price: 0 });
  const [currencyInput, setCurrencyInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [selectedPreviewClause, setSelectedPreviewClause] = useState<CatalogItem | null>(null);

  const handleSave = () => {
    onSaveItem(newItem, !!editingId);
    setNewItem({ type: ItemType.SERVICE, price: 0 });
    setCurrencyInput('');
    setEditingId(null);
    setShowPresetsMenu(false);
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setNewItem(item);
    setCurrencyInput(maskCurrencyInput((item.price * 100).toString()));
  };

  const handleApplyAiSuggestion = (data: { name: string; price: number; unit: string; description?: string }) => {
    setNewItem(prev => ({
      ...prev,
      type: ItemType.SERVICE,
      name: prev.name?.trim() ? prev.name : data.name,
      price: data.price,
      unit: normalizeUnit(data.unit || prev.unit),
      description: prev.description?.trim() ? prev.description : (data.description || '')
    }));
    setCurrencyInput(maskCurrencyInput(Math.round(data.price * 100).toString()));
  };

  const handleAutoGenerateClause = () => {
    const generated = generateDefaultItemClause(
      newItem.name || 'Serviço técnico',
      newItem.type || ItemType.SERVICE,
      newItem.description
    );
    setNewItem(prev => ({ ...prev, contractClause: generated }));
  };

  const handleSelectPreset = (clauseText: string) => {
    setNewItem(prev => ({ ...prev, contractClause: clauseText }));
    setShowPresetsMenu(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AiPriceConsultantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialServiceName={newItem.name || ''}
        mode="catalog"
        onApply={handleApplyAiSuggestion}
      />

      {/* Modal de visualização rápida da cláusula do catálogo (Exclusivo Premium) */}
      {isPremium && selectedPreviewClause && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800">Cláusula Contratual</h3>
              </div>
              <button 
                onClick={() => setSelectedPreviewClause(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-medium"
              >
                ✕
              </button>
            </div>
            <div className="py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Item: {selectedPreviewClause.name} ({selectedPreviewClause.type === ItemType.SERVICE ? 'Serviço' : 'Produto'})
              </p>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed max-h-60 overflow-y-auto">
                {selectedPreviewClause.contractClause || 'Nenhuma cláusula personalizada cadastrada. Será utilizada a cláusula técnica padrão ao gerar o contrato.'}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Esta cláusula é incluída dinamicamente na Cláusula Segunda da minuta quando este item for selecionado.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelectedPreviewClause(null)}>Fechar</Button>
              <Button 
                onClick={() => {
                  const itm = selectedPreviewClause;
                  setSelectedPreviewClause(null);
                  startEdit(itm);
                }}
              >
                Editar Cláusula
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-800">Catálogo de Itens</h2>
        <p className="text-slate-500">
          {isPremium 
            ? 'Produtos, serviços e cláusulas contratuais específicas para minutas dinâmicas' 
            : 'Produtos e serviços cadastrados para seus orçamentos'}
        </p>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1 order-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editingId ? 'Editar Item' : 'Novo Item'}</h3>
              {hasAiConsultant && (
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-all border border-blue-200/60"
                  title="Pedir sugestão de preço à IA"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Preço com IA</span>
                </button>
              )}
            </div>
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
              <input 
                type="text" 
                value={newItem.name || ''} 
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do item"
              />
              <textarea 
                value={newItem.description || ''} 
                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Descrição técnica opcional"
              />

              {hasAiConsultant && newItem.type === ItemType.SERVICE && (
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 text-xs font-semibold border border-blue-200/70 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dúvida no valor? Consultar sugestão com IA</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  value={currencyInput} 
                  onChange={e => {
                    const masked = maskCurrencyInput(e.target.value);
                    setCurrencyInput(masked);
                    setNewItem({ ...newItem, price: parseFloat(e.target.value.replace(/\D/g, '')) / 100 });
                  }}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Preço R$"
                />
                <input 
                  type="text" 
                  value={newItem.unit || ''} 
                  onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unidade (un, m²)"
                />
              </div>

              {/* Seção de Cláusula Contratual Específica do Item (Exclusiva do Plano Premium) */}
              {isPremium && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Cláusula Contratual Específica</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowPresetsMenu(!showPresetsMenu)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200/50"
                      >
                        <span>Modelos Prontos</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {showPresetsMenu && (
                        <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 max-h-72 overflow-y-auto animate-in fade-in">
                          <div className="p-1 border-b border-slate-100 mb-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Escolha um modelo rápido</p>
                          </div>
                          {CONTRACT_CLAUSE_PRESETS
                            .filter(p => p.category === 'geral' || (newItem.type === ItemType.SERVICE ? p.category === 'servico' : p.category === 'produto'))
                            .map(preset => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleSelectPreset(preset.clauseText)}
                                className="w-full text-left p-2 rounded-lg hover:bg-indigo-50/80 transition-colors group mb-1"
                              >
                                <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700">{preset.title}</p>
                                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{preset.description}</p>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-2 leading-tight">
                    Inserida automaticamente na minuta de contrato para blindar este serviço/produto (garantia, pré-requisitos, exclusões).
                  </p>

                  <textarea
                    value={newItem.contractClause || ''}
                    onChange={e => setNewItem({ ...newItem, contractClause: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-normal leading-relaxed"
                    rows={3}
                    placeholder="Ex: A Contratada concede garantia de 1 ano sobre a mão de obra. O contratante fornecerá ponto 220V no local..."
                  />

                  <div className="flex items-center justify-between mt-1">
                    <button
                      type="button"
                      onClick={handleAutoGenerateClause}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Gerar cláusula padrão para este item</span>
                    </button>
                    {newItem.contractClause && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Configurada
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleSave}>{editingId ? 'Atualizar Item' : 'Salvar no Catálogo'}</Button>
                {editingId && (
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setEditingId(null); 
                      setNewItem({type: ItemType.SERVICE, price: 0}); 
                      setCurrencyInput('');
                      setShowPresetsMenu(false);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 order-2">
          {catalog.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 md:p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500">
                <Briefcase size={28} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Catálogo vazio</h3>
              <p className="text-slate-500 mt-1 max-w-sm text-sm">
                {isPremium 
                  ? 'Cadastre seus serviços ou produtos usando o formulário ao lado para agilizar a criação dos seus orçamentos e gerar contratos com cláusulas automáticas.'
                  : 'Cadastre seus serviços ou produtos usando o formulário ao lado para agilizar a criação dos seus orçamentos.'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hidden md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                        {isPremium ? 'Item e Cláusula' : 'Item'}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Preço</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {catalog.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg mt-0.5 ${item.type === ItemType.SERVICE ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {item.type === ItemType.SERVICE ? <Briefcase size={18} /> : <Box size={18} />}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-800">{item.name}</p>
                                {isPremium && (
                                  item.contractClause && item.contractClause.trim() ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPreviewClause(item)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold border border-indigo-200/60 transition-colors"
                                      title="Ver cláusula contratual vinculada"
                                    >
                                      <FileText className="w-3 h-3 text-indigo-500" />
                                      <span>Cláusula Ativa</span>
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                                      (Cláusula padrão)
                                    </span>
                                  )
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-500">{item.description}</p>
                              )}
                              {isPremium && item.contractClause && (
                                <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                                  "{item.contractClause}"
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800 whitespace-nowrap">
                          {formatCurrency(item.price)} <span className="text-xs text-gray-400 font-normal">/{item.unit || 'un'}</span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap space-x-1">
                          <button 
                            onClick={() => startEdit(item)} 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title={isPremium ? "Editar item e cláusula" : "Editar item"}
                          >
                            <Settings size={18} />
                          </button>
                          <button 
                            onClick={() => onDeleteItem(item.id)} 
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Excluir item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile version */}
              <div className="md:hidden space-y-3">
                {catalog.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${item.type === ItemType.SERVICE ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {item.type === ItemType.SERVICE ? <Briefcase size={18} /> : <Box size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <p className="text-xs text-gray-400">{formatCurrency(item.price)} / {item.unit || 'un'}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button onClick={() => startEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Settings size={18} /></button>
                        <button onClick={() => onDeleteItem(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                      </div>
                    </div>

                    {isPremium && (
                      item.contractClause ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewClause(item)}
                          className="w-full text-left p-2 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs text-indigo-800"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Cláusula Contratual Configurada</span>
                          </span>
                          <span className="text-[10px] text-indigo-600 font-semibold underline">Ver</span>
                        </button>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Cláusula contratual: Padrão técnica do sistema</p>
                      )
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
