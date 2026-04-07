import React from 'react';
import { fmt } from '../lib/utils';

interface SummaryCardsProps {
  totalOrcado: number;
  totalExecutado: number;
  totalSaldo: number;
  percentTotal: number;
  criticalItems: number;
  totalRecords: number;
  lastAudit: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalOrcado,
  totalExecutado,
  totalSaldo,
  percentTotal,
  criticalItems,
  totalRecords,
  lastAudit
}) => {
  const cards = [
    { label: 'Total Previsto', value: fmt.format(totalOrcado), color: 'text-slate-900' },
    { label: 'Total Executado', value: fmt.format(totalExecutado), color: 'text-[#00735C]' },
    { label: 'Saldo Disponível', value: fmt.format(totalSaldo), color: 'text-emerald-600' },
    { label: '% Execução', value: `${percentTotal.toFixed(1)}%`, color: 'text-[#7a5c00]' },
    { label: 'Itens Críticos', value: criticalItems.toString(), color: 'text-red-600' },
    { label: 'Registros', value: totalRecords.toString(), color: 'text-slate-900' },
    { label: 'Última Alteração', value: lastAudit, color: 'text-slate-900', isSmall: true },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:translate-y-[-3px] hover:shadow-md">
          <p className="text-sm font-semibold text-slate-500 mb-2">{card.label}</p>
          <h2 className={`${card.isSmall ? 'text-sm' : 'text-xl'} font-bold ${card.color}`}>
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
};
