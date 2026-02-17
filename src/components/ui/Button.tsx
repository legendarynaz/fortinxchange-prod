import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'buy' | 'sell';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-50 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-500',
    secondary: 'bg-sky-100 hover:bg-sky-200 text-sky-800 focus:ring-sky-500',
    buy: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    sell: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;