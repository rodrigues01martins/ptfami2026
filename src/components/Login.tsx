import React from 'react';
import { LogIn } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface LoginProps {
  onDemoMode?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onDemoMode }) => {
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      let message = 'Ocorreu um erro ao tentar logar.';
      
      if (err.code === 'auth/unauthorized-domain') {
        message = 'Este domínio não está autorizado no seu Console do Firebase. Adicione o domínio da URL atual em "Authentication > Settings > Authorized domains".';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'O popup foi bloqueado pelo navegador. Por favor, permita popups ou abra o app em uma nova aba.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'O login com Google não está ativado no seu Console do Firebase.';
      } else {
        message = `Erro: ${err.message || 'Falha na autenticação'}`;
      }
      
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-[#00735C] p-8 text-center text-white">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide text-white/90">
            SEDS • Governo de Goiás
          </div>
          <h1 className="text-2xl font-bold mb-2">Plano de Trabalho 02/2026</h1>
          <p className="text-white/80 text-sm">Monitoramento e Avaliação Financeira</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Bem-vindo</h2>
            <p className="text-slate-500 text-sm">Acesse o sistema utilizando sua conta institucional ou autorizada.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs leading-relaxed">
              <p className="font-bold mb-1">Erro de Autenticação:</p>
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Entrar com Google
            </button>

            {onDemoMode && (
              <button 
                onClick={onDemoMode}
                className="w-full flex items-center justify-center gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 font-medium py-2.5 rounded-xl transition-all text-sm"
              >
                Acesso Rápido (Modo Demo)
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Se a janela de login não abrir, clique no ícone de <strong>"Abrir em nova aba"</strong> no topo da tela e tente novamente.
          </p>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
              Secretaria de Estado de Desenvolvimento Social
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
