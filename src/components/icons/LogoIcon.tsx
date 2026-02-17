
import React from 'react';

const LogoIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0L32 16L16 32L0 16L16 0Z" fill="url(#paint0_linear_1_2)"/>
    <path d="M16 5.5L26.5 16L16 26.5L5.5 16L16 5.5Z" fill="url(#paint1_linear_1_2)"/>
    <defs>
      <linearGradient id="paint0_linear_1_2" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00A1FF"/>
        <stop offset="1" stopColor="#0045FF"/>
      </linearGradient>
      <linearGradient id="paint1_linear_1_2" x1="16" y1="5.5" x2="16" y2="26.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#161B22"/>
      </linearGradient>
    </defs>
  </svg>
);

export default LogoIcon;