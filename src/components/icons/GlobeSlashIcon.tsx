
import React from 'react';

const GlobeSlashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9M3.78 6.75A9.004 9.004 0 0 1 12 3c1.982 0 3.83.62 5.22 1.66M21 21 3 3" />
    </svg>
);

export default GlobeSlashIcon;
