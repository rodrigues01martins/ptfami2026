import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginProps {
  onDemoMode: () => void;
}

export const Login: React.FC<LoginProps> = ({ onDemoMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-bold text-[#00735C] text-center mb-6">Acessar</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="E-mail Institucional"
            className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-[#00735C]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-[#00735C]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-600 text-xs font-bold">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00735C] text-white font-bold py-3 rounded-xl hover:bg-[#005c4a] transition-all"
          >
            {loading ? 'Acessando...' : 'ENTRAR'}
          </button>
        </form>
        <button onClick={onDemoMode} className="w-full text-[#00735C] text-xs font-bold mt-6 hover:underline">
          ENTRAR EM MODO VISUALIZAÇÃO
        </button>
      </div>
    </div>
  );
};
