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
import { User as UserIcon } from 'lucide-react';

// SEU UID DE ADMINISTRADOR
const ADMIN_UID = "lba3ydI19fPRDIXF09zXFI7oV8x2";

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

  // Busca de dados em tempo real
  useEffect(() => {
    if (!user && !isDemoMode) return;
    const q = query(collection(db, 'ledger'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LedgerEntry));
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

  // --- FUNÇÃO DE EXPORTAÇÃO CSV ---
  const handleExportCSV = () => {
    if (ledgerEntries.length === 0) return showToast("Não há dados.");
    const headers = "Data Lancamento;Data Despesa;Item;Fornecedor;NF;Valor;Categoria;Descricao\n";
    const rows = ledgerEntries.map(e => {
      const lancamento = e.createdAt ? new Date(e.createdAt).toLocaleDateString('pt-BR') : '---';
      const valorExcel = e.amount.toString().replace('.', ',');
      return `${lancamento};${e.date};${e.itemCode};${e.supplier};${e.nf || ''};${valorExcel};${e.category};${e.description || ''}`;
    }).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Relatorio_SEDS_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    link.click();
  };

  // --- OPERAÇÕES CRUD ---
  const handleAddEntry = async (data: any) => {
    try {
      const item = BUDGET_DATA.find(i => i.id === data.itemCode);
      await addDoc(collection(db, 'ledger'), {
        ...data,
        category: item?.type || 'Outros',
        approvalStatus: 'Pendente',
        createdAt: new Date().toISOString(),
        authorUid: user?.uid || 'demo-user'
      });
      showToast("Registro salvo!");
      setActiveTab('report');
    } catch (e) { showToast("Erro ao gravar."); }
  };

  const handleUpdateEntry = async (updated: LedgerEntry) => {
    try {
      const { id, ...dataToSave } = updated;
      await updateDoc(doc(db, 'ledger', id), dataToSave);
      setEditingEntry(null);
      showToast("Atualizado.");
    } catch (e: any) { 
  // Isso vai fazer o erro aparecer no alerta da tela para você ler
  alert("Erro real: " + e.message); 
  showToast("Erro ao atualizar."); 
}

  const handleStatusChange = async (id: string, status: LedgerEntry['approvalStatus']) => {
    try {
      await updateDoc(doc(db, 'ledger', id), { approvalStatus: status });
      showToast(`Status: ${status}`);
    } catch (e) { showToast("Erro ao atualizar status."); }
  };

  const handleDeleteEntry = async (id: string) => {
    if (user?.uid !== ADMIN_UID) return showToast("Acesso negado.");
    if (window.confirm("Deseja realmente excluir?")) {
      try {
        await deleteDoc(doc(db, 'ledger', id));
        showToast("Removido.");
      } catch (e) { showToast("Erro ao excluir."); }
    }
  };

  // --- LÓGICA DE TOTAIS E GRÁFICOS ---
  const totals = useMemo(() => {
    const totalOrcado = BUDGET_DATA.reduce((acc, i) => acc + (i.value || 0), 0);
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
      const parts = e.date.split('/');
      if (parts.length === 3) {
        const label = `${parts[1]}/${parts[2]}`;
        monthlyMap.set(label, (monthlyMap.get(label) || 0) + e.amount);
      }
    });
    const categories = [...new Set(BUDGET_DATA.map(i => i.type))];
    const groups = [...new Set(BUDGET_DATA.map(i => i.group))];
    const stages = [...new Set(BUDGET_DATA.map(i => i.stage))];

    return {
      category: { 
        labels: categories, 
        previsto: categories.map(c => BUDGET_DATA.filter(i => i.type === c).reduce((acc, i) => acc + (i.value || 0), 0)),
        executado: categories.map(c => ledgerEntries.filter(e => e.category === c).reduce((acc, e) => acc + e.amount, 0))
      },
      month: { labels: Array.from(monthlyMap.keys()).sort(), executado: Array.from(monthlyMap.values()) },
      group: { 
        labels: groups,
        previsto: groups.map(g => BUDGET_DATA.filter(i => i.group === g).reduce((acc, i) => acc + (i.value || 0), 0)),
        executado: groups.map(g => {
          return ledgerEntries.reduce((acc, e) => {
            const item = BUDGET_DATA.find(i => i.id === e.itemCode);
            return item?.group === g ? acc + e.amount : acc;
          }, 0);
        })
      },
      stage: { 
        labels: stages,
        previsto: stages.map(s => BUDGET_DATA.filter(i => i.stage === s).reduce((acc, i) => acc + (i.value || 0), 0)),
        executado: stages.map(s => {
          return ledgerEntries.reduce((acc, e) => {
            const item = BUDGET_DATA.find(i => i.id === e.itemCode);
            return item?.stage === s ? acc + e.amount : acc;
          }, 0);
        })
      }
    };
  }, [ledgerEntries]);

  if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-[#00735C]">Iniciando SEDS...</div>;
  if (!user && !isDemoMode) return <Login onDemoMode={() => setIsDemoMode(true)} showToast={showToast} />;

  // --- O BLOCO QUE VOCÊ ESTAVA EM DÚVIDA COMEÇA AQUI ---
  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Topo com Usuário e Sair */}
        <div className="flex justify-end mb-4 gap-4 items-center">
          <div className="flex items-center gap-2 text-slate-500 bg-white px-3 py-1 rounded-full border text-xs font-bold">
             <UserIcon size={12} /> {user?.email || 'Modo Visualização'}
          </div>
          <button onClick={() => signOut(auth)} className="text-red-600 text-xs font-bold hover:bg-red-50 p-1 px-3 rounded-full transition-all">Sair</button>
        </div>

        <Header onExportCSV={handleExportCSV} />

        <div className="mb-8 flex gap-3">
          <button onClick={() => setActiveTab('entry')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'entry' ? 'bg-[#00735C] text-white shadow-lg' : 'bg-white text-[#00735C] border'}`}>
            Incluir Registros
          </button>
          <button onClick={() => setActiveTab('report')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'report' ? 'bg-[#00735C] text-white shadow-lg' : 'bg-white text-[#00735C] border'}`}>
            Ambiente do Relatório
          </button>
        </div>

        {activeTab === 'entry' ? (
          <div className="max-w-4xl mx-auto">
            <ExpenseForm onAdd={handleAddEntry} showToast={showToast} />
          </div>
        ) : (
          <div className="space-y-10">
            <SummaryCards {...totals} totalRecords={ledgerEntries.length} lastAudit="-" criticalItems={0} />
            
            <div className="w-full">
              <Charts categoryData={chartData.category} monthData={chartData.month} groupData={chartData.group} stageData={chartData.stage} />
            </div>
              
              <Ledger 
              entries={ledgerEntries} 
              onEdit={(entry) => setEditingEntry(entry)} 
              onDelete={handleDeleteEntry}
              onStatusChange={handleStatusChange}
              canDelete={user?.uid === ADMIN_UID} 
            />
            <div className="w-full">
               <BudgetStatus entries={ledgerEntries} />
            </div>
           
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
