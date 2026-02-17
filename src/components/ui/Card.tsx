import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', padding = 'p-4' }) => {
  return (
    <div className={`bg-white border border-slate-200/80 rounded-lg shadow-sm ${padding} ${className}`}>
      {children}
    </div>
  );
};

export default Card;