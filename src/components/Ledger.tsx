import React, { useState } from 'react';
import { Eye, Edit, Trash2, Search } from 'lucide-react';
import { LedgerEntry } from '../types';
import { fmt, cn } from '../lib/utils';
import { BUDGET_DATA } from '../constants';

interface LedgerProps {
  entries: LedgerEntry[];
  onEdit: (entry: LedgerEntry) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: LedgerEntry['approvalStatus']) => void;
}

export const Ledger: React.FC<LedgerProps> = ({ entries, onEdit, onDelete, onStatusChange }) => {
  const [search, setSearch] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortMode, setSortMode] = useState('desc');

  const categories = [...new Set(BUDGET_DATA.map(i => i.type))];

  const filtered = entries.filter(e => {
    const searchBlob = [e.itemCode, e.nf, e.supplier, e.description, e.date, e.category, e.approvalStatus].join(' ').toLowerCase();
    const matchSearch = !search || searchBlob.includes(search.toLowerCase());
    const matchItem = !filterItem || e.itemCode === filterItem;
    const matchCategory = !filterCategory || e.category === filterCategory;
    return matchSearch && matchItem && matchCategory;
  }).sort((a, b) => {
    if (sortMode === 'asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortMode === 'amount_desc') return b.amount - a.amount;
    if (sortMode === 'amount_asc') return a.amount - b.amount;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const openDocument = (data: string) => {
    try {
      // For base64 data, it's safer to create a blob and a URL
      if (data.startsWith('data:application/pdf;base64,')) {
        const base64Content = data.split(',')[1];
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        window.open(data, '_blank');
      }
    } catch (err) {
      console.error('Erro ao abrir documento:', err);
      alert('Não foi possível abrir o documento. Verifique se o arquivo é um PDF válido.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-900">Registros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full xl:w-auto xl:min-w-[800px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#00735C]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar..."
              type="text"
            />
          </div>
          <select 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#00735C]"
            value={filterItem}
            onChange={(e) => setFilterItem(e.target.value)}
          >
            <option value="">Todos os itens</option>
            {BUDGET_DATA.map(i => <option key={i.id} value={i.id}>{i.id}</option>)}
          </select>
          <select 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#00735C]"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#00735C]"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
          >
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigos</option>
            <option value="amount_desc">Maior valor</option>
            <option value="amount_asc">Menor valor</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="p-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Item</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">NF</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Fornecedor / Descrição</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Categoria</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Documento</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-center">Validação</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-right">Valor</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Data</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="p-6 text-center text-slate-400">Nenhum lançamento encontrado.</td></tr>
            ) : (
              filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50 transition border-l-4 border-transparent hover:border-[#00735C]">
                  <td className="p-4 font-bold text-[#00735C] align-top">{entry.itemCode}</td>
                  <td className="p-4 text-slate-500 text-xs align-top">{entry.nf || '—'}</td>
                  <td className="p-4 align-top">
                    <div className="font-semibold text-slate-700">{entry.supplier || 'Fornecedor não informado'}</div>
                    <div className="text-xs text-slate-500 mt-1">{entry.description}</div>
                  </td>
                  <td className="p-4 align-top">
                    <span className="inline-flex px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {entry.category}
                    </span>
                  </td>
                  <td className="p-4 align-top text-center">
                    {entry.documentData ? (
                      <button 
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        onClick={() => openDocument(entry.documentData)}
                      >
                        <Eye size={16} />
                      </button>
                    ) : '—'}
                  </td>
                  <td className="p-4 align-top text-center">
                    <select 
                      className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#00735C]"
                      value={entry.approvalStatus}
                      onChange={(e) => onStatusChange(entry.id, e.target.value as any)}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Reprovado">Reprovado</option>
                    </select>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900 align-top">{fmt.format(entry.amount)}</td>
                  <td className="p-4 text-slate-400 text-xs align-top">{entry.date}</td>
                  <td className="p-4 text-right align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        className="px-3 py-1.5 rounded-lg bg-[#00735C]/10 text-[#00735C] hover:bg-[#00735C]/15 text-xs font-semibold flex items-center gap-1"
                        onClick={() => onEdit(entry)}
                      >
                        <Edit size={12} /> Editar
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold flex items-center gap-1"
                        onClick={() => onDelete(entry.id)}
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
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
