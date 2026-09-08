import React from 'react';
import orcaLogo from '../src/assets/images/orcafacil_quote_logo_1788895951950.jpg';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const sizeMap = {
    sm: { img: 'w-7 h-7', title: 'text-base', subtitle: 'text-[10px]' },
    md: { img: 'w-9 h-9', title: 'text-lg', subtitle: 'text-[11px]' },
    lg: { img: 'w-12 h-12', title: 'text-2xl', subtitle: 'text-xs' },
    xl: { img: 'w-20 h-20', title: 'text-3xl', subtitle: 'text-sm' }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative shrink-0 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 ring-1 ring-white/10 ${currentSize.img}`}>
        <img
          src={orcaLogo}
          alt="OrçaFácil Pro"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      {showText && (
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className={`font-black tracking-tight text-white ${currentSize.title}`}>
              Orça<span className="text-blue-500">Fácil</span>
            </span>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm">
              PRO
            </span>
          </div>
          <p className={`text-slate-400 font-medium leading-tight truncate ${currentSize.subtitle}`}>
            Gestão & Orçamentos
          </p>
        </div>
      )}
    </div>
  );
};
