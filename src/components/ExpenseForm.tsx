import React, { useState } from 'react';
import { PlusCircle, Calendar, Tag, Building2, FileText, DollarSign, AlignLeft } from 'lucide-react';
import { BUDGET_DATA } from '../constants';

interface ExpenseFormProps {
  onAdd: (data: any) => void;
  showToast: (message: string) => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd, showToast }) => {
  const [formData, setFormData] = useState({
    itemCode: '',
    supplier: '',
    nf: '',
    amount: '',
    date: new Date().toLocaleDateString('pt-BR'),
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemCode || !formData.amount || !formData.date) {
      showToast("Preencha Item, Valor e Data da Despesa.");
      return;
    }
    onAdd({
      ...formData,
      amount: parseFloat(formData.amount.replace(',', '.')),
    });
    setFormData({ itemCode: '', supplier: '', nf: '', amount: '', date: new Date().toLocaleDateString('pt-BR'), description: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
        <div className="bg-[#00735C]/10 p-2.5 rounded-xl text-[#00735C]"><PlusCircle size={24} /></div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Novo Lançamento</h2>
          <p className="text-sm text-slate-500">Gestão de Despesas SEDS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Tag size={14} /> Código do Item</label>
          <select value={formData.itemCode} onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#00735C]">
            <option value="">Selecione um item do plano...</option>
            {BUDGET_DATA.map((item) => <option key={item.id} value={item.id}>{item.id} - {item.description}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><FileText size={14} /> NF / Documento</label>
          <input type="text" placeholder="Ex: NF 456" value={formData.nf} onChange={(e) => setFormData({ ...formData, nf: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Building2 size={14} /> Fornecedor</label>
          <input type="text" placeholder="Ex: Papelaria Central" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><DollarSign size={14} /> Valor (R$)</label>
          <input type="text" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm font-bold text-[#00735C]" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Calendar size={14} /> Data da Despesa</label>
          <input type="text" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm" />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><AlignLeft size={14} /> Descrição</label>
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm" />
        </div>
      </div>

      <button type="submit" className="w-full mt-8 bg-[#00735C] text-white font-bold py-4 rounded-2xl shadow-lg transition-all">Incluir Registro</button>
    </form>
  );
};
