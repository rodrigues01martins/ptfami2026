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
  onUpdateComment: (id: string, comment: string) => void; // Adicionado aqui
  canDelete: boolean;
  isAdmin: boolean; 
}

export function Ledger({ entries, onEdit, onDelete, onStatusChange, onUpdateComment, canDelete, isAdmin }: LedgerProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); 
  const [filterItem, setFilterItem] = useState('');

  // Lógica de filtragem limpa
  const filtered = entries.filter(e => {
    const searchBlob = [e.itemCode, e.nf, e.supplier, e.description].join(' ').toLowerCase();
    const matchSearch = !search || searchBlob.includes(search.toLowerCase());
    const matchStatus = !filterStatus || e.approvalStatus === filterStatus;
    const matchItem = !filterItem || e.itemCode === filterItem;
    
    return matchSearch && matchStatus && matchItem;
  }).sort((a, b) => formatDateForSort(b.date) - formatDateForSort(a.date));

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="p-6 bg-slate-50/30 border-b">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Barra de Pesquisa */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#00735C]"
              placeholder="Procurar fornecedor, NF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filtro de Item */}
          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs"
            value={filterItem}
            onChange={(e) => setFilterItem(e.target.value)}
          >
            <option value="">Todos os itens</option>
            {BUDGET_DATA.map(i => <option key={i.id} value={i.id}>{i.id}</option>)}
          </select>

          {/* NOVO FILTRO DE STATUS */}
          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#00735C]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="Pendente">🟡 Pendentes</option>
            <option value="Aprovado">🟢 Aprovados</option>
            <option value="Desaprovado">🔴 Desaprovados</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] uppercase text-slate-500 font-bold bg-slate-50">
              <th className="p-4">Data</th>
              <th className="p-4">Item</th>
              <th className="p-4">Fornecedor</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4">Status / Observação da Auditoria</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(entry => (
              <tr key={entry.id} className="hover:bg-slate-50 transition border-l-4 border-transparent hover:border-[#00735C]">
                <td className="p-4 text-xs text-slate-500">{entry.date}</td>
                <td className="p-4 font-bold text-[#00735C]">{entry.itemCode}</td>
                <td className="p-4 font-semibold text-slate-700">{entry.supplier || '---'}</td>
                <td className="p-4 text-right font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}
                </td>
                
                <td className="p-4 min-w-[250px]">
                  <div className="flex flex-col gap-2">
                    <select 
                      disabled={!isAdmin}
                      value={entry.approvalStatus || 'Pendente'}
                      onChange={(e) => onStatusChange(entry.id, e.target.value as any)}
                      className={`text-[10px] font-bold p-1 rounded border w-32 ${
                        entry.approvalStatus === 'Aprovado' ? 'bg-green-50 text-green-700 border-green-200' : 
                        entry.approvalStatus === 'Desaprovado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Desaprovado">Desaprovado</option>
                    </select>

                    <textarea
                      placeholder="Observações da auditoria..."
                      readOnly={!isAdmin}
                      defaultValue={entry.auditComment || ''}
                      onBlur={(e) => {
                        if(isAdmin) {
                           onUpdateComment(entry.id, e.target.value);
                        }
                      }}
                      className={`text-[10px] p-2 rounded border w-full ${
                        !isAdmin ? 'bg-slate-50 border-transparent italic text-slate-500' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                </td>

                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {entry.documentData && (
                      <button className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200" onClick={() => openDocument(entry.documentData)}>
                        <Eye size={14} className="text-slate-600" />
                      </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-[#00735C]" onClick={() => onEdit(entry)}>
                      <Edit size={14} />
                    </button>
                    {canDelete && (
                      <button className="p-2 text-slate-400 hover:text-red-600" onClick={() => onDelete(entry.id)}>
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
