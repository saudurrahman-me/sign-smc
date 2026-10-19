import React from 'react';
import logoTransparent from '../../assets/sign-smc-logo-transparent.png';
import logoWhite from '../../assets/sign-smc-logo-white.png';

interface SignLogoProps {
  variant?: 'full' | 'icon' | 'monogram';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  inverted?: boolean;
  subtitleClassName?: string;
}

export const SignLogo: React.FC<SignLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  inverted = false,
  subtitleClassName = '',
}) => {
  const sizeMap = {
    sm: { imgClass: 'h-9 w-auto', text: 'text-sm', sub: 'text-[8.5px]', gap: 'gap-2.5' },
    md: { imgClass: 'h-11 w-auto', text: 'text-lg', sub: 'text-[9.5px]', gap: 'gap-3' },
    lg: { imgClass: 'h-16 w-auto', text: 'text-2xl', sub: 'text-xs', gap: 'gap-4' },
    xl: { imgClass: 'h-24 w-auto', text: 'text-4xl', sub: 'text-sm', gap: 'gap-5' },
  };

  const dim = sizeMap[size];
  const logoSrc = inverted ? logoWhite : logoTransparent;

  const emblem = (
    <div className="relative flex-shrink-0 flex items-center justify-center transition-transform duration-300 hover:scale-105">
      <img
        src={logoSrc}
        alt="SIGN Neuroscience Emblem"
        aria-label="SIGN Neuroscience Emblem"
        className={`${dim.imgClass} object-contain drop-shadow-sm select-none`}
        loading="eager"
      />
    </div>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{emblem}</div>;
  }

  return (
    <div className={`inline-flex items-center ${dim.gap} select-none ${className}`}>
      {emblem}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-wider ${dim.text} ${
              inverted ? 'text-white' : 'text-[#016533]'
            }`}
          >
            SIGN-SMC
          </span>
        </div>
        <span
          className={`font-medium tracking-wide ${dim.sub} ${
            inverted ? 'text-emerald-100/80' : 'text-slate-600'
          } ${subtitleClassName}`}
        >
          Student Interest Group in Neurology
        </span>
      </div>
    </div>
  );
};

