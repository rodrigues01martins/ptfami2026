import React, { useState } from 'react';
import { Eye, Edit, Trash2, Search } from 'lucide-react';
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
  const [filterCategory, setFilterCategory] = useState('');
  const [sortMode, setSortMode] = useState('desc');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');

  const categories = [...new Set(BUDGET_DATA.map(i => i.type))];

  const filtered = entries.filter(e => {
    const matchCategory = !filterCategory || e.category === filterCategory;
    const matchStatus = filterStatus === 'Todos' || e.approvalStatus === filterStatus;
    return matchCategory && matchStatus;
    
  }).sort((a, b) => {
    if (sortMode === 'asc') return formatDateForSort(a.date) - formatDateForSort(b.date);
    if (sortMode === 'amount_desc') return b.amount - a.amount;
    if (sortMode === 'amount_asc') return a.amount - b.amount;
    return formatDateForSort(b.date) - formatDateForSort(a.date); });

  const openDocument = (data: string) => {
    try {
      if (data.startsWith('data:application/pdf;base64,')) {
        const base64Content = data.split(',')[1];
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
        window.open(URL.createObjectURL(blob), '_blank');
      } else { window.open(data, '_blank'); }
    } catch (err) { alert('Não foi possível abrir o PDF.'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/30">
        <h3 className="text-lg font-bold text-slate-900">Registro das Despesas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full xl:w-auto xl:min-w-[800px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
           <select className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
            <option value="desc">Recentes</option>
            <option value="asc">Antigos</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Status:</span>
  {['Todos', 'Pendente', 'Aprovado', 'Reprovado'].map((status) => (
    <button
      key={status}
      onClick={() => setFilterStatus(status)}
      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
        filterStatus === status 
          ? 'bg-[#00735C] text-white border-[#00735C] shadow-sm' 
          : 'bg-white text-slate-600 border-slate-200 hover:border-[#00735C] hover:text-[#00735C]'
      }`}
    >
      {status}
    </button>
  ))}
</div>
      </div>

      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-sm">
  <thead>
    <tr className="border-b border-slate-200">
      <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Data</th>
      <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Categoria</th>
      <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Descrição</th>
      <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Fornecedor</th>
      <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">Valor</th>
      <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
      <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase">Ações</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-100">
    {filtered.map(entry => (
      <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
        {/* 1. DATA */}
        <td className="p-4 text-sm text-slate-600">{entry.date}</td>
        
        {/* 2. CATEGORIA */}
        <td className="p-4">
          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">
            {entry.category}
          </span>
        </td>

        {/* 3. DESCRIÇÃO */}
        <td className="p-4 text-sm text-slate-600 italic truncate max-w-[150px]" title={entry.description}>
          {entry.description || '-'}
        </td>

        {/* 4. FORNECEDOR */}
        <td className="p-4 text-sm font-medium text-slate-700">{entry.supplier}</td>

        {/* 5. VALOR */}
        <td className="p-4 text-right font-bold text-slate-900">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}
        </td>

        {/* 6. STATUS */}
        <td className="p-4 text-center">
          <select 
            disabled={!isAdmin}
            value={entry.approvalStatus || 'Pendente'} 
            onChange={(e) => onStatusChange(entry.id, e.target.value as any)}
            className={`text-[10px] font-bold py-1 px-2 rounded-lg border outline-none ${
              entry.approvalStatus === 'Aprovado' ? 'bg-green-50 text-green-700 border-green-200' :
              entry.approvalStatus === 'Desaprovado' ? 'bg-red-50 text-red-700 border-red-200' : 
              'bg-yellow-50 text-yellow-700 border-yellow-200'
            } ${!isAdmin ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <option value="Pendente">Pendente</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Desaprovado">Desaprovado</option>
          </select>
        </td>

        {/* 7. AÇÕES */}
        <td className="p-4 text-center">
          <div className="flex justify-center gap-2">
            {entry.documentData && (
              <button 
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors" 
                onClick={() => openDocument(entry.documentData!)}
                title="Ver Documento"
              >
                <Eye size={14} />
              </button>
            )}
            <button 
              className="p-2 text-slate-400 hover:text-[#00735C] transition-colors" 
              onClick={() => onEdit(entry)}
              title="Editar"
            >
              <Edit size={14} />
            </button>
            {canDelete && (
              <button 
                className="p-2 text-slate-400 hover:text-red-600 transition-colors" 
                onClick={() => onDelete(entry.id)}
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>     
      </div>
    </div>
  );
}
