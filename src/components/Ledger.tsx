import React from 'react';
import { Edit2, Trash2, Calendar, Hash, Tag, Info } from 'lucide-react';
import { LedgerEntry } from '../types';

interface LedgerProps {
  entries: LedgerEntry[];
  onEdit: (entry: LedgerEntry) => void;
  onDelete: (id: string) => void;
  canDelete: boolean; // Propriedade para controlar a trava de exclusão
}

export const Ledger: React.FC<LedgerProps> = ({ entries, onEdit, onDelete, canDelete }) => {
  
  // Função para formatar a data de lançamento automática (createdAt)
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return '---';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Hash size={18} className="text-[#00735C]" />
          Registros de Despesas
        </h3>
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border">
          {entries.length} registros encontrados
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4 border-b">Lançamento</th>
              <th className="px-6 py-4 border-b">Data Despesa</th>
              <th className="px-6 py-4 border-b">Item / Fornecedor</th>
              <th className="px-6 py-4 border-b">Categoria</th>
              <th className="px-6 py-4 border-b">NF</th>
              <th className="px-6 py-4 border-b text-right">Valor</th>
              <th className="px-6 py-4 border-b text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-slate-400">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Calendar size={14} className="text-slate-400" />
                    {entry.date}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm">{entry.itemCode}</span>
                    <span className="text-xs text-slate-500 truncate max-w-[200px]">{entry.supplier}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                    <Tag size={10} />
                    {entry.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                  {entry.nf || '---'}
                </td>
                <td className="px-6 py-4 text-right font-bold text-[#00735C]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(entry)}
                      className="p-2 text-slate-400 hover:text-[#00735C] hover:bg-[#00735C]/5 rounded-lg transition-all"
                      title="Editar registro"
                    >
                      <Edit2 size={16} />
                    </button>
                    
                    {/* TRAVA DE EXCLUSÃO: O botão só é renderizado se canDelete for true */}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(entry.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Info size={32} strokeWidth={1.5} />
                    <p className="text-sm font-medium">Nenhum registro encontrado para este Plano de Trabalho.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
