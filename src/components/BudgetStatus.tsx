import React from 'react';
import { BUDGET_DATA } from '../constants';
import { LedgerEntry } from '../types';
import { fmt, cn } from '../lib/utils';

interface BudgetStatusProps {
  entries: LedgerEntry[];
}

export const BudgetStatus: React.FC<BudgetStatusProps> = ({ entries }) => {
  const getSpentForItem = (itemCode: string) => {
    return entries
      .filter(e => e.itemCode === itemCode)
      .reduce((acc, e) => acc + e.amount, 0);
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
              <th className="p-4 font-bold text-slate-500 text-right">Executado</th>
              <th className="p-4 font-bold text-slate-500 text-right">Saldo</th>
              <th className="p-4 font-bold text-slate-500 text-center w-28 md:w-44">Progresso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {BUDGET_DATA.map(item => {
              const totalGasto = getSpentForItem(item.id);
              const saldo = item.value - totalGasto;
              const percentReal = (totalGasto / item.value) * 100;
              const percentBar = Math.min(percentReal, 100);
              const isCritical = saldo <= 0 || (saldo / item.value) <= 0.1;
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
                  <td className="p-4 text-right text-slate-500 font-medium">{fmt.format(item.value)}</td>
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
    </div>
  );
};
