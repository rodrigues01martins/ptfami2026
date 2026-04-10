import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, 
  doc, query, orderBy 
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Componentes
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { Charts } from './components/Charts';
import { ExpenseForm } from './components/ExpenseForm';
import { Ledger } from './components/Ledger';
import { BudgetStatus } from './components/BudgetStatus';
import { EditModal } from './components/EditModal';
import { Toast } from './components/Toast';
import { Login } from './components/Login';

// Constantes e Utils
import { BUDGET_DATA } from './constants';
import { LedgerEntry } from './types';
import { normalizeDateInput } from './lib/utils';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'entry' | 'report'>('entry');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  // Monitor de Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Busca de dados em tempo real (Sincronizado com Firestore)
  useEffect(() => {
    if (!user && !isDemoMode) return;
    
    const q = query(collection(db, 'ledger'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id // Garante que o ID do Firestore seja usado para Edição/Exclusão
      } as LedgerEntry));
      setLedgerEntries(data);
    }, (error) => {
      console.error("Erro Firestore:", error);
      showToast("Erro ao carregar dados do banco.");
    });

    return () => unsubscribe();
  }, [user, isDemoMode]);

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  // --- FUNÇÃO ÚNICA DE EXPORTAÇÃO ---
  const handleExportCSV = () => {
    if (ledgerEntries.length === 0) return showToast("Não há dados para exportar.");
    const headers = "Mês Referência;Item;Fornecedor;NF;Valor;Categoria\n";
    const rows = ledgerEntries.map(e => 
      `${e.date};${e.itemCode};${e.supplier};${e.nf || ''};${e.amount};${e.category}`
    ).join("\n");
    
    const blob = new Blob(["\ufeff" + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Registros_SEDS_${new Date().toLocaleDateString()}.csv`);
    link.click();
    showToast("Exportação CSV concluída.");
  };

  // --- OPERAÇÕES DE BANCO DE DADOS ---
  const handleAddEntry = async (data: any) => {
    if (!user && !isDemoMode) return;
    try {
      const item = BUDGET_DATA.find(i => i.id === data.itemCode);
      const newEntry = {
        ...data,
        category: item?.type || 'Outros',
        stage: item?.stage || '',
        group: item?.group || '',
        date: normalizeDateInput(data.date), // Mês de Referência
        createdAt: new Date().toISOString(), // Data de Lançamento (Sistema)
        authorUid: user?.uid || 'demo-user'
      };
      await addDoc(collection(db, 'ledger'), newEntry);
      showToast("Registro incluído com sucesso!");
      setActiveTab('report');
    } catch (e) {
      showToast("Erro ao gravar no banco.");
    }
  };

  const handleUpdateEntry = async (updated: LedgerEntry) => {
    try {
      const { id, ...dataToSave } = updated;
      const entryRef = doc(db, 'ledger', id);
      await updateDoc(entryRef, dataToSave);
      setEditingEntry(null);
      showToast("Registro atualizado.");
    } catch (e) {
      console.error(e);
      showToast("Erro ao atualizar registro.");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este registro?")) {
      try {
        await deleteDoc(doc(db, 'ledger', id));
        showToast("Registro removido.");
      } catch (e) {
        showToast("Erro ao excluir.");
      }
    }
  };

  // --- LÓGICA DE GRÁFICOS (MÊS DE REFERÊNCIA) ---
  const totals = useMemo(() => {
    const totalOrcado = BUDGET_DATA.reduce((acc, i) => acc + i.value, 0);
    const totalExecutado = ledgerEntries.reduce((acc, i) => acc + i.amount, 0);
    return {
      totalOrcado,
      totalExecutado,
      totalSaldo: totalOrcado - totalExecutado,
      percentTotal: (totalExecutado / totalOrcado) * 100 || 0
    };
  }, [ledgerEntries]);

  const chartData = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    ledgerEntries.forEach(e => {
      // Busca dados do campo 'date' (Mês de Referência)
      const parts = e.date.split('/');
      if (parts.length === 3) {
        const label = `${parts[1]}/${parts[2]}`;
        monthlyMap.set(label, (monthlyMap.get(label) || 0) + e.amount);
      }
    });

    const categories = [...new Set(BUDGET_DATA.map(i => i.type))];
    return {
      category: { 
        labels: categories, 
        previsto: categories.map(c => BUDGET_DATA.filter(i => i.type === c).reduce((acc, i) => acc + i.value, 0)),
        executado: categories.map(c => ledgerEntries.filter(e => e.category === c).reduce((acc, e) => acc + e.amount, 0))
      },
      month: { labels: Array.from(monthlyMap.keys()), executado: Array.from(monthlyMap.values()) },
      group: { labels: [], previsto: [], executado: [] },
      stage: { labels: [], previsto: [], executado: [] }
    };
  }, [ledgerEntries]);

  if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Iniciando...</div>;
  if (!user && !isDemoMode) return <Login onDemoMode={() => setIsDemoMode(true)} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4 gap-4 items-center">
          <div className="flex items-center gap-2 text-slate-500 bg-white px-3 py-1 rounded-full border text-xs font-bold">
             <UserIcon size={12} /> {user?.email || 'Modo Visualização'}
          </div>
          <button onClick={() => signOut(auth)} className="text-red-600 text-xs font-bold hover:bg-red-50 p-1 px-3 rounded-full transition-all">Sair</button>
        </div>

        <Header 
          onExportCSV={handleExportCSV}
          onClear={() => {}} // Função desativada conforme solicitado
          onExportExcel={() => {}} // Função desativada conforme solicitado
          onExportAudit={() => {}} // Função desativada conforme solicitado
        />

        <div className="mb-6 flex gap-3">
          <button onClick={() => setActiveTab('entry')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'entry' ? 'bg-[#00735C] text-white shadow-lg shadow-[#00735C]/20' : 'bg-white text-[#00735C] border'}`}>
            Incluir Registros
          </button>
          <button onClick={() => setActiveTab('report')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'report' ? 'bg-[#00735C] text-white shadow-lg shadow-[#00735C]/20' : 'bg-white text-[#00735C] border'}`}>
            Ambiente do Relatório
          </button>
        </div>

        {activeTab === 'entry' ? (
          <ExpenseForm onAdd={handleAddEntry} showToast={showToast} />
        ) : (
          <div className="space-y-8">
            <SummaryCards 
              {...totals} 
              totalRecords={ledgerEntries.length} 
              lastAudit="-" 
              criticalItems={0} 
            />
            <Charts categoryData={chartData.category} monthData={chartData.month} groupData={chartData.group} stageData={chartData.stage} />
            <Ledger 
              entries={ledgerEntries} 
              onEdit={(entry) => setEditingEntry(entry)} 
              onDelete={handleDeleteEntry} 
              onStatusChange={() => {}} 
            />
            <BudgetStatus entries={ledgerEntries} />
          </div>
        )}
      </div>

      {editingEntry && (
        <EditModal 
          isOpen={true} 
          onClose={() => setEditingEntry(null)} 
          entry={editingEntry} 
          onSave={handleUpdateEntry}
          getSpentForItem={(code, id) => ledgerEntries.filter(e => e.itemCode === code && e.id !== id).reduce((acc, e) => acc + e.amount, 0)}
        />
      )}

      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
}
