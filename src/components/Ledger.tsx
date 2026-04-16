import React from 'react';
import { Edit2, Trash2, Calendar, Hash, Tag, Info } from 'lucide-react';
import { LedgerEntry } from '../types';

interface LedgerProps {
  entries: LedgerEntry[];
  onEdit: (entry: LedgerEntry) => void;
  onDelete: (id: string) => void;
  canDelete: boolean; // Trava vinda do App.tsx
}

export const Ledger: React.FC<LedgerProps> = ({ entries, onEdit, onDelete, canDelete }) => {
  
  const formatDateTime = (isoString: string) => {
    if (!isoString) return '---';
    try {
      return new Date(isoString).toLocaleDateString('pt-BR');
    } catch (e) { return '---'; }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Hash size={18} className="text-[#00735C]" />
          Registro das Despesas
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4 border-b">Lançamento</th>
              <th className="px-6 py-4 border-b">Data Despesa</th>
              <th className="px-6 py-4 border-b">Item / Fornecedor</th>
              <th className="px-6 py-4 border-b text-right">Valor</th> {/* FORÇANDO O NOME AQUI */}
              <th className="px-6 py-4 border-b text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-xs text-slate-400">
                  {formatDateTime(entry.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">
                  {entry.date}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm">{entry.itemCode}</span>
                    <span className="text-xs text-slate-500">{entry.supplier}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-bold text-[#00735C]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(entry)} className="p-2 text-slate-400 hover:text-[#00735C]">
                      <Edit2 size={16} />
                    </button>
                    
                    {/* SÓ MOSTRA SE FOR ADMIN */}
                    {canDelete && (
                      <button onClick={() => onDelete(entry.id)} className="p-2 text-slate-400 hover:text-red-600">
                        <Trash2 size={16} />
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
};
