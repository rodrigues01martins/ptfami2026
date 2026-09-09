import React from 'react';
import { User as UserIcon } from 'lucide-react';

interface HeaderProps {
  onExportCSV: () => void;
  showGestao: boolean;
  onGestaoClick: () => void;
  userEmail: string;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onExportCSV, showGestao, onGestaoClick, userEmail, onSignOut,
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[1440px] mx-auto h-24 px-6 md:px-10 flex items-center justify-between gap-6">

        {/* ── Marcas ── */}
        <div className="flex items-center gap-4 shrink-0">
          <img src="/logo-seds.png" alt="SEDS · Governo de Goiás" className="h-10 w-auto object-contain" />
        </div>

        {/* ── Ações ── */}
        <nav className="flex items-center gap-6">
          <button
            onClick={onExportCSV}
            className="text-sm font-medium text-slate-700 hover:text-[#007770] transition-colors whitespace-nowrap"
          >
            Exportar Registros (CSV)
          </button>
          {showGestao && (
            <button
              onClick={onGestaoClick}
              className="text-sm font-medium text-slate-700 hover:text-[#007770] transition-colors whitespace-nowrap"
            >
              Gestão de Usuários
            </button>
          )}

          <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-xs font-bold whitespace-nowrap">
            <UserIcon size={12} /> {userEmail}
          </div>
          <button
            onClick={onSignOut}
            className="text-red-600 text-xs font-bold hover:bg-red-50 p-1 px-3 rounded-full transition-all whitespace-nowrap"
          >
            Sair
          </button>
        </nav>

      </div>
    </header>
  );
};
