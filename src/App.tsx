import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc,
  getDoc,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { Charts } from './components/Charts';
import { ExpenseForm } from './components/ExpenseForm';
import { Ledger } from './components/Ledger';
import { BudgetStatus } from './components/BudgetStatus';
import { EditModal } from './components/EditModal';
import { Toast } from './components/Toast';
import { Login } from './components/Login';
import { BUDGET_DATA } from './constants';
import { LedgerEntry, AuditLogEntry } from './types';
import { normalizeDateInput } from './lib/utils';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'entry' | 'report'>('entry');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Ensure user document exists
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: 'user' // Default role
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time data fetching
  useEffect(() => {
    if (!user || !isAuthReady) {
      setLedgerEntries([]);
      setAuditLog([]);
      return;
    }

    const ledgerQuery = query(collection(db, 'ledger'), orderBy('createdAt', 'desc'));
    const unsubscribeLedger = onSnapshot(ledgerQuery, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setLedgerEntries(entries);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'ledger');
    });

    const auditQuery = query(collection(db, 'audit'), orderBy('timestamp', 'desc'));
    const unsubscribeAudit = onSnapshot(auditQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data() as AuditLogEntry);
      setAuditLog(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'audit');
    });

    return () => {
      unsubscribeLedger();
      unsubscribeAudit();
    };
  }, [user, isAuthReady]);

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  const addAuditLog = async (action: string, entry: Partial<LedgerEntry>, detail: string = '') => {
    if (!user) return;
    const newAudit: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      itemCode: entry.itemCode || '',
      nf: entry.nf || '',
      amount: entry.amount || 0,
      detail,
      authorUid: user.uid
    };
    try {
      await addDoc(collection(db, 'audit'), newAudit);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'audit');
    }
  };

  const totals = useMemo(() => {
    const totalOrcado = BUDGET_DATA.reduce((acc, i) => acc + i.value, 0);
    const totalExecutado = ledgerEntries.reduce((acc, i) => acc + i.amount, 0);
    const totalSaldo = totalOrcado - totalExecutado;
    const percentTotal = (totalExecutado / totalOrcado) * 100 || 0;
    
    const criticalItems = BUDGET_DATA.filter(item => {
      const spent = ledgerEntries.filter(e => e.itemCode === item.id).reduce((acc, e) => acc + e.amount, 0);
      const saldo = item.value - spent;
      return saldo <= 0 || (saldo / item.value) <= 0.1;
    }).length;

    return { totalOrcado, totalExecutado, totalSaldo, percentTotal, criticalItems };
  }, [ledgerEntries]);

  const chartData = useMemo(() => {
    const categories = [...new Set(BUDGET_DATA.map(i => i.type))];
    const categoryPrevisto = categories.map(cat => BUDGET_DATA.filter(i => i.type === cat).reduce((acc, i) => acc + i.value, 0));
    const categoryExecutado = categories.map(cat => ledgerEntries.filter(e => e.category === cat).reduce((acc, e) => acc + e.amount, 0));

    const groups = [...new Set(BUDGET_DATA.map(i => i.group))];
    const groupPrevisto = groups.map(g => BUDGET_DATA.filter(i => i.group === g).reduce((acc, i) => acc + i.value, 0));
    const groupExecutado = groups.map(g => ledgerEntries.filter(e => e.group === g).reduce((acc, e) => acc + e.amount, 0));

    const stages = [...new Set(BUDGET_DATA.map(i => i.stage))];
    const stagePrevisto = stages.map(s => BUDGET_DATA.filter(i => i.stage === s).reduce((acc, i) => acc + i.value, 0));
    const stageExecutado = stages.map(s => ledgerEntries.filter(e => e.stage === s).reduce((acc, e) => acc + e.amount, 0));

    const monthlyMap = new Map<string, number>();
    ledgerEntries.forEach(e => {
      const parts = e.date.split('/');
      if (parts.length === 3) {
        const label = `${parts[1]}/${parts[2]}`;
        monthlyMap.set(label, (monthlyMap.get(label) || 0) + e.amount);
      }
    });
    const monthLabels = Array.from(monthlyMap.keys());
    const monthExecutado = Array.from(monthlyMap.values());

    return {
      category: { labels: categories, previsto: categoryPrevisto, executado: categoryExecutado },
      group: { labels: groups, previsto: groupPrevisto, executado: groupExecutado },
      stage: { labels: stages, previsto: stagePrevisto, executado: stageExecutado },
      month: { labels: monthLabels, executado: monthExecutado }
    };
  }, [ledgerEntries]);

  const handleAddEntry = async (data: any) => {
    if (!user) return;
    const item = BUDGET_DATA.find(i => i.id === data.itemCode);
    if (!item) return;

    const spent = ledgerEntries.filter(e => e.itemCode === data.itemCode).reduce((acc, e) => acc + e.amount, 0);
    if (spent + data.amount > item.value + 0.01) {
      showToast(`Saldo insuficiente no item ${data.itemCode}.`);
      return;
    }

    const newEntry = {
      ...data,
      category: item.type,
      stage: item.stage,
      group: item.group,
      approvalStatus: 'Pendente',
      date: normalizeDateInput(data.date),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorUid: user.uid
    };

    try {
      await addDoc(collection(db, 'ledger'), newEntry);
      addAuditLog('Inclusão manual', newEntry, `${newEntry.supplier} · ${newEntry.description}`);
      showToast('Lançamento registrado com sucesso.');
      setActiveTab('report');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ledger');
    }
  };

  const handleUpdateEntry = async (updated: LedgerEntry) => {
    if (!user) return;
    const item = BUDGET_DATA.find(i => i.id === updated.itemCode);
    if (!item) return;

    const spent = ledgerEntries
      .filter(e => e.itemCode === updated.itemCode && e.id !== updated.id)
      .reduce((acc, e) => acc + e.amount, 0);

    if (spent + updated.amount > item.value + 0.01) {
      showToast(`Saldo insuficiente no item ${updated.itemCode}.`);
      return;
    }

    try {
      const entryRef = doc(db, 'ledger', updated.id.toString());
      const { id, ...dataToUpdate } = updated;
      await updateDoc(entryRef, dataToUpdate as any);
      addAuditLog('Edição', updated, `Valor atualizado para ${updated.amount} · ${updated.description}`);
      setEditingEntry(null);
      showToast('Lançamento atualizado com sucesso.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ledger/${updated.id}`);
    }
  };

  const handleDeleteEntry = async (id: any) => {
    if (!confirm('Deseja remover este lançamento?')) return;
    const entry = ledgerEntries.find(e => e.id === id);
    if (entry) {
      try {
        await deleteDoc(doc(db, 'ledger', id.toString()));
        addAuditLog('Exclusão', entry, `${entry.supplier} · ${entry.description}`);
        showToast('Lançamento removido.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `ledger/${id}`);
      }
    }
  };

  const handleStatusChange = async (id: any, status: LedgerEntry['approvalStatus']) => {
    const entry = ledgerEntries.find(e => e.id === id);
    if (entry) {
      try {
        await updateDoc(doc(db, 'ledger', id.toString()), { 
          approvalStatus: status, 
          updatedAt: new Date().toISOString() 
        });
        addAuditLog('Validação', entry, `Status alterado para ${status}`);
        showToast(`Despesa marcada como ${status}.`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `ledger/${id}`);
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm('Deseja apagar todos os registros lançados? (Apenas administradores podem fazer isso em massa)')) {
      // For safety, we don't implement batch delete here without admin check
      showToast('Operação restrita. Remova os itens individualmente ou contate um administrador.');
    }
  };

  const handleLogout = () => signOut(auth);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00735C]"></div>
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return <Login onDemoMode={() => setIsDemoMode(true)} />;
  }

  const currentUserDisplayName = user?.displayName || user?.email || (isDemoMode ? 'Usuário Demo' : '—');

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4 gap-4 items-center">
          <div className="flex items-center gap-2 text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
            <UserIcon size={14} />
            <span className="text-xs font-semibold">{currentUserDisplayName}</span>
          </div>
          <button 
            onClick={isDemoMode ? () => setIsDemoMode(false) : handleLogout}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors text-xs font-bold"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>

        <Header 
          onClear={handleClearAll} 
          onExportCSV={() => {}} 
          onExportExcel={() => {}} 
          onExportAudit={() => {}} 
        />

        <div className="mb-6 flex flex-wrap gap-3">
          <button 
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${activeTab === 'entry' ? 'bg-[#00735C] text-white shadow-sm' : 'bg-white text-[#00735C] border border-[#00735C]/25'}`}
            onClick={() => setActiveTab('entry')}
          >
            Ambiente de inclusão de dados
          </button>
          <button 
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${activeTab === 'report' ? 'bg-[#00735C] text-white shadow-sm' : 'bg-white text-[#00735C] border border-[#00735C]/25'}`}
            onClick={() => setActiveTab('report')}
          >
            Ambiente do relatório
          </button>
        </div>

        {activeTab === 'entry' ? (
          <div className="space-y-6">
            <ExpenseForm onAdd={handleAddEntry} showToast={showToast} />
          </div>
        ) : (
          <div className="space-y-8">
            <SummaryCards 
              totalOrcado={totals.totalOrcado}
              totalExecutado={totals.totalExecutado}
              totalSaldo={totals.totalSaldo}
              percentTotal={totals.percentTotal}
              criticalItems={totals.criticalItems}
              totalRecords={ledgerEntries.length}
              lastAudit={auditLog[0]?.timestamp ? new Date(auditLog[0].timestamp).toLocaleString('pt-BR') : '—'}
            />
            
            <Charts 
              categoryData={chartData.category}
              groupData={chartData.group}
              stageData={chartData.stage}
              monthData={chartData.month}
            />

            <Ledger 
              entries={ledgerEntries} 
              onEdit={setEditingEntry} 
              onDelete={handleDeleteEntry} 
              onStatusChange={handleStatusChange} 
            />

            <BudgetStatus entries={ledgerEntries} />
          </div>
        )}
      </div>

      <EditModal 
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        entry={editingEntry}
        onSave={handleUpdateEntry}
        getSpentForItem={(code, id) => ledgerEntries.filter(e => e.itemCode === code && e.id !== id).reduce((acc, e) => acc + e.amount, 0)}
      />

      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
}
