import React, { useState } from 'react';
import { Eye, EyeOff, Fingerprint, AlertCircle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { formatAddress } from '../../services/walletService';
import Logo from '../common/Logo';

interface UnlockScreenProps {
  onUnlock: () => void;
  onReset?: () => void;
}

const UnlockScreen: React.FC<UnlockScreenProps> = ({ onUnlock, onReset }) => {
  const { unlock, activeAccount, resetWallet } = useWallet();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    const success = await unlock(password);
    
    if (success) {
      onUnlock();
    } else {
      setError('Incorrect password. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  const handleReset = () => {
    resetWallet();
    onReset?.();
  };

  if (showResetConfirm) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white text-center mb-2">Reset Wallet?</h2>
            <p className="text-gray-400 text-center text-sm mb-4">
              This will delete your wallet from this device. You can only recover it with your recovery phrase.
            </p>
            <p className="text-red-400 text-center text-sm font-medium">
              This action cannot be undone!
            </p>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-xl transition-colors mb-3"
          >
            Yes, Reset Wallet
          </button>
          <button
            onClick={() => setShowResetConfirm(false)}
            className="w-full bg-[#1A1A2E] hover:bg-[#252542] text-white font-semibold py-4 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#F0B90B]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-48 h-48 bg-[#F0B90B]/10 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Logo */}
        <div className="mb-6">
          <Logo size="lg" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        
        {activeAccount && (
          <div className="bg-[#1A1A2E] rounded-xl px-4 py-2 mb-6">
            <p className="text-gray-400 text-sm">{formatAddress(activeAccount.address)}</p>
          </div>
        )}

        <div className="w-full max-w-sm">
          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#1A1A2E] border border-gray-700 rounded-xl px-4 py-4 pr-12 text-white focus:outline-none focus:border-[#F0B90B]"
              placeholder="Enter password"
              autoFocus
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleUnlock}
            disabled={isLoading}
            className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 text-black font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Unlocking...
              </>
            ) : (
              'Unlock'
            )}
          </button>

          {/* Biometric button placeholder */}
          <button
            className="w-full mt-4 text-gray-500 hover:text-gray-400 font-medium py-3 transition-colors flex items-center justify-center gap-2"
            disabled
          >
            <Fingerprint className="w-5 h-5" />
            Use Biometrics
          </button>
        </div>
      </div>

      {/* Reset option */}
      <div className="p-6">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full text-gray-500 hover:text-red-400 text-sm transition-colors"
        >
          Forgot password? Reset wallet
        </button>
      </div>
    </div>
  );
};

export default UnlockScreen;
