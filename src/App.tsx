import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
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
import { LedgerEntry } from './types';
import { User as UserIcon } from 'lucide-react';
import RelatorioFinal from './components/RelatorioFinal';
import { UserManagement } from './components/UserManagement';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  // ── activeTab com as 3 abas (declarado UMA única vez) ──
  const [activeTab, setActiveTab] = useState<'entry' | 'report' | 'relatorio' | 'gestao'>('entry');
  const [filterStatus, setFilterStatus] = useState<LedgerEntry['approvalStatus'] | 'Todos'>('Todos');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [canAccessRelatorio, setCanAccessRelatorio] = useState(false);

  const ADMIN_UIDS = ["lba3ydI19fPRDIXF09zXFI7oV8x2", "DfGvSS1g2oPlbLf5y0zazf9LYSx2", "zTGXyZqsYghjUSfg0ptoEFKiCCc2"];
  const isAdmin = user ? ADMIN_UIDS.includes(user.uid) : false;

  // Lê permissão canAccessRelatorio do Firestore para o usuário logado
  useEffect(() => {
    if (!user) { setCanAccessRelatorio(false); return; }
    if (isAdmin) { setCanAccessRelatorio(true); return; }
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef).then(snap => {
      setCanAccessRelatorio(snap.exists() && snap.data()?.canAccessRelatorio === true);
    }).catch(() => setCanAccessRelatorio(false));
  }, [user, isAdmin]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      // Auto-cria documento em /users/{uid} se não existir
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || '',
            role: 'user',
            canAccessRelatorio: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user && !isDemoMode) return;
    const q = query(collection(db, 'ledger'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LedgerEntry));
      setLedgerEntries(data);
    }, (error) => console.error("Erro Firestore:", error));
    return () => unsubscribe();
  }, [user, isDemoMode]);

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  const handleExportCSV = () => {
    if (ledgerEntries.length === 0) return showToast("Não há dados para exportar.");
    const headers = [
      "Data Lançamento", "Data Despesa", "Código Item",
      "Fornecedor", "NF", "Valor", "Categoria",
      "Grupo", "Etapa", "Status", "Descrição"
    ].join(";");
    const rows = ledgerEntries.map(e => {
      const lancamento = e.createdAt ? new Date(e.createdAt).toLocaleDateString('pt-BR') : '---';
      const valorExcel = (Number(e.amount) || 0).toFixed(2).replace('.', ',');
      const esc = (v: string | undefined | null) => {
        const s = String(v ?? '');
        return s.includes(';') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"` : s;
      };
      return [
        lancamento, esc(e.date), esc(e.itemCode),
        esc(e.supplier), esc(e.nf), valorExcel,
        esc(e.category), esc(e.group), esc(e.stage),
        esc(e.approvalStatus), esc(e.description)
      ].join(";");
    });
    const csvContent = "\ufeff" + headers + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_SEDS_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("CSV exportado com sucesso!");
  };

  const handleAddEntry = async (data: any) => {
    try {
      const item = BUDGET_DATA.find(i => i.id === data.itemCode);
      await addDoc(collection(db, 'ledger'), {
        ...data,
        category: item?.type || 'Outros',
        group: item?.group || '',
        stage: item?.stage || '',
        approvalStatus: 'Em analise',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorUid: user?.uid || 'demo-user'
      });
      showToast("Registro salvo!");
    } catch (e) { showToast("Erro ao gravar."); }
  };

  const handleUpdateEntry = async (updated: LedgerEntry) => {
    try {
      const { id, ...dataToSave } = updated;
      await updateDoc(doc(db, 'ledger', id), {
        ...dataToSave,
        updatedAt: new Date().toISOString()
      });
      setEditingEntry(null);
      showToast("Atualizado com sucesso!");
    } catch (e) { showToast("Erro ao atualizar."); }
  };

  const handleStatusChange = async (id: string, status: LedgerEntry['approvalStatus']) => {
    if (!isAdmin) return showToast("Acesso negado.");
    try {
      await updateDoc(doc(db, 'ledger', id), {
        approvalStatus: status,
        updatedAt: new Date().toISOString()
      });
      showToast(`Status: ${status}`);
    } catch (e) { showToast("Erro ao atualizar status."); }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!isAdmin) return showToast("Acesso negado.");
    if (window.confirm("Deseja realmente excluir?")) {
      try {
        await deleteDoc(doc(db, 'ledger', id));
        showToast("Removido.");
      } catch (e) { showToast("Erro ao excluir."); }
    }
  };

  const handleUpdateAuditComment = async (id: string, comment: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'ledger', id), {
        auditComment: comment,
        updatedAt: new Date().toISOString()
      });
      showToast("Observação salva.");
    } catch (e) { showToast("Erro ao salvar observação."); }
  };

  const totals = useMemo(() => {
    const totalOrcado = BUDGET_DATA.reduce((acc, i) => acc + (i.value || 0), 0);
    const totalExecutado = ledgerEntries.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const criticalItems = BUDGET_DATA.filter(item => {
      const gasto = ledgerEntries
        .filter(e => String(e.itemCode).trim() === String(item.id).trim())
        .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const saldo = item.value - gasto;
      return saldo <= 0 || saldo / item.value <= 0.1;
    }).length;
    const lastTs = ledgerEntries.reduce<string>((latest, entry) => {
      const ts = entry.updatedAt || entry.createdAt || '';
      if (!ts) return latest;
      if (!latest) return ts;
      return ts > latest ? ts : latest;
    }, '');
    const lastAudit = lastTs
      ? new Date(lastTs).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '-';
    return {
      totalOrcado, totalExecutado,
      totalSaldo: totalOrcado - totalExecutado,
      percentTotal: totalOrcado > 0 ? (totalExecutado / totalOrcado) * 100 : 0,
      criticalItems, lastAudit,
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
    const groups    = [...new Set(BUDGET_DATA.map(i => i.group))];
    const stages    = [...new Set(BUDGET_DATA.map(i => i.stage))];
    return {
      category: {
        labels: categories,
        previsto: categories.map(c => BUDGET_DATA.filter(i => i.type === c).reduce((acc, i) => acc + (i.value || 0), 0)),
        executado: categories.map(c => ledgerEntries.filter(e => e.category === c).reduce((acc, e) => acc + e.amount, 0))
      },
      month: {
        labels: Array.from(monthlyMap.keys()).sort(),
        executado: Array.from(monthlyMap.values())
      },
      group: {
        labels: groups,
        previsto: groups.map(g => BUDGET_DATA.filter(i => i.group === g).reduce((acc, i) => acc + (i.value || 0), 0)),
        executado: groups.map(g => ledgerEntries.reduce((acc, e) => BUDGET_DATA.find(i => i.id === e.itemCode)?.group === g ? acc + e.amount : acc, 0))
      },
      stage: {
        labels: stages,
        previsto: stages.map(s => BUDGET_DATA.filter(i => i.stage === s).reduce((acc, i) => acc + (i.value || 0), 0)),
        executado: stages.map(s => ledgerEntries.reduce((acc, e) => BUDGET_DATA.find(i => i.id === e.itemCode)?.stage === s ? acc + e.amount : acc, 0))
      }
    };
  }, [ledgerEntries]);

  if (!isAuthReady) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-[#00735C]">
      Iniciando SEDS...
    </div>
  );
  if (!user && !isDemoMode) return (
    <Login onDemoMode={() => setIsDemoMode(true)} showToast={showToast} />
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Barra superior ── */}
        <div className="flex justify-end mb-4 gap-4 items-center">
          <div className="flex items-center gap-2 text-slate-500 bg-white px-3 py-1 rounded-full border text-xs font-bold">
            <UserIcon size={12} /> {user?.email || 'Modo Visualização'}
          </div>
          <button
            onClick={() => signOut(auth)}
            className="text-red-600 text-xs font-bold hover:bg-red-50 p-1 px-3 rounded-full transition-all"
          >
            Sair
          </button>
        </div>

        <Header onExportCSV={handleExportCSV} />

        {/* ── Tabs ── */}
        <div className="mb-8 flex gap-3">
          <button
            onClick={() => setActiveTab('entry')}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'entry' ? 'bg-[#00735C] text-white shadow-lg' : 'bg-white text-[#00735C] border'}`}
          >
            Incluir Registros
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'report' ? 'bg-[#00735C] text-white shadow-lg' : 'bg-white text-[#00735C] border'}`}
          >
            Ambiente do Relatório
          </button>
          {/* Aba Gestão de Usuários — visível apenas para admins */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('gestao')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'gestao' ? 'bg-[#00735C] text-white shadow-lg' : 'bg-white text-[#00735C] border'}`}
            >
              Gestão de Usuários
            </button>
          )}

          {/* Aba Relatório Final — visível apenas para admins ou usuários autorizados */}
          {canAccessRelatorio && (
            <button
              onClick={() => setActiveTab('relatorio')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'relatorio' ? 'bg-[#00735C] text-white shadow-lg' : 'bg-white text-[#00735C] border'}`}
            >
              Relatório Final
            </button>
          )}
        </div>

        {/* ── Aba: Incluir Registros ── */}
        {activeTab === 'entry' && (
          <ExpenseForm onAdd={handleAddEntry} showToast={showToast} />
        )}

        {/* ── Aba: Ambiente do Relatório ── */}
        {activeTab === 'report' && (
          <div className="space-y-10">
            <SummaryCards
              totalOrcado={totals.totalOrcado}
              totalExecutado={totals.totalExecutado}
              totalSaldo={totals.totalSaldo}
              percentTotal={totals.percentTotal}
              totalRecords={ledgerEntries.length}
              lastAudit={totals.lastAudit}
              criticalItems={totals.criticalItems}
            />
            <div className="w-full">
              <Charts
                categoryData={chartData.category}
                monthData={chartData.month}
                groupData={chartData.group}
                stageData={chartData.stage}
              />
            </div>
            <Ledger
              entries={ledgerEntries}
              onEdit={(entry) => setEditingEntry(entry)}
              onDelete={handleDeleteEntry}
              onStatusChange={handleStatusChange}
              onUpdateComment={handleUpdateAuditComment}
              canDelete={isAdmin}
              isAdmin={isAdmin}
            />
            <div className="w-full">
              <BudgetStatus entries={ledgerEntries} />
            </div>
          </div>
        )}

        {/* ── Aba: Gestão de Usuários — acesso restrito a admins ── */}
        {activeTab === 'gestao' && isAdmin && (
          <UserManagement currentUserUid={user?.uid || ''} adminUids={ADMIN_UIDS} />
        )}

        {/* ── Aba: Relatório Final — acesso restrito a admins ou usuários autorizados ── */}
        {activeTab === 'relatorio' && canAccessRelatorio && (
          <RelatorioFinal onBack={() => setActiveTab('entry')} />
        )}
        {activeTab === 'relatorio' && !canAccessRelatorio && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">Acesso restrito</h2>
            <p className="text-slate-400 text-sm">Esta seção é exclusiva para administradores do sistema.</p>
          </div>
        )}

      </div>

      {editingEntry && (
        <EditModal
          isOpen={true}
          onClose={() => setEditingEntry(null)}
          entry={editingEntry}
          onSave={handleUpdateEntry}
          getSpentForItem={(code, id) =>
            ledgerEntries
              .filter(e => e.itemCode === code && e.id !== id)
              .reduce((acc, e) => acc + e.amount, 0)
          }
        />
      )}
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
}

export default App;
