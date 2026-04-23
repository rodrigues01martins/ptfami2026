import React, { useState } from 'react';
// Verifique se todos esses ícones estão aqui:
import { PlusCircle, Calendar, Tag, Building2, FileText, DollarSign, AlignLeft, Upload } from 'lucide-react';
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
    date: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD para o input type="date"
    description: '',
    documentData: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Arquivo muito grande! Máximo 2MB.");
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, documentData: reader.result as string }));
        showToast("PDF anexado!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemCode || !formData.amount || !formData.date) {
      showToast("Preencha Item, Valor e Data.");
      return;
    }

    // Converte a data de YYYY-MM-DD para DD/MM/AAAA antes de salvar para manter seu padrão
    const [year, month, day] = formData.date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    onAdd({
      ...formData,
      date: formattedDate,
      amount: parseFloat(formData.amount.replace(',', '.')),
    });

    setFormData({ 
      itemCode: '', supplier: '', nf: '', amount: '', 
      date: new Date().toISOString().split('T')[0], 
      description: '', documentData: '' 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
        <div className="bg-[#00735C]/10 p-2.5 rounded-xl text-[#00735C]">
          <PlusCircle size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Novo Lançamento</h2>
          <p className="text-sm text-slate-500">Insira os dados das despesas realizadas</p>
        </div>
      </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div className="space-y-2">
  <label className="flex items-center gap-2 text-[14px] uppercase tracking-wider font-bold text-[#00735C]">
    <Tag size={18} className="text-[#00735C]" fill="#00735C" /> 
    Código do Item
  </label>
          <select 
            value={formData.itemCode} 
            onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))} 
            className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#00735C]"
          >
            <option value="">Selecione um item do plano...</option>
            {BUDGET_DATA.map((item) => (
              <option key={item.id} value={item.id}>{item.id} - {item.desc}</option>
            ))}
          </select>
        </div>

       <div className="space-y-2">
  <label className="flex items-center gap-2 text-[14px] uppercase tracking-wider font-bold text-[#00735C]">
    <FileText size={18} className="text-[#00735C]" fill="#00735C" /> 
    NF / Documento
  </label>
          <input type="text" placeholder="Ex: NF 456" value={formData.nf} onChange={(e) => setFormData(prev => ({ ...prev, nf: e.target.value }))} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm" />
        </div>

        <div className="space-y-2">
         <label className="flex items-center gap-2 text-[14px] uppercase tracking-wider font-bold text-[#00735C]">
            <FileText size={18} className="text-[#00735C]" fill="#00735C" /> Fornecedor
          </label>
          <input type="text" placeholder="Ex: Papelaria Central" value={formData.supplier} onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm" />
        </div>

       <div className="space-y-2">
  <label className="flex items-center gap-2 text-[14px] uppercase tracking-wider font-bold text-[#00735C]">
    <DollarSign size={18} className="text-[#00735C]" fill="#00735C" /> 
    Valor (R$)
  </label>
          <input type="text" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm font-bold text-[#00735C]" />
        </div>

        <div className="space-y-2">
         <label className="flex items-center gap-2 text-[14px] uppercase tracking-wider font-bold text-[#00735C]">
            <Calendar size={18} className="text-[#00735C]" fill="#00735C" /> Data da Despesa
          </label>
          <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm" />
        </div>

        <div className="md:col-span-2 space-y-2">
           <label className="flex items-center gap-2 text-[14px] uppercase tracking-wider font-bold text-[#00735C]">
            <Calendar size={18} className="text-[#00735C]" fill="#00735C" /> Documentação (PDF)
          </label>
          <input type="file" accept="application/pdf" onChange={handleFileChange} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#00735C]/10 file:text-[#00735C] cursor-pointer bg-slate-50 rounded-xl" />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="flex items-center gap-2 text-[14px] uppercase tracking-wider font-bold text-[#00735C]">
            <Calendar size={18} className="text-[#00735C]" fill="#00735C" /> <strong> Descrição (Conforme especificado na Nota Fiscal/Comprovante) </strong>
          </label>
          <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={2} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm" />
        </div>
      </div>

      <button type="submit" className="w-full mt-8 bg-[#00735C] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#005c4a] transition-all">
        Salvar Lançamento
      </button>
    </form>
  );
};
