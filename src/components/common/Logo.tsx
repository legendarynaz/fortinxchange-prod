import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 32, text: 'text-lg' },
  md: { icon: 48, text: 'text-xl' },
  lg: { icon: 72, text: 'text-2xl' },
  xl: { icon: 96, text: 'text-3xl' },
};

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = false, className = '' }) => {
  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0B90B" />
            <stop offset="50%" stopColor="#F8D12F" />
            <stop offset="100%" stopColor="#FFE066" />
          </linearGradient>
          <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A1A2E" />
            <stop offset="100%" stopColor="#0D1117" />
          </linearGradient>
          <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#F0B90B" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Outer shield shape */}
        <path
          d="M50 5 L90 20 L90 50 C90 72 72 88 50 95 C28 88 10 72 10 50 L10 20 Z"
          fill="url(#logoGradient)"
          filter="url(#logoShadow)"
        />

        {/* Inner dark area */}
        <path
          d="M50 15 L80 27 L80 50 C80 67 66 80 50 85 C34 80 20 67 20 50 L20 27 Z"
          fill="url(#innerGradient)"
        />

        {/* Stylized "F" with crypto/blockchain feel */}
        <g fill="#F0B90B">
          {/* Main F stem */}
          <rect x="35" y="32" width="8" height="36" rx="2" />
          
          {/* Top horizontal of F */}
          <rect x="35" y="32" width="25" height="7" rx="2" />
          
          {/* Middle horizontal of F */}
          <rect x="35" y="46" width="18" height="6" rx="2" />
          
          {/* Decorative elements - blockchain nodes */}
          <circle cx="65" cy="35" r="4" opacity="0.8" />
          <circle cx="58" cy="52" r="3" opacity="0.6" />
          
          {/* Connection lines */}
          <path 
            d="M60 35 L65 35 M53 49 L58 52" 
            stroke="#F0B90B" 
            strokeWidth="2" 
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>

        {/* Subtle glow ring */}
        <path
          d="M50 10 L85 23 L85 50 C85 70 69 84 50 90 C31 84 15 70 15 50 L15 23 Z"
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-white ${text}`}>
            4ortin-X
          </span>
          <span className="text-gray-500 text-xs tracking-wider">
            WALLET
          </span>
        </div>
      )}
    </div>
  );
};

// Simple icon version for TopBar
export const LogoIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 32, 
  className = '' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F0B90B" />
        <stop offset="100%" stopColor="#F8D12F" />
      </linearGradient>
    </defs>

    {/* Shield background */}
    <path
      d="M50 5 L90 20 L90 50 C90 72 72 88 50 95 C28 88 10 72 10 50 L10 20 Z"
      fill="url(#iconGradient)"
    />

    {/* Inner dark */}
    <path
      d="M50 15 L80 27 L80 50 C80 67 66 80 50 85 C34 80 20 67 20 50 L20 27 Z"
      fill="#0D1117"
    />

    {/* F letter */}
    <g fill="#F0B90B">
      <rect x="35" y="32" width="8" height="36" rx="2" />
      <rect x="35" y="32" width="25" height="7" rx="2" />
      <rect x="35" y="46" width="18" height="6" rx="2" />
      <circle cx="65" cy="35" r="4" opacity="0.8" />
      <circle cx="58" cy="52" r="3" opacity="0.6" />
    </g>
  </svg>
);

export default Logo;
