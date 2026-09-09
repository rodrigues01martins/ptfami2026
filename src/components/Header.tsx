import React from 'react';
import { Home } from 'lucide-react';

interface HeaderProps {
  onExportCSV: () => void;
  showExportCSV: boolean;
  showGestao: boolean;
  onGestaoClick: () => void;
  onHomeClick: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onExportCSV, showExportCSV, showGestao, onGestaoClick, onHomeClick, onSignOut,
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[1440px] mx-auto h-24 px-6 md:px-10 flex items-center justify-between gap-6">

        {/* ── Marcas ── */}
        <div className="flex items-center gap-4 shrink-0">
          <img src="/logo-seds-goias.png" alt="SEDS · Governo de Goiás" className="h-10 w-auto object-contain" />
        </div>

        {/* ── Ações ── */}
        <nav className="flex items-center gap-6">
          <button
            onClick={onHomeClick}
            title="Início"
            className="text-slate-700 hover:text-[#007770] transition-colors"
          >
            <Home size={20} />
          </button>
          {showExportCSV && (
            <button
              onClick={onExportCSV}
              className="text-sm font-semibold text-slate-700 hover:text-[#007770] transition-colors whitespace-nowrap"
            >
              Exportar Registros (CSV)
            </button>
          )}
          {showGestao && (
            <button
              onClick={onGestaoClick}
              className="text-sm font-semibold text-slate-700 hover:text-[#007770] transition-colors whitespace-nowrap"
            >
              Gestão de Usuários
            </button>
          )}

          <button
            onClick={onSignOut}
            className="text-red-600 text-xs font-bold uppercase hover:bg-red-50 p-1 px-3 rounded-full transition-all whitespace-nowrap"
          >
            Sair
          </button>
        </nav>

      </div>
    </header>
  );
};
