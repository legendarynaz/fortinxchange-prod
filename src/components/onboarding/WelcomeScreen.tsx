import React from 'react';
import { Shield, Plus, Download, Layers, Layout } from 'lucide-react';
import Logo from '../common/Logo';

interface WelcomeScreenProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreateWallet, onImportWallet }) => {
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#0D1117' }}
    >
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="mb-6">
          <Logo size="xl" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">4ortin-X</h1>
        <p className="text-sm font-medium tracking-widest mb-2" style={{ color: '#F0B90B' }}>WALLET</p>
        <p className="text-gray-400 text-center mb-10 max-w-xs">
          Your secure gateway to Web3. Store, swap, and explore decentralized apps.
        </p>

        {/* Features */}
        <div className="w-full max-w-sm space-y-3 mb-10">
          {/* Self-Custody */}
          <div 
            className="flex items-center gap-3 rounded-xl p-4"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.7)' }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}
            >
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Self-Custody</p>
              <p className="text-gray-500 text-xs">You control your keys</p>
            </div>
          </div>

          {/* Multi-Chain */}
          <div 
            className="flex items-center gap-3 rounded-xl p-4"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.7)' }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}
            >
              <Layers className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Multi-Chain</p>
              <p className="text-gray-500 text-xs">Ethereum, BSC, Polygon & more</p>
            </div>
          </div>

          {/* DApp Browser */}
          <div 
            className="flex items-center gap-3 rounded-xl p-4"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.7)' }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}
            >
              <Layout className="w-5 h-5 text-purple-500" />
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
          className="w-full text-black font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
          style={{ backgroundColor: '#F0B90B' }}
        >
          <Plus className="w-5 h-5" />
          Create New Wallet
        </button>
        <button
          onClick={onImportWallet}
          className="w-full text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-600 active:scale-95"
          style={{ backgroundColor: '#1A1A2E' }}
        >
          <Download className="w-5 h-5" />
          Import Existing Wallet
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
