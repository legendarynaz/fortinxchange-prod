import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  className?: string;
  showVersion?: boolean;
}

const Footer: React.FC<FooterProps> = ({ className = '', showVersion = false }) => {
  return (
    <footer className={`text-center text-gray-500 text-xs py-4 ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-1">
        <Shield size={12} className="text-[#F0B90B]" />
        <span>Non-Custodial & Secure</span>
      </div>
      {showVersion && <p className="text-gray-600 mb-1">4ortin-X Wallet v1.0.0</p>}
      <p className="text-gray-600">© 2026 4ortin-X. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
