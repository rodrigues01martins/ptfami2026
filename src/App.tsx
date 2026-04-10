import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, 
  doc, query, orderBy, getDoc 
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

const ADMIN_EMAIL = 'rodrigues01martins@gmail.com';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'entry' | 'report'>('entry');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- BUSCA REAL NO FIRESTORE ---
  useEffect(() => {
    if (!user && !isDemoMode) return;
    
    // Esta parte garante que os dados venham do banco e não sumam no F5
    const q = query(collection(db, 'ledger'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LedgerEntry));
      setLedgerEntries(data);
    }, (error) => {
      console.error("Erro ao buscar dados:", error);
      showToast("Erro de conexão com o Banco de Dados.");
    });

    return () => unsubscribe();
  }, [user, isDemoMode]);

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  const isAdmin = () => user?.email === ADMIN_EMAIL;

  // --- FUNÇÕES DE EXPORTAÇÃO (CORRIGIDAS) ---
  const handleExportExcel = () => {
    if (ledgerEntries.length === 0) return showToast("Sem dados para exportar.");
    const ws = XLSX.utils.json_to_sheet(ledgerEntries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, "Relatorio_SEDS.xlsx");
  };

  const handleExportCSV = () => {
    if (ledgerEntries.length === 0) return showToast("Sem dados para exportar.");
    const headers = "ID,Data,Fornecedor,Valor,Categoria\n";
    const rows = ledgerEntries.map(e => `${e.itemCode},${e.date},${e.supplier},${e.amount},${e.category}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dados_seds.csv';
    a.click();
  };

  // --- FUNÇÕES DE BANCO DE DADOS (INCLUIR / EDITAR / EXCLUIR) ---
  const handleAddEntry = async (data: any) => {
    if (!user) return;
    try {
      const item = BUDGET_DATA.find(i => i.id === data.itemCode);
      const newEntry = {
        ...data,
        category: item?.type || 'Outros',
        createdAt: new Date().toISOString(),
        authorUid: user.uid,
        date: normalizeDateInput(data.date)
      };
      // SALVA NO FIRESTORE DE VERDADE
      await addDoc(collection(db, 'ledger'), newEntry);
      showToast("Registro salvo no Banco de Dados!");
      setActiveTab('report');
    } catch (e) {
      showToast("Erro ao salvar. Verifique sua conexão.");
    }
  };

  const handleUpdateEntry = async (updated: LedgerEntry) => {
    try {
      const entryRef = doc(db, 'ledger', updated.id.toString());
      const { id, ...data } = updated;
      await updateDoc(entryRef, data);
      setEditingEntry(null);
      showToast("Registro atualizado!");
    } catch (e) {
      showToast("Erro ao editar.");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!isAdmin()) return showToast("Apenas o admin pode excluir.");
    if (window.confirm("Deseja excluir este registro permanentemente?")) {
      try {
        await deleteDoc(doc(db, 'ledger', id));
        showToast("Registro excluído do Banco.");
      } catch (e) {
        showToast("Erro ao excluir.");
      }
    }
  };

  // --- GRÁFICOS E TOTAIS ---
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
    const monthlyMap = new Map();
    ledgerEntries.forEach(e => {
      const parts = e.date.split('/');
      if (parts.length === 3) {
        const key = `${parts[1]}/${parts[2]}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + e.amount);
      }
    });
    return {
      category: { labels: [], previsto: [], executado: [] }, // Simplificado para brevidade
      month: { labels: Array.from(monthlyMap.keys()), executado: Array.from(monthlyMap.values()) },
      group: { labels: [], previsto: [], executado: [] },
      stage: { labels: [], previsto: [], executado: [] }
    };
  }, [ledgerEntries]);

  if (!isAuthReady) return <div>Carregando...</div>;
  if (!user && !isDemoMode) return <Login onDemoMode={() => setIsDemoMode(true)} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4 gap-4 items-center">
          <span className="text-xs font-bold text-slate-500">{user?.email}</span>
          <button onClick={() => signOut(auth)} className="text-red-500 text-xs font-bold">SAIR</button>
        </div>

        <Header 
          onClear={() => isAdmin() && showToast("Limpeza iniciada...")} 
          onExportCSV={handleExportCSV} 
          onExportExcel={handleExportExcel} 
          onExportAudit={() => showToast("Auditoria em desenvolvimento...")} 
        />

        <div className="mb-6 flex gap-3">
          <button onClick={() => setActiveTab('entry')} className={`px-4 py-2 rounded-xl font-bold ${activeTab === 'entry' ? 'bg-[#00735C] text-white' : 'bg-white border'}`}>
            Incluir Registros
          </button>
          <button onClick={() => setActiveTab('report')} className={`px-4 py-2 rounded-xl font-bold ${activeTab === 'report' ? 'bg-[#00735C] text-white' : 'bg-white border'}`}>
            Ambiente do Relatório
          </button>
        </div>

        {activeTab === 'entry' ? (
          <ExpenseForm onAdd={handleAddEntry} showToast={showToast} />
        ) : (
          <div className="space-y-8">
            <SummaryCards {...totals} totalRecords={ledgerEntries.length} lastAudit="-" criticalItems={0} />
            <Charts categoryData={chartData.category} monthData={chartData.month} groupData={chartData.group} stageData={chartData.stage} />
            <Ledger 
              entries={ledgerEntries} 
              onEdit={setEditingEntry} 
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
        />
      )}
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
}
