
import React from 'react';

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.43-7.292a1.012 1.012 0 0 1 1.621-.321l4.225 3.307a.994.994 0 0 0 1.282 0l4.225-3.307a1.012 1.012 0 0 1 1.621.321l4.43 7.292a1.012 1.012 0 0 1 0 .639l-4.43 7.292a1.012 1.012 0 0 1-1.621-.321l-4.225-3.307a.994.994 0 0 0-1.282 0l-4.225-3.307a1.012 1.012 0 0 1-1.621-.321Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export default EyeIcon;