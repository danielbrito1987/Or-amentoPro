import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
  onClick?: () => void;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  theme = 'dark',
  onClick
}) => {
  const sizeMap = {
    xs: { iconSize: 24, title: 'text-sm', badge: 'text-[8px] px-1 py-0.2', subtitle: 'text-[9px]' },
    sm: { iconSize: 32, title: 'text-lg', badge: 'text-[9px] px-1.5 py-0.5', subtitle: 'text-[10px]' },
    md: { iconSize: 42, title: 'text-xl', badge: 'text-[10px] px-2 py-0.5', subtitle: 'text-[11px]' },
    lg: { iconSize: 56, title: 'text-3xl', badge: 'text-xs px-2.5 py-0.5', subtitle: 'text-xs' },
    xl: { iconSize: 80, title: 'text-4xl', badge: 'text-sm px-3 py-1', subtitle: 'text-sm' }
  };

  const currentSize = sizeMap[size];
  const isDark = theme === 'dark';

  return (
    <div 
      className={`flex items-center gap-3 select-none ${onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Icon: Blue squircle with folded top-right dog-ear corner & 3D white dollar sign */}
      <div 
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: currentSize.iconSize, height: currentSize.iconSize }}
      >
        <svg 
          viewBox="0 0 200 200" 
          width="100%" 
          height="100%" 
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id={`appIconBg_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0077FF" />
              <stop offset="50%" stopColor="#0062FF" />
              <stop offset="100%" stopColor="#0047E6" />
            </linearGradient>

            <linearGradient id={`appFoldGrad_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#70C8FF" />
              <stop offset="40%" stopColor="#3FA6FF" />
              <stop offset="100%" stopColor="#1478FF" />
            </linearGradient>

            <filter id={`appDShadow_${size}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="3" dy="4" stdDeviation="3" floodColor="#00247d" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Main squircle with clipped top-right corner */}
          <path 
            d="M 50 14 
               L 136 14 
               L 186 64 
               L 186 150 
               A 36 36 0 0 1 150 186 
               L 50 186 
               A 36 36 0 0 1 14 150 
               L 14 50 
               A 36 36 0 0 1 50 14 Z" 
            fill={`url(#appIconBg_${size})`} 
          />

          {/* Long diagonal shadow from dollar symbol */}
          <path 
            d="M 100 68 L 138 106 L 148 160 L 108 174 L 84 135 Z" 
            fill="#0035a8" 
            opacity="0.38" 
          />

          {/* Folded paper dog-ear flap */}
          <path 
            d="M 136 14 
               L 186 64 
               L 152 64 
               A 16 16 0 0 1 136 48 Z" 
            fill={`url(#appFoldGrad_${size})`} 
          />

          {/* Dollar Sign ($): Vertical bar */}
          <rect 
            x="94" 
            y="42" 
            width="12" 
            height="116" 
            rx="6" 
            fill="#FFFFFF" 
            filter={`url(#appDShadow_${size})`} 
          />

          {/* Dollar Sign ($): S Curves */}
          <path 
            d="M 126 76
               C 126 62, 114 54, 100 54
               C 86 54, 76 62, 76 75
               C 76 89, 87 95, 101 98
               L 106 100
               C 118 103, 126 108, 126 119
               C 126 131, 115 140, 99 140
               C 83 140, 72 131, 71 117
               L 85 116
               C 86 124, 91 128, 99 128
               C 107 128, 113 124, 113 118
               C 113 108, 104 103, 91 100
               C 77 96, 64 90, 64 76
               C 64 63, 76 49, 99 49
               C 116 49, 128 58, 131 73
               Z"
            fill="#FFFFFF"
            filter={`url(#appDShadow_${size})`} 
          />
        </svg>
      </div>

      {/* Typography: OrçaFácil PRO */}
      {showText && (
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} ${currentSize.title}`}>
              Orça<span className="text-[#005BFF]">Fácil</span>
            </span>
            <span className={`bg-gradient-to-r from-[#0052FF] to-[#0070F3] text-white font-black uppercase tracking-wider rounded-lg shadow-sm ${currentSize.badge}`}>
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
