import React, { useState } from 'react';
import { ArrowLeftRight, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BUDGET_DATA } from '../constants';
import { LedgerEntry, BudgetItem, Remanejamento } from '../types';
import { fmt, cn, getPrevisto } from '../lib/utils';
import { RemanejamentoModal } from './RemanejamentoModal';

interface BudgetStatusProps {
  entries: LedgerEntry[];
  remanejamentos: Remanejamento[];
  canManageRemanejamento: boolean;
  onAddRemanejamento: (itemOrigemId: string, itemDestinoId: string, valor: number) => Promise<void>;
}

export const BudgetStatus: React.FC<BudgetStatusProps> = ({
  entries, remanejamentos, canManageRemanejamento, onAddRemanejamento,
}) => {
  const [remanejarItem, setRemanejarItem] = useState<BudgetItem | null>(null);

  const getSpentForItem = (itemCode: string) => {
    return entries
      .filter(e => e.itemCode === itemCode)
      .reduce((acc, e) => acc + e.amount, 0);
  };

  const getSaldo = (itemId: string) => getPrevisto(itemId, remanejamentos) - getSpentForItem(itemId);

  const handleGeneratePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.text('Análise do Plano de Trabalho (Saldos)', 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 21);

    autoTable(doc, {
      startY: 26,
      head: [['Código', 'Item', 'Previsto', 'Executado', 'Saldo', 'Progresso']],
      body: BUDGET_DATA.map(item => {
        const previsto = getPrevisto(item.id, remanejamentos);
        const gasto = getSpentForItem(item.id);
        const saldo = previsto - gasto;
        const percent = previsto > 0 ? (gasto / previsto) * 100 : 0;
        return [item.id, item.desc, fmt.format(previsto), fmt.format(gasto), fmt.format(saldo), `${percent.toFixed(1)}%`];
      }),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 115, 92] },
      columnStyles: { 1: { cellWidth: 90 } },
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Remanejamentos de Saldo', 14, 15);

    if (remanejamentos.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Nenhum remanejamento registrado até o momento.', 14, 25);
    } else {
      autoTable(doc, {
        startY: 22,
        head: [['Data', 'Rubrica de Origem', 'Rubrica de Destino', 'Valor']],
        body: [...remanejamentos]
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
          .map(r => [
            new Date(r.createdAt).toLocaleString('pt-BR'),
            `${r.itemOrigemId} - ${r.itemOrigemDesc}`,
            `${r.itemDestinoId} - ${r.itemDestinoDesc}`,
            fmt.format(r.valor),
          ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 115, 92] },
      });
    }

    doc.save(`Analise_Plano_Trabalho_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-900">Análise do Plano de Trabalho (Saldos)</h3>
        <p className="text-xs text-slate-500">Lançamentos que excedem o saldo do item são bloqueados automaticamente.</p>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="p-4 font-bold text-slate-500">Código / Item do Plano de Trabalho</th>
              <th className="p-4 font-bold text-slate-500 text-right">Previsto</th>
              <th className="p-4 font-bold text-slate-500 text-center">Alterar</th>
              <th className="p-4 font-bold text-slate-500 text-right">Executado</th>
              <th className="p-4 font-bold text-slate-500 text-right">Saldo</th>
              <th className="p-4 font-bold text-slate-500 text-center w-28 md:w-44">Progresso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {BUDGET_DATA.map(item => {
              const previsto = getPrevisto(item.id, remanejamentos);
              const totalGasto = getSpentForItem(item.id);
              const saldo = previsto - totalGasto;
              const percentReal = previsto > 0 ? (totalGasto / previsto) * 100 : 0;
              const percentBar = Math.min(Math.max(percentReal, 0), 100);
              const isCritical = saldo <= 0 || (previsto > 0 && saldo / previsto <= 0.1);
              const progressColor = percentReal > 100 ? 'bg-red-500' : isCritical ? 'bg-[#FCD951]' : 'bg-[#00735C]';

              return (
                <tr key={item.id} className={cn("transition", isCritical ? "bg-[#FCD951]/10 hover:bg-[#FCD951]/15" : "hover:bg-slate-50")}>
                  <td className="p-4">
                    <div className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                      <span>{item.id}</span>
                      {isCritical && (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#FCD951]/30 text-[#7a5c00] text-[10px] font-bold">
                          Crítico
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[280px]">{item.desc}</div>
                  </td>
                  <td className="p-4 text-right text-slate-500 font-medium">{fmt.format(previsto)}</td>
                  <td className="p-4 text-center">
                    {canManageRemanejamento && (
                      <button
                        className="p-2 text-slate-400 hover:text-[#00735C] transition-colors"
                        onClick={() => setRemanejarItem(item)}
                        title="Alterar"
                      >
                        <ArrowLeftRight size={14} />
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right font-bold text-[#00735C]">{fmt.format(totalGasto)}</td>
                  <td className={cn("p-4 text-right font-bold", saldo < 0 ? "text-red-600 bg-red-50" : isCritical ? "text-[#7a5c00]" : "text-emerald-600")}>
                    {fmt.format(saldo)}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={cn("h-full transition-all duration-1000", progressColor)}
                          style={{ width: `${percentBar}%` }}
                        />
                      </div>
                      <span className={cn("text-[10px] font-bold", isCritical ? "text-[#7a5c00]" : "text-slate-400")}>
                        {percentReal.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-slate-100 flex justify-end">
        <button
          onClick={handleGeneratePDF}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00735C] text-white font-bold shadow-lg hover:bg-[#005c4a] transition-all text-sm"
        >
          <FileDown size={16} /> Gerar Relatório em PDF
        </button>
      </div>

      <RemanejamentoModal
        isOpen={!!remanejarItem}
        onClose={() => setRemanejarItem(null)}
        destinoItem={remanejarItem}
        budgetData={BUDGET_DATA}
        getSaldo={getSaldo}
        onConfirm={(itemOrigemId, valor) => {
          if (!remanejarItem) return Promise.reject(new Error('Item de destino inválido.'));
          return onAddRemanejamento(itemOrigemId, remanejarItem.id, valor);
        }}
      />
    </div>
  );
};
