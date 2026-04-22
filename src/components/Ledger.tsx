import React, { useState } from 'react';
import { Eye, Edit, Trash2, Search, Calendar } from 'lucide-react'; // Adicionado Calendar
import { LedgerEntry } from '../types';
import { BUDGET_DATA } from '../constants';
import { formatDateForSort } from '../lib/utils';

interface LedgerProps {
  entries: LedgerEntry[];
  onEdit: (entry: LedgerEntry) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: LedgerEntry['approvalStatus']) => void;
  canDelete: boolean;
  isAdmin: boolean; 
}

export function Ledger({ entries, onEdit, onDelete, onStatusChange, canDelete, isAdmin }: LedgerProps) {
  const [search, setSearch] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortMode, setSortMode] = useState('desc');
  const categories = [...new Set(BUDGET_DATA.map(i => i.type))];
}
  const filtered = entries.filter(e => {
    const searchBlob = [e.itemCode, e.nf, e.supplier, e.description, e.date, e.category].join(' ').toLowerCase();
    const matchSearch = !search || searchBlob.includes(search.toLowerCase());
    const matchItem = !filterItem || e.itemCode === filterItem;
    const matchCategory = !filterCategory || e.category === filterCategory;
    return matchSearch && matchItem && matchCategory;
  }).sort((a, b) => {
    // Ordenação por data de despesa ou valor
    if (sortMode === 'asc') return formatDateForSort(a.date) - formatDateForSort(b.date);
    if (sortMode === 'amount_desc') return b.amount - a.amount;
    if (sortMode === 'amount_asc') return a.amount - b.amount;
    return formatDateForSort(b.date) - formatDateForSort(a.date);
  });

  const openDocument = (data: string) => {
    try {
      if (data.startsWith('data:application/pdf;base64,')) {
        const base64Content = data.split(',')[1];
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        window.open(URL.createObjectURL(blob), '_blank');
      } else {
        window.open(data, '_blank');
      }
    } catch (err) {
      alert('Não foi possível abrir o PDF.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Cabeçalho com Filtros (Seu Visual Original) */}
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/30">
        <h3 className="text-lg font-bold text-slate-900">Registro das Despesas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full xl:w-auto xl:min-w-[800px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#00735C]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar fornecedor, NF..."
              type="text"
            />
          </div>
          <select className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs" value={filterItem} onChange={(e) => setFilterItem(e.target.value)}>
            <option value="">Todos os itens</option>
            {BUDGET_DATA.map(i => <option key={i.id} value={i.id}>{i.id}</option>)}
          </select>
          <select className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigos</option>
            <option value="amount_desc">Maior valor</option>
            <option value="amount_asc">Menor valor</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <th className="p-4">Lançamento</th>
              <th className="p-4">Item</th>
              <th className="p-4">NF</th>
              <th className="p-4">Fornecedor</th>
              <th className="p-4">Descrição</th>
              <th className="p-4 text-center">Doc</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4">Data Despesa</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="p-10 text-center text-slate-400">Nenhum lançamento encontrado.</td></tr>
            ) : (
              filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50/80 transition border-l-4 border-transparent hover:border-[#00735C]">
                  <td className="p-4 text-[10px] text-slate-400 font-medium">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('pt-BR') : '---'}
                  </td>
                  <td className="p-4 font-bold text-[#00735C]">{entry.itemCode}</td>
                  <td className="p-4 text-slate-500 text-xs">{entry.nf || '—'}</td>
                  <td className="p-4 font-semibold text-slate-700">{entry.supplier}</td>
                  <td className="p-4 text-[10px] text-slate-400 max-w-[200px] truncate">{entry.description || '—'}</td>
                  <td className="p-4 text-center">
                    {entry.documentData ? (
                      <button className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200" onClick={() => openDocument(entry.documentData)}>
                        <Eye size={14} className="text-slate-600" />
                      </button>
                    ) : '—'}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}
                  </td>
                  <td className="p-4 text-slate-500 text-xs">{entry.date}</td>
                  <td className="p-4">
  <select 
    value={entry.approvalStatus || 'Pendente'} 
    onChange={(e) => onStatusChange(entry.id, e.target.value as any)}
    className={`text-[10px] font-bold py-1 px-2 rounded-lg outline-none border transition-all ${
      entry.approvalStatus === 'Aprovado' ? 'bg-green-50 text-green-700 border-green-200' :
      entry.approvalStatus === 'Desaprovado' ? 'bg-red-50 text-red-700 border-red-200' :
      'bg-yellow-50 text-yellow-700 border-yellow-200'
    }`}
  >
    <option value="Pendente">Pendente</option>
    <option value="Aprovado">Aprovado</option>
    <option value="Desaprovado">Desaprovado</option>
  </select>
</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-[#00735C]" onClick={() => onEdit(entry)}>
                        <Edit size={14} />
                      </button>
                      
                      {/* TRAVA DE SEGURANÇA ADMIN */}
                      {canDelete && (
                        <button className="p-2 text-slate-400 hover:text-red-600" onClick={() => onDelete(entry.id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
