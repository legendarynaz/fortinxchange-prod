import React from 'react';
import { Shield, Plus, Download } from 'lucide-react';
import Logo from '../common/Logo';
import Footer from '../common/Footer';

interface WelcomeScreenProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreateWallet, onImportWallet }) => {
  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#F0B90B]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-48 h-48 bg-[#F0B90B]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo */}
        <div className="mb-6">
          <Logo size="xl" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">4ortin-X</h1>
        <p className="text-[#F0B90B] text-sm font-medium tracking-widest mb-2">WALLET</p>
        <p className="text-gray-400 text-center mb-12 max-w-xs">
          Your secure gateway to Web3. Store, swap, and explore decentralized apps.
        </p>

        {/* Features */}
        <div className="w-full max-w-sm space-y-3 mb-12">
          <div className="flex items-center gap-3 bg-[#1A1A2E]/50 rounded-xl p-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Self-Custody</p>
              <p className="text-gray-500 text-xs">You control your keys</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#1A1A2E]/50 rounded-xl p-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Multi-Chain</p>
              <p className="text-gray-500 text-xs">Ethereum, BSC, Polygon & more</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#1A1A2E]/50 rounded-xl p-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-medium text-sm">DApp Browser</p>
              <p className="text-gray-500 text-xs">Connect to any DApp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="px-6 pb-6 space-y-3">
        <button
          onClick={onCreateWallet}
          className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-black font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Wallet
        </button>
        <button
          onClick={onImportWallet}
          className="w-full bg-[#1A1A2E] hover:bg-[#252542] text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-700"
        >
          <Download className="w-5 h-5" />
          Import Existing Wallet
        </button>
      </div>

      {/* Footer with legal links */}
      <Footer className="pb-6" />
    </div>
  );
};

export default WelcomeScreen;
