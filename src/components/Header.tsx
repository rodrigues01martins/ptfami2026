import React from 'react';

interface HeaderProps {
  onExportCSV: () => void;
  showGestao: boolean;
  onGestaoClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExportCSV, showGestao, onGestaoClick }) => {
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
        </nav>

      </div>
    </header>
  );
};
