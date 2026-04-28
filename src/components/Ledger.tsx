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
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // NOVO FILTRO
  const [filterItem, setFilterItem] = useState('');

  const categories = [...new Set(BUDGET_DATA.map(i => i.type))];

  const filtered = entries.filter(e => {
    const searchBlob = [e.itemCode, e.nf, e.supplier, e.description].join(' ').toLowerCase();
    const matchSearch = !search || searchBlob.includes(search.toLowerCase());
    const matchStatus = !filterStatus || e.approvalStatus === filterStatus; // LÓGICA DO FILTRO DE STATUS
    const matchItem = !filterItem || e.itemCode === filterItem;
    return matchSearch && matchItem && matchCategory;
 return matchSearch && matchStatus && matchItem;
  }).sort((a, b) => formatDateForSort(b.date) - formatDateForSort(a.date));
    if (sortMode === 'amount_desc') return b.amount - a.amount;
    if (sortMode === 'amount_asc') return a.amount - b.amount;
    return formatDateForSort(b.date) - formatDateForSort(a.date);
  };

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3"> {/* Aumentei para 5 colunas */}
          {/* ... outros filtros ... */}
          
          {/* NOVO SELECT DE FILTRO DE STATUS */}
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
              {/* ... outras colunas ... */}
              <th className="p-4">Status / Observação da Auditoria</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => (
              <tr key={entry.id} className="hover:bg-slate-50 border-b">
                {/* ... outras células ... */}
                
                {/* COLUNA DE STATUS COM OBSERVAÇÃO */}
                <td className="p-4 min-w-[250px]">
                  <div className="flex flex-col gap-2">
                    <select 
                      disabled={!isAdmin}
                      value={entry.approvalStatus || 'Pendente'}
                      onChange={(e) => onStatusChange(entry.id, e.target.value as any)}
                      className={`text-[10px] font-bold p-1 rounded border w-32 ${
                        entry.approvalStatus === 'Aprovado' ? 'bg-green-50 text-green-700' : 
                        entry.approvalStatus === 'Desaprovado' ? 'bg-red-50 text-red-700' : 'bg-yellow-50'
                      }`}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Desaprovado">Desaprovado</option>
                    </select>

                    {/* CAMPO DE OBSERVAÇÃO (Exibe sempre, edita se for Admin) */}
                    <textarea
                      placeholder="Observações da auditoria..."
                      readOnly={!isAdmin}
                      defaultValue={entry.auditComment || ''}
                      onBlur={(e) => {
                        if(isAdmin) {
                           // Chamaremos uma função de update aqui
                           onUpdateComment(entry.id, e.target.value);
                        }
                      }}
                      className={`text-[10px] p-2 rounded border w-full ${
                        !isAdmin ? 'bg-slate-50 border-transparent italic' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                </td>
                {/* ... ações ... */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
