import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, 
  doc, query, orderBy, setDoc, getDoc, getDocFromServer 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

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

  // Monitor de Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Busca de dados
  useEffect(() => {
    if (!user && !isDemoMode) return;
    const ledgerQuery = query(collection(db, 'ledger'), orderBy('createdAt', 'desc'));
    const unsubscribeLedger = onSnapshot(ledgerQuery, (snapshot) => {
      setLedgerEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });
    const auditQuery = query(collection(db, 'audit'), orderBy('timestamp', 'desc'));
    const unsubscribeAudit = onSnapshot(auditQuery, (snapshot) => {
      setAuditLog(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });
    return () => { unsubscribeLedger(); unsubscribeAudit(); };
  }, [user, isDemoMode]);

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  // --- FUNÇÕES DE EXPORTAÇÃO E CONTROLE (COM TRAVA) ---

  const checkAdmin = () => {
    if (user?.email !== ADMIN_EMAIL) {
      showToast('Acesso negado: Apenas administradores podem realizar esta ação.');
      return false;
    }
    return true;
  };

  const handleExportExcel = () => {
    if (!checkAdmin()) return;
    const worksheet = XLSX.utils.json_to_sheet(ledgerEntries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financeiro");
    XLSX.writeFile(workbook, `Relatorio_SEDS_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleClearAll = async () => {
    if (!checkAdmin()) return;
    if (window.confirm("ATENÇÃO: Deseja realmente APAGAR TODOS os registros do banco de dados?")) {
      showToast("Limpando banco de dados...");
      const promises = ledgerEntries.map(e => deleteDoc(doc(db, 'ledger', e.id.toString())));
      await Promise.all(promises);
      showToast("Banco de dados limpo.");
    }
  };

  // --- CÁLCULOS E GRÁFICOS ---

  const totals = useMemo(() => {
    const totalOrcado = BUDGET_DATA.reduce((acc, i) => acc + i.value, 0);
    const totalExecutado = ledgerEntries.reduce((acc, i) => acc + i.amount, 0);
    const percentTotal = (totalExecutado / totalOrcado) * 100 || 0;
    return { totalOrcado, totalExecutado, totalSaldo: totalOrcado - totalExecutado, percentTotal, criticalItems: 0 };
  }, [ledgerEntries]);

  const chartData = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    
    ledgerEntries.forEach(e => {
      // CORREÇÃO 3.1: Usar a data do registro (campo .date) e não a data de criação
      const parts = e.date.split('/'); 
      if (parts.length === 3) {
        const mesAno = `${parts[1]}/${parts[2]}`; // Pega "MM/AAAA" da data digitada
        monthlyMap.set(mesAno, (monthlyMap.get(mesAno) || 0) + e.amount);
      }
    });

    const categories = [...new Set(BUDGET_DATA.map(i => i.type))];
    return {
      category: { labels: categories, previsto: categories.map(c => BUDGET_DATA.filter(i => i.type === c).reduce((acc, i) => acc + i.value, 0)), executado: categories.map(c => ledgerEntries.filter(e => e.category === c).reduce((acc, e) => acc + e.amount, 0)) },
      month: { labels: Array.from(monthlyMap.keys()), executado: Array.from(monthlyMap.values()) },
      group: { labels: [], previsto: [], executado: [] },
      stage: { labels: [], previsto: [], executado: [] }
    };
  }, [ledgerEntries]);

  if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center">Carregando SEDS...</div>;
  if (!user && !isDemoMode) return <Login onDemoMode={() => setIsDemoMode(true)} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4 gap-4 items-center">
          <span className="text-xs font-bold text-slate-600 italic">{user?.email}</span>
          <button onClick={() => signOut(auth)} className="text-red-600 text-xs font-bold flex items-center gap-1"><LogOut size={14}/> Sair</button>
        </div>

        {/* CORREÇÃO 1: Botões conectados às funções com trava */}
        <Header 
          onClear={handleClearAll} 
          onExportCSV={() => checkAdmin() && showToast("Exportando CSV...")} 
          onExportExcel={handleExportExcel} 
          onExportAudit={() => checkAdmin() && showToast("Exportando Auditoria...")} 
        />

        <div className="mb-6 flex gap-3">
          {/* CORREÇÃO 2: Alteração do título do Botão */}
          <button onClick={() => setActiveTab('entry')} className={`px-5 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'entry' ? 'bg-[#00735C] text-white' : 'bg-white text-[#00735C] border'}`}>
            Incluir Registros
          </button>
          <button onClick={() => setActiveTab('report')} className={`px-5 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'report' ? 'bg-[#00735C] text-white' : 'bg-white text-[#00735C] border'}`}>
            Ambiente do Relatório
          </button>
        </div>

        {activeTab === 'entry' ? (
          <ExpenseForm onAdd={async (data) => {
            const item = BUDGET_DATA.find(i => i.id === data.itemCode);
            if (!item || !user) return;
            await addDoc(collection(db, 'ledger'), { ...data, category: item.type, stage: item.stage, group: item.group, createdAt: new Date().toISOString(), authorUid: user.uid });
            showToast('Lançamento Incluído!');
            setActiveTab('report');
          }} showToast={showToast} />
        ) : (
          <div className="space-y-8">
            <SummaryCards 
              totalOrcado={totals.totalOrcado} 
              totalExecutado={totals.totalExecutado} 
              totalSaldo={totals.totalSaldo} 
              percentTotal={totals.percentTotal} 
              criticalItems={0} 
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
