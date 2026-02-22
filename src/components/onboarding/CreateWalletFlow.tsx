import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, Eye, EyeOff, AlertTriangle, Shield } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

type Step = 'generate' | 'backup' | 'verify' | 'password';

interface CreateWalletFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

const CreateWalletFlow: React.FC<CreateWalletFlowProps> = ({ onBack, onComplete }) => {
  const { generateNewMnemonic, initializeWallet } = useWallet();
  const [step, setStep] = useState<Step>('generate');
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifyWords, setVerifyWords] = useState<{ index: number; word: string }[]>([]);
  const [userInputs, setUserInputs] = useState<string[]>(['', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);

  useEffect(() => {
    // Generate mnemonic on mount
    const newMnemonic = generateNewMnemonic(12);
    setMnemonic(newMnemonic);
    
    // Select 3 random words for verification
    const words = newMnemonic.split(' ');
    const indices = new Set<number>();
    while (indices.size < 3) {
      indices.add(Math.floor(Math.random() * 12));
    }
    const sorted = Array.from(indices).sort((a, b) => a - b);
    setVerifyWords(sorted.map(i => ({ index: i, word: words[i] })));
  }, [generateNewMnemonic]);

  const words = mnemonic.split(' ');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    const isValid = verifyWords.every((vw, i) => 
      userInputs[i].toLowerCase().trim() === vw.word.toLowerCase()
    );
    
    if (!isValid) {
      setError('The words you entered do not match. Please try again.');
      return;
    }
    
    setError('');
    setStep('password');
  };

  const handleCreateWallet = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate step
  if (step === 'generate') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col">
        <header className="flex items-center gap-4 p-4 border-b border-gray-800">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Create Wallet</h1>
        </header>

        <div className="flex-1 p-6 flex flex-col">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-yellow-500 font-medium">Backup Your Phrase</p>
                <p className="text-yellow-500/80 text-sm mt-1">
                  Write down these 12 words in order. Never share them with anyone. This is the only way to recover your wallet.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A2E] rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">Recovery Phrase</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
                >
                  {showMnemonic ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {words.map((word, index) => (
                <div
                  key={index}
                  className="bg-[#0D1117] rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <span className="text-gray-500 text-xs w-4">{index + 1}</span>
                  <span className={`text-white text-sm ${!showMnemonic ? 'blur-sm select-none' : ''}`}>
                    {word}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 mb-6">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-[#F0B90B] focus:ring-[#F0B90B]"
            />
            <span className="text-gray-400 text-sm">
              I understand that if I lose my recovery phrase, I will not be able to recover my wallet.
            </span>
          </label>
        </div>

        <div className="p-6">
          <button
            onClick={() => setStep('backup')}
            disabled={!hasAgreed}
            className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-4 rounded-xl transition-colors"
          >
            I've Written It Down
          </button>
        </div>
      </div>
    );
  }

  // Backup confirmation step
  if (step === 'backup') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col">
        <header className="flex items-center gap-4 p-4 border-b border-gray-800">
          <button onClick={() => setStep('generate')} className="p-2 hover:bg-gray-800 rounded-full">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Verify Backup</h1>
        </header>

        <div className="flex-1 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#F0B90B]/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#F0B90B]" />
            </div>
            <div>
              <p className="text-white font-medium">Confirm Your Phrase</p>
              <p className="text-gray-400 text-sm">Enter the following words from your recovery phrase</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {verifyWords.map((vw, i) => (
              <div key={vw.index}>
                <label className="text-gray-400 text-sm mb-2 block">
                  Word #{vw.index + 1}
                </label>
                <input
                  type="text"
                  value={userInputs[i]}
                  onChange={(e) => {
                    const newInputs = [...userInputs];
                    newInputs[i] = e.target.value;
                    setUserInputs(newInputs);
                    setError('');
                  }}
                  className="w-full bg-[#1A1A2E] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F0B90B]"
                  placeholder={`Enter word #${vw.index + 1}`}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="p-6">
          <button
            onClick={handleVerify}
            disabled={userInputs.some(i => !i.trim())}
            className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-4 rounded-xl transition-colors"
          >
            Verify
          </button>
        </div>
      </div>
    );
  }

  // Password step
  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col">
      <header className="flex items-center gap-4 p-4 border-b border-gray-800">
        <button onClick={() => setStep('backup')} className="p-2 hover:bg-gray-800 rounded-full">
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

        <div className="mt-6 text-gray-500 text-sm">
          <p>• Minimum 6 characters</p>
          <p>• This password cannot be recovered</p>
        </div>
      </div>

      <div className="p-6">
        <button
          onClick={handleCreateWallet}
          disabled={isLoading || !password || !confirmPassword}
          className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Creating Wallet...
            </>
          ) : (
            'Create Wallet'
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateWalletFlow;
