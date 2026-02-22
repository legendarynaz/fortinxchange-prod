import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, AlertCircle, Loader2, Check, Zap, Clock, Snail, ExternalLink } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import {
  sendBitcoin,
  getFeeRates,
  getMaxSendableAmount,
  isValidBitcoinAddress,
  btcToSatoshi,
  satoshiToBTC,
  formatBTC,
} from '../../services/bitcoinService';

interface BitcoinSendScreenProps {
  onBack: () => void;
  onSuccess?: (txid: string) => void;
}

type FeeLevel = 'slow' | 'medium' | 'fast';

const BitcoinSendScreen: React.FC<BitcoinSendScreenProps> = ({ onBack, onSuccess }) => {
  const { bitcoinAddress, bitcoinBalance, mnemonic, refreshBitcoinBalance } = useWallet();
  
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [feeLevel, setFeeLevel] = useState<FeeLevel>('medium');
  const [feeRates, setFeeRates] = useState({ fast: 20, medium: 10, slow: 5 });
  const [maxAmount, setMaxAmount] = useState(0);
  const [estimatedFee, setEstimatedFee] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ txid: string } | null>(null);
  
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch fee rates on mount
  useEffect(() => {
    const fetchFees = async () => {
      setIsLoading(true);
      try {
        const rates = await getFeeRates();
        setFeeRates(rates);
      } catch (err) {
        console.error('Failed to fetch fee rates:', err);
      }
      setIsLoading(false);
    };
    fetchFees();
  }, []);

  // Calculate max sendable amount when fee level changes
  useEffect(() => {
    const calculateMax = async () => {
      if (!bitcoinAddress) return;
      
      const feeRate = feeRates[feeLevel];
      const { maxAmount: max, fee } = await getMaxSendableAmount(bitcoinAddress, feeRate);
      setMaxAmount(max);
      setEstimatedFee(fee);
    };
    calculateMax();
  }, [bitcoinAddress, feeLevel, feeRates]);

  const handleSetMax = useCallback(() => {
    if (maxAmount > 0) {
      setAmount(satoshiToBTC(maxAmount));
    }
  }, [maxAmount]);

  const validateForm = (): string | null => {
    if (!toAddress) {
      return 'Please enter a recipient address';
    }
    if (!isValidBitcoinAddress(toAddress)) {
      return 'Invalid Bitcoin address';
    }
    if (!amount || parseFloat(amount) <= 0) {
      return 'Please enter an amount';
    }
    const amountSatoshi = btcToSatoshi(parseFloat(amount));
    if (amountSatoshi < 546) {
      return 'Amount is below dust limit (546 sats)';
    }
    if (amountSatoshi > (bitcoinBalance?.total || 0)) {
      return 'Insufficient balance';
    }
    if (!mnemonic) {
      return 'Wallet is locked. Please unlock to send.';
    }
    return null;
  };

  const handleReview = () => {
    setError('');
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setShowConfirm(true);
  };

  const handleSend = async () => {
    if (!mnemonic) {
      setError('Wallet is locked');
      return;
    }

    setIsSending(true);
    setError('');

    const result = await sendBitcoin({
      mnemonic,
      toAddress,
      amountSatoshi: btcToSatoshi(parseFloat(amount)),
      feeRate: feeRates[feeLevel],
    });

    setIsSending(false);

    if (result.success && result.txid) {
      setSuccess({ txid: result.txid });
      refreshBitcoinBalance();
      onSuccess?.(result.txid);
    } else {
      setError(result.error || 'Transaction failed');
      setShowConfirm(false);
    }
  };

  const feeOptions = [
    { level: 'slow' as FeeLevel, label: 'Slow', icon: Snail, time: '~1 hour', color: 'text-gray-400' },
    { level: 'medium' as FeeLevel, label: 'Medium', icon: Clock, time: '~30 min', color: 'text-blue-400' },
    { level: 'fast' as FeeLevel, label: 'Fast', icon: Zap, time: '~10 min', color: 'text-yellow-400' },
  ];

  // Success Screen
  if (success) {
    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Transaction Sent!</h2>
          <p className="text-gray-400 text-center mb-6">
            Your Bitcoin transaction has been broadcast to the network.
          </p>
          
          <div className="w-full max-w-sm bg-[#1A1A2E] rounded-2xl p-4 mb-6">
            <p className="text-gray-400 text-sm mb-2">Transaction ID</p>
            <p className="text-white font-mono text-xs break-all select-all">{success.txid}</p>
          </div>
          
          <a
            href={`https://mempool.space/tx/${success.txid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#F7931A] mb-8"
          >
            View on Mempool.space
            <ExternalLink className="w-4 h-4" />
          </a>
          
          <button
            onClick={onBack}
            className="w-full max-w-sm bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-black font-semibold py-4 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Confirmation Screen
  if (showConfirm) {
    const amountSatoshi = btcToSatoshi(parseFloat(amount));
    const totalSatoshi = amountSatoshi + estimatedFee;
    
    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
        <div className="flex items-center gap-4 p-4 border-b border-gray-800 safe-area-top">
          <button 
            onClick={() => setShowConfirm(false)} 
            className="p-2 hover:bg-gray-800 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Confirm Transaction</h1>
        </div>

        <div className="flex-1 p-4 overflow-auto pb-safe">
          {/* Amount */}
          <div className="text-center mb-8 pt-4">
            <p className="text-gray-400 text-sm mb-2">Sending</p>
            <p className="text-4xl font-bold text-white mb-1">{amount} BTC</p>
            <p className="text-gray-500">{formatBTC(amountSatoshi)}</p>
          </div>

          {/* Details */}
          <div className="bg-[#1A1A2E] rounded-2xl p-4 space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-400">To</span>
              <span className="text-white font-mono text-sm max-w-[200px] truncate">{toAddress}</span>
            </div>
            <div className="border-t border-gray-700" />
            <div className="flex justify-between">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white">{formatBTC(estimatedFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fee Rate</span>
              <span className="text-white">{feeRates[feeLevel]} sat/vB</span>
            </div>
            <div className="border-t border-gray-700" />
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Total</span>
              <span className="text-white font-bold">{formatBTC(totalSatoshi)}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSend}
              disabled={isSending}
              className="w-full bg-[#F7931A] hover:bg-[#F7931A]/90 disabled:bg-gray-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Broadcasting...
                </>
              ) : (
                'Confirm & Send'
              )}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isSending}
              className="w-full bg-[#1A1A2E] hover:bg-[#252542] text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Send Form
  return (
    <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-800 safe-area-top">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">Send Bitcoin</h1>
          <p className="text-gray-500 text-sm">Native BTC • Mainnet</p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto pb-safe">
        {/* Balance */}
        <div className="bg-gradient-to-r from-[#F7931A]/10 to-[#F7931A]/5 border border-[#F7931A]/20 rounded-2xl p-4 mb-6">
          <p className="text-gray-400 text-sm mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-white">
            {bitcoinBalance ? formatBTC(bitcoinBalance.total) : '0 BTC'}
          </p>
        </div>

        {/* Recipient */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Recipient Address</label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value.trim())}
            placeholder="bc1q..."
            className="w-full bg-[#1A1A2E] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#F7931A] placeholder-gray-500 font-mono text-sm"
          />
        </div>

        {/* Amount */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-400 text-sm">Amount (BTC)</label>
            <button
              onClick={handleSetMax}
              className="text-[#F7931A] text-sm font-medium"
            >
              MAX
            </button>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00000000"
            step="0.00000001"
            min="0"
            className="w-full bg-[#1A1A2E] text-white text-2xl p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#F7931A] placeholder-gray-500"
          />
          {amount && (
            <p className="text-gray-500 text-sm mt-2">
              ≈ {btcToSatoshi(parseFloat(amount) || 0).toLocaleString()} sats
            </p>
          )}
        </div>

        {/* Fee Selection */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-3 block">Network Fee</label>
          <div className="grid grid-cols-3 gap-3">
            {feeOptions.map(({ level, label, icon: Icon, time, color }) => (
              <button
                key={level}
                onClick={() => setFeeLevel(level)}
                className={`p-4 rounded-xl transition-all ${
                  feeLevel === level
                    ? 'bg-[#F7931A]/20 border-2 border-[#F7931A]'
                    : 'bg-[#1A1A2E] border-2 border-transparent hover:bg-[#252542]'
                }`}
              >
                <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-gray-500 text-xs">{feeRates[level]} sat/vB</p>
                <p className="text-gray-600 text-xs">{time}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Review Button */}
        <button
          onClick={handleReview}
          disabled={isLoading || !toAddress || !amount}
          className="w-full bg-[#F7931A] hover:bg-[#F7931A]/90 disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold py-4 rounded-xl transition-colors"
        >
          Review Transaction
        </button>
      </div>
    </div>
  );
};

export default BitcoinSendScreen;
