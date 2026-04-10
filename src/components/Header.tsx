import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  onExportCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExportCSV }) => {
  return (
    <header className="mb-8 rounded-3xl overflow-hidden shadow-lg border border-[#00735C]">
      {/* Barra Verde Institucional */}
      <div className="bg-[#00735C] px-6 py-6 md:px-8 md:py-7 flex flex-col xl:flex-row xl:items-center justify-between gap-6 text-white">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide text-white/90">
            SEDS • Governo de Goiás
          </div>
          <p className="text-sm text-white/85 mb-1">Secretaria de Estado de Desenvolvimento Social</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Plano de Trabalho 02/2026</h1>
          <p className="font-medium text-lg text-white/90">Monitoramento e Avaliação</p>
        </div>
        
        <div className="flex items-center gap-6 self-start xl:self-auto">
          {/* Logo SEDS */}
          <div className="h-12 md:h-16 flex items-center justify-center">
             <img 
               src="/logo-seds.png" 
               alt="Logo SEDS" 
               className="h-full w-auto object-contain"
               referrerPolicy="no-referrer"
             />
          </div>
          {/* Logo GOIÁS SOCIAL */}
          <div className="h-12 md:h-16 flex items-center justify-center border-l border-white/20 pl-6">
            <img 
              src="/logo-goias-social.png" 
              alt="Logo Goiás Social" 
              className="h-full w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Barra de Ações (Apenas CSV) */}
      <div className="bg-white px-6 py-4 md:px-8 flex flex-wrap gap-3">
        <button 
          className="bg-[#00735C] hover:bg-[#005b49] text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-lg text-sm flex items-center gap-2"
          onClick={onExportCSV}
        >
          <FileSpreadsheet size={16} /> Exportar Registros (CSV)
        </button>
      </div>
    </header>
  );
};
  );
};
