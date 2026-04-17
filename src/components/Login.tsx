import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserSessionPersistence 
} from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, Mail, Lock } from 'lucide-react';

interface LoginProps {
  showToast: (message: string) => void;
}

export const Login: React.FC<LoginProps> = ({ showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔐 Define a persistência para a sessão do navegador
      // Isso força o logout quando a aba ou o browser é fechado
      await setPersistence(auth, browserSessionPersistence);
      
      // Realiza o login após definir a persistência
      await signInWithEmailAndPassword(auth, email, password);
      
      showToast("Acesso autorizado! Bem-vindo.");
    } catch (error: any) {
      console.error("Erro de login:", error);
      showToast("E-mail ou senha incorretos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-[#00735C]/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#00735C]">
            <LogIn size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SEDS</h1>
          </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[14px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Mail size={12} /> E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#00735C] transition-all"
              placeholder="E-mail"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} /> Palavra-passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#00735C] transition-all"
              placeholder="*******"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#00735C] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#00735C]/20 transition-all hover:bg-[#005c4a] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'A autenticar...' : 'Entrar no Sistema'}
          </button>
        </form>
        
        <p className="text-center text-[10px] text-slate-400 mt-8 uppercase tracking-widest">
          Acesso Restrito • Monitoramento Técnico SEDS
        </p>
      </div>
    </div>
  );
};
