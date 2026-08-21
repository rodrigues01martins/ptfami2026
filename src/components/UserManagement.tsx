import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Shield, ShieldOff, FileText, RefreshCw, Search } from 'lucide-react';

interface UserRecord {
  uid: string;
  email: string;
  displayName?: string;
  role: string;
  canAccessRelatorio: boolean;
  createdAt?: string;
}

interface UserManagementProps {
  currentUserUid: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUserUid }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Escuta em tempo real a coleção users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      const data = snap.docs.map(d => ({
        uid: d.id,
        email: d.data().email || '',
        displayName: d.data().displayName || '',
        role: d.data().role || 'user',
        canAccessRelatorio: d.data().canAccessRelatorio === true,
        createdAt: d.data().createdAt || '',
      }));
      setUsers(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleRelatorio = async (uid: string, current: boolean) => {
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { canAccessRelatorio: !current });
      } else {
        // Cria o documento se não existir
        const user = users.find(u => u.uid === uid);
        await setDoc(ref, {
          uid,
          email: user?.email || '',
          role: 'user',
          canAccessRelatorio: !current,
          createdAt: new Date().toISOString(),
        });
      }
      showToast(`Acesso ao Relatório Final ${!current ? 'liberado' : 'revogado'} com sucesso.`);
    } catch (e) {
      showToast('Erro ao atualizar permissão.');
    }
  };

  const toggleRole = async (uid: string, current: string) => {
    if (uid === currentUserUid) return showToast('Você não pode alterar sua própria função.');
    try {
      const newRole = current === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      showToast(`Função alterada para ${newRole}.`);
    } catch (e) {
      showToast('Erro ao alterar função.');
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#00735C]/10 p-2.5 rounded-xl">
          <Users size={28} className="text-[#00735C]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestão de Usuários</h2>
          <p className="text-sm text-slate-500">Gerencie permissões de acesso dos usuários cadastrados</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de usuários', value: users.length, color: 'text-slate-800' },
          { label: 'Administradores', value: users.filter(u => u.role === 'admin').length, color: 'text-[#00735C]' },
          { label: 'Acesso Relatório Final', value: users.filter(u => u.canAccessRelatorio).length, color: 'text-blue-600' },
          { label: 'Sem permissão especial', value: users.filter(u => !u.canAccessRelatorio && u.role !== 'admin').length, color: 'text-slate-400' },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por e-mail ou nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00735C] outline-none"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
          </span>
          {loading && <RefreshCw size={14} className="text-slate-400 animate-spin" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Usuário</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">UID</th>
                <th className="text-center text-xs font-bold text-slate-500 uppercase p-4">Função</th>
                <th className="text-center text-xs font-bold text-slate-500 uppercase p-4">
                  <div className="flex items-center justify-center gap-1">
                    <FileText size={11} /> Relatório Final
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                    Carregando usuários...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                    {users.length === 0
                      ? 'Nenhum usuário encontrado. Os documentos são criados automaticamente no primeiro login de cada usuário.'
                      : 'Nenhum usuário encontrado para a busca.'}
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.uid} className={`hover:bg-slate-50 transition-colors ${u.uid === currentUserUid ? 'bg-[#00735C]/5' : ''}`}>
                    {/* Usuário */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#00735C]/10 flex items-center justify-center text-[#00735C] font-bold text-xs flex-shrink-0">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {u.email}
                            {u.uid === currentUserUid && (
                              <span className="ml-2 px-1.5 py-0.5 bg-[#00735C]/10 text-[#00735C] text-[10px] font-bold rounded-full">você</span>
                            )}
                          </p>
                          {u.displayName && <p className="text-xs text-slate-400">{u.displayName}</p>}
                        </div>
                      </div>
                    </td>

                    {/* UID */}
                    <td className="p-4">
                      <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                        {u.uid.slice(0, 16)}...
                      </span>
                    </td>

                    {/* Função */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleRole(u.uid, u.role)}
                        disabled={u.uid === currentUserUid}
                        title={u.uid === currentUserUid ? 'Não é possível alterar sua própria função' : `Clique para mudar para ${u.role === 'admin' ? 'user' : 'admin'}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all
                          ${u.role === 'admin'
                            ? 'bg-[#00735C]/10 text-[#00735C] hover:bg-[#00735C]/20'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                          ${u.uid === currentUserUid ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {u.role === 'admin' ? <Shield size={11} /> : <ShieldOff size={11} />}
                        {u.role === 'admin' ? 'Admin' : 'Usuário'}
                      </button>
                    </td>

                    {/* Toggle Relatório Final */}
                    <td className="p-4 text-center">
                      {u.role === 'admin' ? (
                        <span className="text-xs text-slate-400 italic">acesso automático</span>
                      ) : (
                        <button
                          onClick={() => toggleRelatorio(u.uid, u.canAccessRelatorio)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                            ${u.canAccessRelatorio ? 'bg-[#00735C]' : 'bg-slate-200'}`}
                          title={u.canAccessRelatorio ? 'Clique para revogar acesso' : 'Clique para liberar acesso'}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                            ${u.canAccessRelatorio ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legenda */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400">
            <strong className="text-slate-500">Toggle verde</strong> = usuário pode acessar o Relatório Final. 
            Admins têm acesso automático independente do toggle.
            Alterações têm efeito imediato no próximo login ou recarregamento do app pelo usuário.
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium z-50 animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
};
