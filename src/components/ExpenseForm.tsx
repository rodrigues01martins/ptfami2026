import React, { useState, useEffect } from 'react';
import { BUDGET_DATA } from '../constants';
import { fmt, fileToDataUrl } from '../lib/utils';
import { BudgetItem } from '../types';

interface ExpenseFormProps {
  onAdd: (entry: any) => void;
  showToast: (msg: string) => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd, showToast }) => {
  const [itemCode, setItemCode] = useState('');
  const [nf, setNf] = useState('');
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceMonth, setReferenceMonth] = useState(new Date().toISOString().slice(0, 7));
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState(false);

  const selectedItem = BUDGET_DATA.find(i => i.id === itemCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode || !description || !amount || !file) {
      if (!file) setFileError(true);
      showToast('Preencha todos os campos obrigatórios e anexe o PDF.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setFileError(true);
      showToast('O arquivo anexado precisa estar em formato PDF.');
      return;
    }

    try {
      const documentData = await fileToDataUrl(file);
      onAdd({
        itemCode,
        nf,
        supplier,
        description,
        amount: parseFloat(amount),
        date,
        referenceMonth,
        documentName: file.name,
        documentData
      });
      
      // Reset form
      setItemCode('');
      setNf('');
      setSupplier('');
      setDescription('');
      setAmount('');
      setFile(null);
      setFileError(false);
    } catch (err) {
      showToast('Erro ao processar o arquivo PDF.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Novo Lançamento</h3>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Código do Item</label>
          <select 
            className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm appearance-none bg-slate-50"
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value)}
            required
          >
            <option value="">Selecione um item do plano...</option>
            {BUDGET_DATA.map(item => (
              <option key={item.id} value={item.id}>{item.id} - {item.desc}</option>
            ))}
          </select>
        </div>

        {selectedItem && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Categoria automática</span>
              <strong>{selectedItem.type}</strong>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Previsto no item</span>
              <strong>{fmt.format(selectedItem.value)}</strong>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">NF / Documento</label>
            <input 
              className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm"
              value={nf}
              onChange={(e) => setNf(e.target.value)}
              placeholder="Ex: NF 456"
              type="text"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fornecedor</label>
            <input 
              className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ex: Papelaria Central"
              type="text"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição Detalhada</label>
          <input 
            className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Toner para impressora do setor técnico"
            required
            type="text"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor do Documento (R$)</label>
            <input 
              className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm font-bold"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
              step="0.01"
              min="0.01"
              type="number"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data do Lançamento</label>
            <input 
              className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm bg-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              type="date"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mes de Referencia</label>
            <input 
              className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm bg-white"
              value={referenceMonth}
              onChange={(e) => setReferenceMonth(e.target.value)}
              type="month"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Incluir Documentação (PDF)</label>
          <input 
            accept=".pdf"
            className={`w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#00735C] outline-none border text-sm bg-white ${fileError ? 'border-red-400 bg-red-50' : ''}`}
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              setFileError(false);
            }}
            type="file"
          />
          <p className={`mt-2 text-xs ${fileError ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
            {file ? `Arquivo selecionado: ${file.name}` : 'Anexe um arquivo em PDF para registrar o lançamento.'}
          </p>
        </div>

        <button 
          className="w-full bg-[#00735C] hover:bg-[#005b49] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
          type="submit"
        >
          Incluir Registros
        </button>
      </form>
    </div>
  );
};
