import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`text-center text-gray-500 text-sm ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Shield size={14} className="text-[#F0B90B]" />
        <span>Non-Custodial & Secure</span>
      </div>
      
      <div className="flex items-center justify-center gap-4 mb-3">
        <Link 
          to="/terms" 
          className="hover:text-[#F0B90B] transition-colors underline underline-offset-2"
        >
          Terms of Service
        </Link>
        <span>•</span>
        <Link 
          to="/privacy" 
          className="hover:text-[#F0B90B] transition-colors underline underline-offset-2"
        >
          Privacy Policy
        </Link>
      </div>
      
      <p className="text-gray-600">
        © {currentYear} 4ortin-X. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
