import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, ExternalLink, Zap, Wifi } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import {
  sendTrx,
  sendTrc20,
  isValidTronAddress,
  getTronBalance,
  getTronPrice,
  getAccountResources,
  type TronBalance,
} from '../../services/tronService';

interface TronSendScreenProps {
  onBack: () => void;
}

type SendStep = 'select' | 'input' | 'confirm' | 'sending' | 'success' | 'error';

interface SelectedAsset {
  type: 'TRX' | 'TRC20';
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  contractAddress?: string;
}

const TronSendScreen: React.FC<TronSendScreenProps> = ({ onBack }) => {
  const { mnemonic, tronAddress } = useWallet();
  
  // State
  const [step, setStep] = useState<SendStep>('select');
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState<TronBalance | null>(null);
  const [trxPrice, setTrxPrice] = useState(0);
  const [resources, setResources] = useState({ freeBandwidth: 0, totalBandwidth: 1500, energy: 0, totalEnergy: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  // Fetch balance and resources
  const fetchData = useCallback(async () => {
    if (!tronAddress) return;
    
    setIsLoading(true);
    try {
      const [bal, price, res] = await Promise.all([
        getTronBalance(tronAddress),
        getTronPrice(),
        getAccountResources(tronAddress),
      ]);
      setBalance(bal);
      setTrxPrice(price);
      setResources(res);
    } catch (err) {
      console.error('Failed to fetch Tron data:', err);
    }
    setIsLoading(false);
  }, [tronAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Validate input
  const validateInput = (): string | null => {
    if (!toAddress) return 'Enter recipient address';
    if (!isValidTronAddress(toAddress)) return 'Invalid Tron address';
    if (!amount || parseFloat(amount) <= 0) return 'Enter valid amount';
    
    if (selectedAsset) {
      const balanceNum = parseFloat(selectedAsset.balance);
      const amountNum = parseFloat(amount);
      if (amountNum > balanceNum) return 'Insufficient balance';
    }
    
    return null;
  };

  // Handle send
  const handleSend = async () => {
    if (!mnemonic || !selectedAsset) return;
    
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setStep('sending');
    setError('');
    
    try {
      let result;
      
      if (selectedAsset.type === 'TRX') {
        result = await sendTrx(mnemonic, toAddress, parseFloat(amount));
      } else {
        result = await sendTrc20(
          mnemonic,
          toAddress,
          selectedAsset.contractAddress!,
          amount,
          selectedAsset.decimals
        );
      }
      
      if (result.success) {
        setTxHash(result.txid);
        setStep('success');
      } else {
        setError(result.message || 'Transaction failed');
        setStep('error');
      }
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setStep('error');
    }
  };

  // Set max amount
  const handleSetMax = () => {
    if (selectedAsset) {
      if (selectedAsset.type === 'TRX' && balance) {
        // Leave some TRX for fees
        const maxTrx = Math.max(0, parseFloat(balance.trxFormatted) - 1);
        setAmount(maxTrx.toFixed(6));
      } else {
        setAmount(selectedAsset.balance);
      }
    }
  };

  // Format USD
  const formatUSD = (value: number) => {
    if (value < 0.01) return '<$0.01';
    return `$${value.toFixed(2)}`;
  };

  // Asset selection screen
  if (step === 'select') {
    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
        <div className="flex items-center gap-4 p-4 border-b border-gray-800 safe-area-top">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Send on Tron</h1>
        </div>

        <div className="flex-1 p-4 overflow-auto pb-safe">
          {/* Resources Info */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 bg-[#1A1A2E] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400 text-xs">Bandwidth</span>
              </div>
              <p className="text-white font-semibold">{resources.freeBandwidth.toLocaleString()}</p>
            </div>
            <div className="flex-1 bg-[#1A1A2E] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400 text-xs">Energy</span>
              </div>
              <p className="text-white font-semibold">{resources.energy.toLocaleString()}</p>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-4">Select asset to send</p>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#FF0013] animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* TRX */}
              <button
                onClick={() => {
                  setSelectedAsset({
                    type: 'TRX',
                    symbol: 'TRX',
                    name: 'Tron',
                    balance: balance?.trxFormatted || '0',
                    decimals: 6,
                  });
                  setStep('input');
                }}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-[#FF0013]/10 to-[#FF0013]/5 border border-[#FF0013]/20 rounded-2xl hover:bg-[#FF0013]/20 transition-colors"
              >
                <div className="w-12 h-12 bg-[#FF0013] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">TRX</span>
                    <span className="text-xs bg-[#FF0013]/20 text-[#FF0013] px-2 py-0.5 rounded-full">Native</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {trxPrice > 0 ? `$${trxPrice.toFixed(4)}` : 'Loading...'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{balance?.trxFormatted || '0'} TRX</p>
                  <p className="text-gray-400 text-sm">
                    {formatUSD((parseFloat(balance?.trxFormatted || '0')) * trxPrice)}
                  </p>
                </div>
              </button>

              {/* TRC20 Tokens */}
              {balance?.tokens && balance.tokens.length > 0 && (
                <>
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-gray-700" />
                    <span className="text-gray-500 text-xs uppercase">TRC20 Tokens</span>
                    <div className="flex-1 h-px bg-gray-700" />
                  </div>
                  
                  {balance.tokens.map((token) => (
                    <button
                      key={token.contractAddress}
                      onClick={() => {
                        setSelectedAsset({
                          type: 'TRC20',
                          symbol: token.symbol,
                          name: token.name,
                          balance: token.balanceFormatted,
                          decimals: token.decimals,
                          contractAddress: token.contractAddress,
                        });
                        setStep('input');
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-[#1A1A2E] rounded-2xl hover:bg-[#252542] transition-colors"
                    >
                      <div className="w-12 h-12 bg-[#FF0013]/20 rounded-full flex items-center justify-center">
                        <span className="text-[#FF0013] font-bold">{token.symbol.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-semibold">{token.symbol}</p>
                        <p className="text-gray-400 text-sm">{token.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {parseFloat(token.balanceFormatted).toFixed(4)} {token.symbol}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Show available tokens even if no balance */}
              {(!balance?.tokens || balance.tokens.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No TRC20 tokens found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Input screen
  if (step === 'input') {
    const amountUSD = selectedAsset?.type === 'TRX'
      ? parseFloat(amount || '0') * trxPrice 
      : 0;

    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
        <div className="flex items-center gap-4 p-4 border-b border-gray-800 safe-area-top">
          <button onClick={() => setStep('select')} className="p-2 hover:bg-gray-800 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Send {selectedAsset?.symbol}</h1>
        </div>

        <div className="flex-1 p-4 overflow-auto pb-safe">
          {/* Selected Asset */}
          <div className="flex items-center gap-3 p-4 bg-[#1A1A2E] rounded-2xl mb-6">
            <div className="w-10 h-10 bg-[#FF0013] rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{selectedAsset?.symbol.slice(0, 1)}</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">{selectedAsset?.symbol}</p>
              <p className="text-gray-400 text-sm">Balance: {selectedAsset?.balance}</p>
            </div>
          </div>

          {/* Recipient */}
          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">Recipient Address</label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="T..."
              className="w-full bg-[#1A1A2E] text-white rounded-xl px-4 py-4 border border-gray-700 focus:border-[#FF0013] focus:outline-none font-mono text-sm"
            />
            {toAddress && !isValidTronAddress(toAddress) && (
              <p className="text-red-500 text-xs mt-2">Invalid Tron address</p>
            )}
          </div>

          {/* Amount */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-400 text-sm">Amount</label>
              <button 
                onClick={handleSetMax}
                className="text-[#FF0013] text-sm font-medium hover:text-[#FF0013]/80"
              >
                MAX
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#1A1A2E] text-white text-2xl rounded-xl px-4 py-4 border border-gray-700 focus:border-[#FF0013] focus:outline-none pr-20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                {selectedAsset?.symbol}
              </span>
            </div>
            {selectedAsset?.type === 'TRX' && amount && (
              <p className="text-gray-400 text-sm mt-2">≈ {formatUSD(amountUSD)}</p>
            )}
          </div>

          {/* Fee Info */}
          <div className="bg-[#1A1A2E] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white">
                {resources.freeBandwidth > 300 ? 'Free (using bandwidth)' : '~0.3 TRX'}
              </span>
            </div>
            {selectedAsset?.type === 'TRC20' && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-400">Energy Required</span>
                <span className="text-white">~30,000 Energy</span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="p-4 border-t border-gray-800 safe-area-bottom">
          <button
            onClick={() => {
              const validationError = validateInput();
              if (validationError) {
                setError(validationError);
              } else {
                setError('');
                setStep('confirm');
              }
            }}
            disabled={!toAddress || !amount}
            className={`w-full py-4 rounded-xl font-semibold transition-colors ${
              toAddress && amount
                ? 'bg-[#FF0013] hover:bg-[#FF0013]/90 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Confirmation screen
  if (step === 'confirm') {
    const amountUSD = selectedAsset?.type === 'TRX' 
      ? parseFloat(amount) * trxPrice 
      : 0;

    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
        <div className="flex items-center gap-4 p-4 border-b border-gray-800 safe-area-top">
          <button onClick={() => setStep('input')} className="p-2 hover:bg-gray-800 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Confirm Transaction</h1>
        </div>

        <div className="flex-1 p-4 overflow-auto pb-safe">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-[#FF0013] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">{selectedAsset?.symbol.slice(0, 1)}</span>
            </div>
            <p className="text-4xl font-bold text-white mb-2">
              {amount} {selectedAsset?.symbol}
            </p>
            {selectedAsset?.type === 'TRX' && (
              <p className="text-gray-400">{formatUSD(amountUSD)}</p>
            )}
          </div>

          <div className="bg-[#1A1A2E] rounded-2xl p-4 space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">From</p>
              <p className="text-white font-mono text-sm break-all">{tronAddress}</p>
            </div>
            <div className="h-px bg-gray-700" />
            <div>
              <p className="text-gray-400 text-sm mb-1">To</p>
              <p className="text-white font-mono text-sm break-all">{toAddress}</p>
            </div>
            <div className="h-px bg-gray-700" />
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Network</p>
              <p className="text-white">Tron</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Network Fee</p>
              <p className="text-white">
                {resources.freeBandwidth > 300 ? 'Free' : '~0.3 TRX'}
              </p>
            </div>
          </div>

          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-500 text-sm text-center">
              Please verify all details before confirming. Transactions cannot be reversed.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 safe-area-bottom">
          <button
            onClick={handleSend}
            className="w-full py-4 rounded-xl font-semibold bg-[#FF0013] hover:bg-[#FF0013]/90 text-white transition-colors"
          >
            Confirm & Send
          </button>
        </div>
      </div>
    );
  }

  // Sending screen
  if (step === 'sending') {
    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen items-center justify-center p-6">
        <Loader2 className="w-16 h-16 text-[#FF0013] animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Sending Transaction</h2>
        <p className="text-gray-400 text-center">
          Please wait while your transaction is being processed...
        </p>
      </div>
    );
  }

  // Success screen
  if (step === 'success') {
    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Transaction Sent!</h2>
          <p className="text-gray-400 text-center mb-6">
            {amount} {selectedAsset?.symbol} has been sent successfully.
          </p>
          
          <div className="w-full max-w-sm bg-[#1A1A2E] rounded-2xl p-4 mb-6">
            <p className="text-gray-400 text-sm mb-2">Transaction ID</p>
            <p className="text-white font-mono text-xs break-all select-all">{txHash}</p>
          </div>
          
          <a
            href={`https://tronscan.org/#/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#FF0013] mb-8"
          >
            View on TronScan
            <ExternalLink className="w-4 h-4" />
          </a>
          
          <button
            onClick={onBack}
            className="w-full max-w-sm bg-[#FF0013] hover:bg-[#FF0013]/90 text-white font-semibold py-4 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Error screen
  if (step === 'error') {
    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Transaction Failed</h2>
          <p className="text-gray-400 text-center mb-6">{error}</p>
          
          <div className="flex gap-4 w-full max-w-sm">
            <button
              onClick={onBack}
              className="flex-1 bg-[#1A1A2E] hover:bg-[#252542] text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setError('');
                setStep('input');
              }}
              className="flex-1 bg-[#FF0013] hover:bg-[#FF0013]/90 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TronSendScreen;
