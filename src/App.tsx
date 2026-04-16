import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, 
  doc, query, orderBy 
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Importação dos Componentes
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { Charts } from './components/Charts';
import { ExpenseForm } from './components/ExpenseForm';
import { Ledger } from './components/Ledger';
import { BudgetStatus } from './components/BudgetStatus'; // IMPORTAÇÃO CORRIGIDA AQUI
import { EditModal } from './components/EditModal';
import { Toast } from './components/Toast';
import { Login } from './components/Login';

import { BUDGET_DATA } from './constants';
import { LedgerEntry } from './types';

// SEU UID DE ADMINISTRADOR PARA TRAVA DE EXCLUSÃO
const ADMIN_UID = "lba3ydI19fPRDIXF09zXFI7oV8x2";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'entry' | 'report'>('entry');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  // Monitoramento de Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Busca de dados no Firestore
  useEffect(() => {
    if (!user && !isDemoMode) return;
    const q = query(collection(db, 'ledger'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      } as LedgerEntry));
      setLedgerEntries(data);
    }, (error) => {
      console.error("Erro Firestore:", error);
    });
    return () => unsubscribe();
  }, [user, isDemoMode]);

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  // --- EXPORTAÇÃO CSV COMPLETA ---
  const handleExportCSV = () => {
    if (ledgerEntries.length === 0) return showToast("Sem dados para exportar.");
    
    const headers = "Data Lancamento;Data Despesa;Item;Fornecedor;NF;Valor;Categoria;Descricao;Status\n";
    
    const rows = ledgerEntries.map(e => {
      const dataLancamento = e.createdAt ? new Date(e.createdAt).toLocaleDateString('pt-BR') : '---';
      const valorFormatado = e.amount.toString().replace('.', ',');
      return `${dataLancamento};${e.date};${e.itemCode};${e.supplier};${e.nf || ''};${valorFormatado};${e.category};${e.description || ''};${e.approvalStatus || 'Pendente'}`;
    }).join("\n");
    
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_SEDS_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    link.click();
  };

  // --- FUNÇÕES DE CRUD ---
  const handleAddEntry = async (data: any) => {
    try {
      const item = BUDGET_DATA.find(i => i.id === data.itemCode);
      const newEntry = {
        ...data,
        category: item?.type || 'Outros',
        createdAt: new Date().toISOString(),
        authorUid: user?.uid || 'demo-user'
      };
      await addDoc(collection(db, 'ledger'), newEntry);
      showToast("Registro incluído!");
      setActiveTab('report');
    } catch (e) {
      showToast("Erro ao gravar.");
    }
  };

  const handleUpdateEntry = async (id: string, data: Partial<LedgerEntry>) => {
    try {
      const docRef = doc(db, 'ledger', id);
      await updateDoc(docRef, data);
      setEditingEntry(null);
      showToast("Atualizado!");
    } catch (e) {
      showToast("Erro ao atualizar.");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (user?.uid !== ADMIN_UID) return showToast("Acesso negado.");
    if (window.confirm("Deseja excluir este registro?")) {
      await deleteDoc(doc(db, 'ledger', id));
      showToast("Removido.");
    }
  };

  // --- CÁLCULOS E GRÁFICOS ---
  const totals = useMemo(() => {
    const orcado = BUDGET_DATA.reduce((acc, curr) => acc + (curr.originalValue || 0), 0);
    const executado = ledgerEntries.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    return { orcado, executado, saldo: orcado - executado };
  }, [ledgerEntries]);

  const chartData = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    ledgerEntries.forEach(e => {
      const parts = e.date.split('/'); 
      if (parts.length === 3) {
        const label = `${parts[1]}/${parts[2]}`;
        monthlyMap.set(label, (monthlyMap.get(label) || 0) + e.amount);
      }
    });
    const sortedLabels = Array.from(monthlyMap.keys()).sort();
    return {
      month: {
        labels: sortedLabels,
        executado: sortedLabels.map(l => monthlyMap.get(l) || 0)
      }
    };
  }, [ledgerEntries]);

  if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-[#00735C]">Carregando SEDS...</div>;
  if (!user && !isDemoMode) return <Login onDemoMode={() => setIsDemoMode(true)} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header onExportCSV={handleExportCSV} />
        
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('entry')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'entry' ? 'bg-[#00735C] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Incluir Registro
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'report' ? 'bg-[#00735C] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Ambiente de Relatório
            </button>
          </div>

          <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-red-600 font-bold text-sm px-4 py-2">
            Sair do Sistema
          </button>
        </div>

        {activeTab === 'entry' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ExpenseForm onAdd={handleAddEntry} showToast={showToast} />
            </div>
            <div>
              <BudgetStatus totalOrçado={totals.orcado} totalExecutado={totals.executado} />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <SummaryCards 
              totalOrçado={totals.orcado} 
              totalExecutado={totals.executado} 
              saldo={totals.saldo}
              totalRecords={ledgerEntries.length}
            />
            <Charts monthData={chartData.month} categoryData={{ labels: [], values: [] }} />
            <Ledger 
              entries={ledgerEntries} 
              onEdit={setEditingEntry} 
              onDelete={handleDeleteEntry}
              canDelete={user?.uid === ADMIN_UID}
            />
          </div>
        )}
      </div>

      {editingEntry && (
        <EditModal 
          entry={editingEntry} 
          onClose={() => setEditingEntry(null)} 
          onSave={handleUpdateEntry} 
        />
      )}

      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
}
