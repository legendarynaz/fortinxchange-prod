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
      <img
        src="/logo.png"
        alt="4ortin-X"
        width={icon}
        height={icon}
        className="drop-shadow-lg object-contain"
      />

      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-white ${text}`}>
            4ortin-X
          </span>
          <span className="text-gray-500 text-xs tracking-wider">
            DIGITAL XCHANGE
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
  <img
    src="/logo.png"
    alt="4ortin-X"
    width={size}
    height={size}
    className={`object-contain ${className}`}
  />
);

export default Logo;
