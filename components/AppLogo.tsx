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
      viewBox="0 0 100 100" 
      className={`shrink-0 select-none ${className}`}
      style={style}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Background Gradient for Squircle */}
        <linearGradient id="sqGradIconComp" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#0072FF" />
          <stop offset="45%" stopColor="#0055F6" />
          <stop offset="100%" stopColor="#0038B8" />
        </linearGradient>

        {/* Top-Right Fold Flap Gradient */}
        <linearGradient id="foldGradIconComp" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Under-Fold Shadow Gradient */}
        <linearGradient id="foldShadowGradIconComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#001a4d" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#001a4d" stopOpacity="0" />
        </linearGradient>

        {/* 3D Shadow for Dollar Sign */}
        <filter id="dollarShadowIconComp" x="-30%" y="-30%" width="170%" height="170%">
          <feDropShadow dx="2" dy="3.5" stdDeviation="2" floodColor="#001438" floodOpacity="0.55" />
        </filter>

        {/* Outer Squircle Shadow */}
        <filter id="sqShadowIconComp" x="-15%" y="-15%" width="135%" height="135%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#0055F6" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* Squircle Base with Shadow */}
      <rect x="6" y="6" width="88" height="88" rx="22" ry="22" fill="url(#sqGradIconComp)" filter="url(#sqShadowIconComp)" />
      
      {/* Subtle Inner Border Highlight */}
      <rect x="7" y="7" width="86" height="86" rx="21" ry="21" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />

      {/* Top-Right Page Fold Shadow */}
      <path d="M 68 7 L 68 34 Q 68 36 71 36 L 93 36 Z" fill="url(#foldShadowGradIconComp)" />

      {/* Top-Right Page Fold Flap */}
      <path d="M 68 7 L 68 33 Q 68 36 72 36 L 93 36 Q 87 19 68 7 Z" fill="url(#foldGradIconComp)" />
      <path d="M 68 7 L 68 33 Q 68 36 72 36 L 93 36" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />

      {/* 3D Dollar Sign Symbol ($) */}
      <g filter="url(#dollarShadowIconComp)">
        {/* Central Vertical Bar */}
        <rect x="47" y="22" width="6" height="56" rx="3" fill="#FFFFFF" />

        {/* Dollar S Path */}
        <path 
          d="M 63 36 
             C 63 30, 58 27, 50 27 
             C 42 27, 37 31, 37 36 
             C 37 41, 41 44, 48 46 
             L 53 47 
             C 59 49, 63 51, 63 57 
             C 63 64, 57 68, 49 68 
             C 41 68, 36 63, 35 56 
             L 42 56 
             C 42 60, 45 63, 49 63 
             C 53 63, 57 61, 57 57 
             C 57 53, 53 51, 47 49 
             L 42 48 
             C 36 46, 31 43, 31 36 
             C 31 29, 37 23, 49 23 
             C 57 23, 62 27, 63 36 
             Z" 
          fill="#FFFFFF" 
        />
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
