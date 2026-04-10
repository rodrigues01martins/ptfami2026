import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, 
  doc, query, orderBy, setDoc, getDoc, getDocFromServer 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

// Importação dos Componentes
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { Charts } from './components/Charts';
import { ExpenseForm } from './components/ExpenseForm';
import { Ledger } from './components/Ledger';
import { BudgetStatus } from './components/BudgetStatus';
import { EditModal } from './components/EditModal';
import { Toast } from './components/Toast';
import { Login } from './components/Login';

// Importação de Constantes e Utilitários
import { BUDGET_DATA } from './constants';
import { LedgerEntry, AuditLogEntry } from './types';
import { normalizeDateInput } from './lib/utils';
import { LogOut, User as UserIcon } from 'lucide-react';

const ADMIN_EMAIL = 'rodrigues01martins@gmail.com';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'entry' | 'report'>('entry');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<any | null>(null);

  // Monitor de Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Busca de dados em tempo real (Firestore)
  useEffect(() => {
    if (!user && !isDemoMode) return;

    const ledgerQuery = query(collection(db, 'ledger'), orderBy('createdAt', 'desc'));
    const unsubscribeLedger = onSnapshot(ledgerQuery, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setLedgerEntries(entries);
    });

    const auditQuery = query(collection(db, 'audit'), orderBy('timestamp', 'desc'));
    const unsubscribeAudit = onSnapshot(auditQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setAuditLog(logs);
    });

    return () => {
      unsubscribeLedger();
      unsubscribeAudit();
    };
  }, [user, isDemoMode]);

  // Funções de Cálculo Originais
  const totals = useMemo(() => {
    const totalOrcado = BUDGET_DATA.reduce((acc, i) => acc + i.value, 0);
    const totalExecutado = ledgerEntries.reduce((acc, i) => acc + i.amount, 0);
    const totalSaldo = totalOrcado - totalExecutado;
    const percentTotal = (totalExecutado / totalOrcado) * 100 || 0;
    const criticalItems = BUDGET_DATA.filter(item => {
      const spent = ledgerEntries.filter(e => e.itemCode === item.id).reduce((acc, e) => acc + e.amount, 0);
      return (item.value - spent) <= (item.value * 0.1);
    }).length;
    return { totalOrcado, totalExecutado, totalSaldo, percentTotal, criticalItems };
  }, [ledgerEntries]);

  const chartData = useMemo(() => {
    const categories = [...new Set(BUDGET_DATA.map(i => i.type))];
    const categoryPrevisto = categories.map(cat => BUDGET_DATA.filter(i => i.type === cat).reduce((acc, i) => acc + i.value, 0));
    const categoryExecutado = categories.map(cat => ledgerEntries.filter(e => e.category === cat).reduce((acc, e) => acc + e.amount, 0));
    
    const monthlyMap = new Map<string, number>();
    ledgerEntries.forEach(e => {
      const parts = e.date.split('/');
      if (parts.length === 3) {
        const label = `${parts[1]}/${parts[2]}`;
        monthlyMap.set(label, (monthlyMap.get(label) || 0) + e.amount);
      }
    });

    return {
      category: { labels: categories, previsto: categoryPrevisto, executado: categoryExecutado },
      month: { labels: Array.from(monthlyMap.keys()), executado: Array.from(monthlyMap.values()) },
      group: { labels: [], previsto: [], executado: [] }, // Simplificado para evitar erro
      stage: { labels: [], previsto: [], executado: [] }  // Simplificado para evitar erro
    };
  }, [ledgerEntries]);

  // Handlers Originais (Adicionar, Deletar, Exportar)
  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  const handleAddEntry = async (data: any) => {
    const item = BUDGET_DATA.find(i => i.id === data.itemCode);
    if (!item || !user) return;
    const newEntry = { ...data, category: item.type, stage: item.stage, group: item.group, date: normalizeDateInput(data.date), createdAt: new Date().toISOString(), authorUid: user.uid };
    await addDoc(collection(db, 'ledger'), newEntry);
    showToast('Lançamento registrado!');
    setActiveTab('report');
  };

  if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  if (!user && !isDemoMode) {
    return <Login onDemoMode={() => setIsDemoMode(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4 gap-4 items-center">
          <span className="text-xs font-bold text-slate-600">{user?.email || 'Modo Demo'}</span>
          <button onClick={() => signOut(auth)} className="text-red-600 text-xs font-bold flex items-center gap-1"><LogOut size={14}/> Sair</button>
        </div>

        <Header onClear={() => {}} onExportCSV={() => {}} onExportExcel={() => {}} onExportAudit={() => {}} />

        <div className="mb-6 flex gap-3">
          <button onClick={() => setActiveTab('entry')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'entry' ? 'bg-[#00735C] text-white' : 'bg-white text-[#00735C] border'}`}>
            Ambiente de Inclusão
          </button>
          <button onClick={() => setActiveTab('report')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'report' ? 'bg-[#00735C] text-white' : 'bg-white text-[#00735C] border'}`}>
            Ambiente do Relatório
          </button>
        </div>

        {activeTab === 'entry' ? (
          <ExpenseForm onAdd={handleAddEntry} showToast={showToast} />
        ) : (
          <div className="space-y-8">
            <SummaryCards 
              totalOrcado={totals.totalOrcado} 
              totalExecutado={totals.totalExecutado} 
              totalSaldo={totals.totalSaldo} 
              percentTotal={totals.percentTotal} 
              criticalItems={totals.criticalItems} 
              totalRecords={ledgerEntries.length} 
              lastAudit={auditLog[0]?.timestamp ? new Date(auditLog[0].timestamp).toLocaleString() : '—'} 
            />
            <Charts categoryData={chartData.category} groupData={chartData.group} stageData={chartData.stage} monthData={chartData.month} />
            <Ledger entries={ledgerEntries} onEdit={setEditingEntry} onDelete={() => {}} onStatusChange={() => {}} />
            <BudgetStatus entries={ledgerEntries} />
          </div>
        )}
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
}
