import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeftRight } from 'lucide-react';
import { BudgetItem } from '../types';
import { fmt, toCents, parseMoneyInput } from '../lib/utils';

interface RemanejamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinoItem: BudgetItem | null;
  budgetData: BudgetItem[];
  getSaldo: (itemId: string) => number;
  onConfirm: (itemOrigemId: string, valor: number) => Promise<void>;
}

export const RemanejamentoModal: React.FC<RemanejamentoModalProps> = ({
  isOpen, onClose, destinoItem, budgetData, getSaldo, onConfirm,
}) => {
  const [itemOrigemId, setItemOrigemId] = useState('');
  const [valor, setValor] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!destinoItem) return null;

  const origensDisponiveis = budgetData.filter(i => i.id !== destinoItem.id);
  const saldoOrigem = itemOrigemId ? getSaldo(itemOrigemId) : null;

  const resetAndClose = () => {
    setItemOrigemId('');
    setValor('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const valorNum = parseMoneyInput(valor);
    if (!itemOrigemId) return setError('Selecione a rubrica de origem.');
    if (!Number.isFinite(valorNum) || valorNum <= 0) return setError('Informe um valor válido, maior que zero.');
    const saldo = getSaldo(itemOrigemId);
    if (toCents(valorNum) > toCents(saldo)) return setError(`Valor maior que o saldo disponível na origem (${fmt.format(saldo)}).`);

    setSubmitting(true);
    try {
      await onConfirm(itemOrigemId, valorNum);
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gravar o remanejamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={resetAndClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative z-10"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-[#00735C]" />
                Remanejar saldo
              </h3>
              <button className="text-slate-400 hover:text-slate-700" onClick={resetAndClose}>
                <X size={20} />
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Rubrica de destino</span>
                  <strong className="text-[#00735C]">{destinoItem.id}</strong>
                </div>
                <div className="text-slate-600">{destinoItem.desc}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Rubrica de origem (de onde o valor sai)
                </label>
                <select
                  className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm appearance-none bg-slate-50"
                  value={itemOrigemId}
                  onChange={e => setItemOrigemId(e.target.value)}
                  required
                >
                  <option value="">Selecione a rubrica de origem...</option>
                  {origensDisponiveis.map(item => (
                    <option key={item.id} value={item.id}>{item.id} - {item.desc}</option>
                  ))}
                </select>
                {saldoOrigem !== null && (
                  <p className={`mt-1 text-xs font-semibold ${saldoOrigem <= 0 ? 'text-red-600' : 'text-slate-500'}`}>
                    Saldo disponível na origem: {fmt.format(saldoOrigem)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Valor a acrescentar no destino (R$)
                </label>
                <input
                  className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm font-bold"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  placeholder="0,00"
                  required
                  inputMode="decimal"
                />
              </div>

              {error && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#00735C] text-white font-bold shadow-lg hover:bg-[#005c4a] transition-all disabled:opacity-60"
                >
                  {submitting ? 'Gravando...' : 'Confirmar Remanejamento'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RemanejamentoModal;
