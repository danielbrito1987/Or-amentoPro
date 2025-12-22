
import React, { useState } from 'react';
import { CatalogItem, ItemType } from '../types';
import { Button } from '../components/Button';
import { Briefcase, Box, Settings, Trash2 } from 'lucide-react';
import { formatCurrency, maskCurrencyInput } from '../utils/formatters';

interface CatalogPageProps {
  catalog: CatalogItem[];
  onSaveItem: (item: Partial<CatalogItem>, isEditing: boolean) => void;
  onDeleteItem: (id: string) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ catalog, onSaveItem, onDeleteItem }) => {
  const [newItem, setNewItem] = useState<Partial<CatalogItem>>({ type: ItemType.SERVICE, price: 0 });
  const [currencyInput, setCurrencyInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = () => {
    onSaveItem(newItem, !!editingId);
    setNewItem({ type: ItemType.SERVICE, price: 0 });
    setCurrencyInput('');
    setEditingId(null);
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setNewItem(item);
    setCurrencyInput(maskCurrencyInput((item.price * 100).toString()));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Catálogo de Itens</h2>
        <p className="text-slate-500">Produtos e serviços pré-cadastrados</p>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1 order-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-8">
            <h3 className="font-bold text-lg mb-4">{editingId ? 'Editar Item' : 'Novo Item'}</h3>
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
                placeholder="Descrição opcional"
              />
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
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleSave}>{editingId ? 'Atualizar' : 'Salvar'}</Button>
                {editingId && <Button variant="secondary" onClick={() => {setEditingId(null); setNewItem({type:ItemType.SERVICE, price: 0}); setCurrencyInput('');}}>Cancelar</Button>}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 order-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Item</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Preço</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {catalog.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${item.type === ItemType.SERVICE ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {item.type === ItemType.SERVICE ? <Briefcase size={18} /> : <Box size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">{formatCurrency(item.price)} <span className="text-xs text-gray-400 font-normal">/{item.unit}</span></td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-blue-600"><Settings size={18} /></button>
                      <button onClick={() => onDeleteItem(item.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile version */}
          <div className="md:hidden space-y-3">
            {catalog.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${item.type === ItemType.SERVICE ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    {item.type === ItemType.SERVICE ? <Briefcase size={18} /> : <Box size={18} />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.price)} / {item.unit}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => startEdit(item)} className="p-2 text-blue-500"><Settings size={18} /></button>
                  <button onClick={() => onDeleteItem(item.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
