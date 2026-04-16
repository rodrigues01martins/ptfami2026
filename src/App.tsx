import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, 
  doc, query, orderBy 
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Importação dos seus componentes
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { Charts } from './components/Charts';
import { ExpenseForm } from './components/ExpenseForm';
import { Ledger } from './components/Ledger';
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

  // Busca de dados no Firestore (Ordenado por data de lançamento)
  useEffect(() => {
    if (!user && !isDemoMode) return;
    const q = query(collection(db, 'ledger'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      } as LedgerEntry));
      setLedgerEntries(data);
    });
    return () => unsubscribe();
  }, [user, isDemoMode]);

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  const handleLogout = () => signOut(auth);

  // --- EXPORTAÇÃO CSV CORRIGIDA E COMPLETA ---
  const handleExportCSV = () => {
    if (ledgerEntries.length === 0) return showToast("Sem dados para exportar.");
    
    // Cabeçalhos com nomes claros e todos os campos
    const headers = "Data Lancamento;Data Despesa;Item;Fornecedor;NF;Valor;Categoria;Descricao;Status\n";
    
    const rows = ledgerEntries.map(e => {
      const dataLancamento = new Date(e.createdAt).toLocaleDateString('pt-BR');
      const valorFormatado = e.amount.toString().replace('.', ',');
      return `${dataLancamento};${e.date};${e.itemCode};${e.supplier};${e.nf || ''};${valorFormatado};${e.category};${e.description || ''};${e.approvalStatus || 'Pendente'}`;
    }).join("\n");
    
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_SEDS_FAMI_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    link.click();
  };

  // --- ADICIONAR REGISTRO ---
  const handleAddEntry = async (data: Omit<LedgerEntry, 'id' | 'createdAt' | 'authorUid' | 'category'>) => {
    try {
      const item = BUDGET_DATA.find(i => i.id === data.itemCode);
      const newEntry = {
        ...data,
        category: item?.type || 'Outros',
        createdAt: new Date().toISOString(), // DATA AUTOMÁTICA
        authorUid: user?.uid || 'demo-user'
      };
      await addDoc(collection(db, 'ledger'), newEntry);
      showToast("Registro incluído com sucesso!");
      setActiveTab('report');
    } catch (e) {
      showToast("Erro ao gravar no banco de dados.");
    }
  };

  // --- EDITAR REGISTRO ---
  const handleUpdateEntry = async (id: string, data: Partial<LedgerEntry>) => {
    try {
      const docRef = doc(db, 'ledger', id);
      await updateDoc(docRef, data);
      setEditingEntry(null);
      showToast("Registro atualizado!");
    } catch (e) {
      showToast("Erro ao atualizar.");
    }
  };

  // --- EXCLUIR REGISTRO (COM TRAVA DE ADMIN) ---
  const handleDeleteEntry = async (id: string) => {
    if (user?.uid !== ADMIN_UID) {
      showToast("Acesso negado: Apenas administradores podem excluir.");
      return;
    }
    
    if (window.confirm("Tem certeza que deseja excluir definitivamente este registro?")) {
      try {
        await deleteDoc(doc(db, 'ledger', id));
        showToast("Registro removido.");
      } catch (e) {
        showToast("Erro ao excluir.");
      }
    }
  };

  // Cálculos de Totais para os Cards
  const totals = useMemo(() => {
    const totalOrçado = BUDGET_DATA.reduce((acc, curr) => acc + curr.originalValue, 0);
    const totalExecutado = ledgerEntries.reduce((acc, curr) => acc + curr.amount, 0);
    return {
      totalOrçado,
      totalExecutado,
      saldo: totalOrçado - totalExecutado
    };
  }, [ledgerEntries]);

  // Lógica de Gráficos (Agrupado por Data da Despesa)
  const chartData = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    ledgerEntries.forEach(e => {
      const parts = e.date.split('/'); 
      if (parts.length === 3) {
        const label = `${parts[1]}/${parts[2]}`; // MM/AAAA
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

  if (!isAuthReady) return null;
  if (!user && !isDemoMode) return <Login onDemoMode={() => setIsDemoMode(true)} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header onExportCSV={handleExportCSV} />
        
        {/* Navegação por Abas */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('entry')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'entry' 
                ? 'bg-[#00735C] text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Incluir Registro
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'report' 
                ? 'bg-[#00735C] text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Ambiente de Relatório
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-600 font-bold text-sm px-4 py-2 transition-colors"
          >
            Sair do Sistema
          </button>
        </div>

        {activeTab === 'entry' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ExpenseForm onAdd={handleAddEntry} showToast={showToast} />
            </div>
            <div>
              <BudgetStatus totalOrçado={totals.totalOrçado} totalExecutado={totals.totalExecutado} />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <SummaryCards 
              totalOrçado={totals.totalOrçado} 
              totalExecutado={totals.totalExecutado} 
              saldo={totals.saldo}
              totalRecords={ledgerEntries.length}
            />
            
            <Charts 
              monthData={chartData.month} 
              categoryData={{ labels: [], values: [] }} // Pode expandir conforme precisar
            />
            
            <Ledger 
              entries={ledgerEntries} 
              onEdit={setEditingEntry} 
              onDelete={handleDeleteEntry}
              canDelete={user?.uid === ADMIN_UID} // ENVIA A PERMISSÃO PARA O COMPONENTE
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

      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
}
