import React from 'react';

const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.28c-1.247.094-2.267.66-3.097 1.402l-2.015 2.015a1.125 1.125 0 0 1-1.591 0l-2.015-2.015c-.83-.742-1.85-1.308-3.097-1.402l-3.722-.28A2.122 2.122 0 0 1 3 14.894V10.608c0-.97.616-1.813 1.5-2.097L6.6 8.243a1.125 1.125 0 0 1 .843.044l1.963.982a1.125 1.125 0 0 0 1.094 0l1.963-.982a1.125 1.125 0 0 1 .843-.044l2.1-1.05Z" />
    </svg>
);

export default ChatBubbleIcon;
