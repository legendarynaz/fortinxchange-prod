import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { validateMnemonic } from '../../services/walletService';
import { validatePassword } from '../../utils/sanitize';

type Step = 'phrase' | 'password';

interface ImportWalletFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

const ImportWalletFlow: React.FC<ImportWalletFlowProps> = ({ onBack, onComplete }) => {
  const { initializeWallet } = useWallet();
  const [step, setStep] = useState<Step>('phrase');
  const [mnemonic, setMnemonic] = useState('');
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputMode, setInputMode] = useState<'grid' | 'paste'>('grid');

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.toLowerCase().trim();
    setWords(newWords);
    setError('');
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedWords = pastedText.trim().toLowerCase().split(/\s+/);
    
    if (pastedWords.length === 12 || pastedWords.length === 24) {
      setWordCount(pastedWords.length as 12 | 24);
      const newWords = Array(pastedWords.length).fill('');
      pastedWords.forEach((word, i) => {
        newWords[i] = word;
      });
      setWords(newWords);
      setMnemonic(pastedWords.join(' '));
    }
  };

  const handleContinue = () => {
    const phrase = inputMode === 'grid' 
      ? words.slice(0, wordCount).join(' ') 
      : mnemonic.trim().toLowerCase();
    
    if (!validateMnemonic(phrase)) {
      setError('Invalid recovery phrase. Please check your words and try again.');
      return;
    }
    
    setMnemonic(phrase);
    setError('');
    setStep('password');
  };

  const passwordValidation = validatePassword(password);

  const handleImport = async () => {
    if (!passwordValidation.isValid) {
      const errors = [...passwordValidation.errors, ...passwordValidation.suggestions.slice(0, 2)];
      setError(errors.join('. ') || 'Password is too weak');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await initializeWallet(mnemonic, password);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Phrase input step
  if (step === 'phrase') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col">
        <header className="flex items-center gap-4 p-4 border-b border-gray-800">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Import Wallet</h1>
        </header>

        <div className="flex-1 p-6 flex flex-col overflow-auto">
          <p className="text-gray-400 mb-4">
            Enter your 12 or 24 word recovery phrase to restore your wallet.
          </p>

          {/* Word count toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setWordCount(12); setWords(Array(12).fill('')); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                wordCount === 12 
                  ? 'bg-[#F0B90B] text-black' 
                  : 'bg-[#1A1A2E] text-gray-400 hover:bg-[#252542]'
              }`}
            >
              12 Words
            </button>
            <button
              onClick={() => { setWordCount(24); setWords(Array(24).fill('')); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                wordCount === 24 
                  ? 'bg-[#F0B90B] text-black' 
                  : 'bg-[#1A1A2E] text-gray-400 hover:bg-[#252542]'
              }`}
            >
              24 Words
            </button>
          </div>

          {/* Input mode toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode('grid')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'grid' 
                  ? 'bg-[#252542] text-white border border-[#F0B90B]' 
                  : 'bg-[#1A1A2E] text-gray-400'
              }`}
            >
              Word by Word
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'paste' 
                  ? 'bg-[#252542] text-white border border-[#F0B90B]' 
                  : 'bg-[#1A1A2E] text-gray-400'
              }`}
            >
              Paste Phrase
            </button>
          </div>

          {inputMode === 'grid' ? (
            <div 
              className="grid grid-cols-3 gap-2 mb-4"
              onPaste={handlePaste}
            >
              {Array(wordCount).fill(0).map((_, index) => (
                <div key={index} className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={words[index] || ''}
                    onChange={(e) => handleWordChange(index, e.target.value)}
                    className="w-full bg-[#1A1A2E] border border-gray-700 rounded-lg pl-7 pr-2 py-2 text-white text-sm focus:outline-none focus:border-[#F0B90B]"
                    placeholder=""
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <textarea
              value={mnemonic}
              onChange={(e) => { setMnemonic(e.target.value); setError(''); }}
              onPaste={handlePaste}
              className="w-full h-32 bg-[#1A1A2E] border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-[#F0B90B] resize-none mb-4"
              placeholder="Enter your recovery phrase separated by spaces..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="p-6">
          <button
            onClick={handleContinue}
            disabled={inputMode === 'grid' 
              ? words.slice(0, wordCount).some(w => !w.trim())
              : !mnemonic.trim()
            }
            className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-4 rounded-xl transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Password step
  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col">
      <header className="flex items-center gap-4 p-4 border-b border-gray-800">
        <button onClick={() => setStep('phrase')} className="p-2 hover:bg-gray-800 rounded-full">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Set Password</h1>
      </header>

      <div className="flex-1 p-6 flex flex-col">
        <p className="text-gray-400 mb-6">
          Create a password to secure your wallet on this device.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-[#1A1A2E] border border-gray-700 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:border-[#F0B90B]"
                placeholder="Enter password"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              className="w-full bg-[#1A1A2E] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F0B90B]"
              placeholder="Confirm password"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-6">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6 text-gray-500 text-sm space-y-1">
          <p className={password.length >= 8 ? 'text-green-500' : ''}>• Minimum 8 characters</p>
          <p className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-500' : ''}>• Upper and lowercase letters</p>
          <p className={/[0-9]/.test(password) ? 'text-green-500' : ''}>• At least one number</p>
          <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-500' : ''}>• At least one special character</p>
        </div>
      </div>

      <div className="p-6">
        <button
          onClick={handleImport}
          disabled={isLoading || !password || !confirmPassword}
          className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Importing...
            </>
          ) : (
            'Import Wallet'
          )}
        </button>
      </div>
    </div>
  );
};

export default ImportWalletFlow;
