import React, { useState, useEffect } from 'react';

export const SYSTEM_LOGO_STORAGE_KEY = 'orcafacil_system_official_logo';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
  onClick?: () => void;
  preferSvg?: boolean;
}

/**
 * Componente do Ícone Real OrçaFácil Pro:
 * - Squircle azul royal com gradiente elétrico
 * - Dobra de proposta / folha no canto superior direito (dog-ear flap)
 * - Sombra projetada sob a dobra
 * - Cifrão ($) 3D branco central com sombra diagonal
 */
export const AppLogoIcon: React.FC<{
  className?: string;
  sizePx?: number;
}> = ({ className = 'w-10 h-10', sizePx }) => {
  const style = sizePx ? { width: `${sizePx}px`, height: `${sizePx}px` } : undefined;

  return (
    <svg 
      viewBox="0 0 54 54" 
      className={`shrink-0 select-none ${className}`}
      style={style}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="appLogoSqGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <linearGradient id="appLogoFoldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#BFDBFE" />
        </linearGradient>

        <filter id="appLogoIconGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#2563EB" floodOpacity="0.55" />
        </filter>
      </defs>

      <g transform="translate(2, 2)" filter="url(#appLogoIconGlow)">
        <rect x="0" y="0" width="50" height="50" rx="14" fill="url(#appLogoSqGrad)" />
        <rect x="0.75" y="0.75" width="48.5" height="48.5" rx="13.25" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1.3" />

        {/* Proposal Document Sheet */}
        <path 
          d="M 12 10 L 31 10 L 38 17 L 38 39.5 C 38 41 36.8 42 35 42 L 12 42 C 10.5 42 9.5 41 9.5 39.5 L 9.5 12.5 C 9.5 11 10.5 10 12 10 Z" 
          fill="rgba(255,255,255,0.18)" 
          stroke="rgba(255,255,255,0.6)" 
          strokeWidth="1.3" 
          strokeLinejoin="round" 
        />
        <path d="M 31 10 L 31 17 L 38 17 Z" fill="url(#appLogoFoldGrad)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />

        {/* Document Budget Value Lines */}
        <line x1="14" y1="17" x2="26" y2="17" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="22" x2="22" y2="22" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="27" x2="19" y2="27" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />

        {/* Dynamic Proposal Approval Checkmark Badge */}
        <g transform="translate(23, 21)">
          <circle cx="12" cy="12" r="10.5" fill="#1D4ED8" />
          <circle cx="12" cy="12" r="9.5" fill="#2563EB" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
          <path d="M 7.5 12 L 10.5 15 L 16.5 8.5" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
};

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  theme = 'auto',
  onClick,
  preferSvg = true
}) => {
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SYSTEM_LOGO_STORAGE_KEY);
    if (saved) {
      setCustomLogoUrl(saved);
    }

    const handleLogoUpdate = (e: any) => {
      if (e.detail?.url) {
        setCustomLogoUrl(e.detail.url);
      }
    };
    window.addEventListener('orcafacil:logo-updated', handleLogoUpdate);
    return () => window.removeEventListener('orcafacil:logo-updated', handleLogoUpdate);
  }, []);

  // Se o usuário fez upload customizado no sistema, exibe a imagem customizada
  if (customLogoUrl && !preferSvg) {
    const sizeMap = {
      xs: 'h-6 max-w-[130px]',
      sm: 'h-8 max-w-[170px]',
      md: 'h-10 max-w-[210px]',
      lg: 'h-14 max-w-[280px]',
      xl: 'h-20 max-w-[400px]'
    };
    return (
      <div 
        className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer hover:opacity-95' : ''} ${className}`}
        onClick={onClick}
      >
        <img
          src={customLogoUrl}
          alt="OrçaFácil Pro"
          className={`${sizeMap[size]} object-contain`}
        />
      </div>
    );
  }

  // Tamanhos calibrados para ícone e texto
  const sizeConfig = {
    xs: { iconSize: 'w-6 h-6', textSize: 'text-base', badgeSize: 'text-[9px] px-1.5 py-0.5', gap: 'gap-1.5' },
    sm: { iconSize: 'w-8 h-8', textSize: 'text-xl', badgeSize: 'text-[10px] px-1.5 py-0.5', gap: 'gap-2' },
    md: { iconSize: 'w-10 h-10', textSize: 'text-2xl', badgeSize: 'text-xs px-2 py-0.5', gap: 'gap-2.5' },
    lg: { iconSize: 'w-14 h-14', textSize: 'text-3xl', badgeSize: 'text-sm px-2.5 py-1', gap: 'gap-3' },
    xl: { iconSize: 'w-18 h-18 sm:w-20 sm:h-20', textSize: 'text-4xl sm:text-5xl', badgeSize: 'text-base px-3 py-1', gap: 'gap-4' }
  };

  const current = sizeConfig[size];

  // Apenas ícone
  if (!showText) {
    return (
      <div 
        className={`inline-flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
        onClick={onClick}
      >
        <AppLogoIcon className={current.iconSize} />
      </div>
    );
  }

  // Cores adaptativas do texto
  const isDark = theme === 'dark';
  const orcaTextColor = isDark 
    ? 'text-white drop-shadow-sm' 
    : theme === 'light' 
      ? 'text-slate-900' 
      : 'text-slate-900 dark:text-white';

  const facilTextColor = isDark
    ? 'text-sky-400 drop-shadow-sm'
    : 'text-blue-600 dark:text-sky-400';

  return (
    <div 
      className={`inline-flex items-center select-none ${current.gap} ${onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Ícone Real OrçaFácil com cifrão 3D e aba dobrada */}
      <AppLogoIcon className={current.iconSize} />

      {/* Tipografia Oficial OrçaFácil PRO */}
      <div className="flex items-center gap-2 tracking-tight">
        <span className={`font-black font-sans leading-none ${current.textSize} ${orcaTextColor}`}>
          Orça<span className={facilTextColor}>Fácil</span>
        </span>

        {/* Badge PRO em gradiente azul royal com brilho sutil */}
        <span className={`font-extrabold uppercase tracking-wider rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30 border border-white/20 ${current.badgeSize}`}>
          PRO
        </span>
      </div>
    </div>
  );
};
