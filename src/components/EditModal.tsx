import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { LedgerEntry } from '../types';
import { BUDGET_DATA } from '../constants';
import { fmt, formatDateForInput, fileToDataUrl } from '../lib/utils';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: LedgerEntry | null;
  onSave: (updated: LedgerEntry) => void;
  getSpentForItem: (itemCode: string, excludeId: number) => number;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, entry, onSave, getSpentForItem }) => {
  const [itemCode, setItemCode] = useState('');
  const [nf, setNf] = useState('');
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [referenceMonth, setReferenceMonth] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (entry) {
      setItemCode(entry.itemCode);
      setNf(entry.nf);
      setSupplier(entry.supplier);
      setDescription(entry.description);
      setAmount(entry.amount.toString());
      setDate(formatDateForInput(entry.date));
      setReferenceMonth(entry.referenceMonth);
      setFile(null);
    }
  }, [entry]);

  if (!entry) return null;

  const selectedItem = BUDGET_DATA.find(i => i.id === itemCode);
  const spent = getSpentForItem(itemCode, entry.id);
  const balance = selectedItem ? selectedItem.value - spent : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let documentName = entry.documentName;
    let documentData = entry.documentData;

    if (file) {
      if (file.type !== 'application/pdf') {
        alert('O arquivo anexado precisa estar em formato PDF.');
        return;
      }
      documentName = file.name;
      documentData = await fileToDataUrl(file);
    }

    onSave({
      ...entry,
      itemCode,
      nf,
      supplier,
      description,
      amount: parseFloat(amount),
      date: date.split('-').reverse().join('/'),
      referenceMonth,
      documentName,
      documentData,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative z-10"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Editar lançamento</h3>
              <button className="text-slate-400 hover:text-slate-700" onClick={onClose}><X size={20} /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Código do Item</label>
                <select 
                  className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm appearance-none bg-slate-50"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  required
                >
                  {BUDGET_DATA.map(item => (
                    <option key={item.id} value={item.id}>{item.id} - {item.desc}</option>
                  ))}
                </select>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Categoria automática</span>
                  <strong>{selectedItem?.type || '—'}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Previsto no item</span>
                  <strong>{fmt.format(selectedItem?.value || 0)}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Executado sem este lançamento</span>
                  <strong>{fmt.format(spent)}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Saldo disponível para edição</span>
                  <strong className={balance < 0 ? 'text-red-600' : 'text-emerald-600'}>{fmt.format(balance)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">NF / Documento</label>
                  <input 
                    className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm"
                    value={nf}
                    onChange={(e) => setNf(e.target.value)}
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fornecedor</label>
                  <input 
                    className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    type="text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição</label>
                <input 
                  className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  type="text"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor (R$)</label>
                  <input 
                    className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm font-bold"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    step="0.01"
                    type="number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data</label>
                  <input 
                    className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm bg-white"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    type="date"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mês de Referência</label>
                  <input 
                    className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm bg-white"
                    value={referenceMonth}
                    onChange={(e) => setReferenceMonth(e.target.value)}
                    type="month"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-2">Documento atual: <span className="font-semibold text-slate-700">{entry.documentName || 'Nenhum'}</span></div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Substituir Documentação (PDF)</label>
                <input 
                  accept=".pdf"
                  className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm bg-white"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  type="file"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={onClose}
                  type="button"
                >
                  Cancelar
                </button>
                <button 
                  className="px-5 py-2.5 rounded-xl bg-[#00735C] hover:bg-[#005b49] text-white font-semibold"
                  type="submit"
                >
                  Salvar alterações
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
