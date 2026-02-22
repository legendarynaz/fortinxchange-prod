import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronDown, Copy, AlertCircle, Loader2, CheckCircle, ExternalLink, Check } from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../../context/WalletContext';
import { getAllBalances, type TokenBalance } from '../../services/balanceService';
import { formatUSD } from '../../services/priceService';
import BitcoinSendScreen from './BitcoinSendScreen';
import TronSendScreen from './TronSendScreen';

interface SendScreenProps {
  onBack: () => void;
  initialToken?: string | null;
}

type SendType = 'select' | 'evm' | 'bitcoin' | 'tron';

const SendScreen: React.FC<SendScreenProps> = ({ onBack, initialToken }) => {
  const { activeAccount, chain, chainId, bitcoinAddress, bitcoinBalance, tronAddress, tronBalance, mnemonic } = useWallet();
  
  const [sendType, setSendType] = useState<SendType>('select');
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [showTokenPicker, setShowTokenPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Fetch balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!activeAccount?.address) return;
      setIsLoading(true);
      try {
        const bals = await getAllBalances(activeAccount.address, chainId, false);
        setBalances(bals);
        
        // Auto-select first token or initialToken
        if (initialToken) {
          const found = bals.find(b => b.symbol === initialToken);
          if (found) setSelectedToken(found);
        } else if (bals.length > 0 && !selectedToken) {
          setSelectedToken(bals[0]);
        }
      } catch (err) {
        console.error('Failed to fetch balances:', err);
      }
      setIsLoading(false);
    };
    fetchBalances();
  }, [activeAccount?.address, chainId, initialToken]);

  const handleSetMax = useCallback(() => {
    if (selectedToken) {
      setAmount(selectedToken.balanceFormatted);
    }
  }, [selectedToken]);

  const handleSendEVM = async () => {
    if (!mnemonic || !activeAccount || !selectedToken) {
      setError('Wallet not ready');
      return;
    }

    if (!toAddress || !ethers.isAddress(toAddress)) {
      setError('Invalid recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(selectedToken.balanceFormatted)) {
      setError('Insufficient balance');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      const signer = wallet.connect(provider);

      let tx;
      if (selectedToken.isNative) {
        // Send native token (ETH, BNB, etc.)
        tx = await signer.sendTransaction({
          to: toAddress,
          value: ethers.parseUnits(amount, selectedToken.decimals),
        });
      } else {
        // Send ERC-20 token
        const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
        const contract = new ethers.Contract(selectedToken.address, erc20Abi, signer);
        tx = await contract.transfer(toAddress, ethers.parseUnits(amount, selectedToken.decimals));
      }

      setTxHash(tx.hash);
    } catch (err: any) {
      console.error('Transaction failed:', err);
      setError(err.message || 'Transaction failed');
    }
    setIsSending(false);
  };

  // If Bitcoin send is selected, show Bitcoin send screen
  if (sendType === 'bitcoin') {
    return <BitcoinSendScreen onBack={() => setSendType('select')} />;
  }

  // If Tron send is selected, show Tron send screen
  if (sendType === 'tron') {
    return <TronSendScreen onBack={() => setSendType('select')} />;
  }

  // Success screen
  if (txHash) {
    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Transaction Sent!</h2>
          <p className="text-gray-400 text-center mb-6">
            {amount} {selectedToken?.symbol} has been sent.
          </p>
          
          <div className="w-full max-w-sm bg-[#1A1A2E] rounded-2xl p-4 mb-6">
            <p className="text-gray-400 text-sm mb-2">Transaction Hash</p>
            <p className="text-white font-mono text-xs break-all select-all">{txHash}</p>
          </div>
          
          <a
            href={`${chain.explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#F0B90B] mb-8"
          >
            View on {chain.name} Explorer
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

  // Asset selection screen
  if (sendType === 'select') {
    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
        <div className="flex items-center gap-4 p-4 border-b border-gray-800 safe-area-top">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Send</h1>
        </div>

        <div className="flex-1 p-4 overflow-auto pb-safe">
          <p className="text-gray-400 text-sm mb-4">Select asset to send</p>
          
          {/* Bitcoin Option */}
          {bitcoinAddress && (
            <>
              <button
                onClick={() => setSendType('bitcoin')}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-[#F7931A]/10 to-[#F7931A]/5 border border-[#F7931A]/20 rounded-2xl mb-4 hover:bg-[#F7931A]/20 transition-colors"
              >
                <div className="w-12 h-12 bg-[#F7931A] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">₿</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">Bitcoin</span>
                    <span className="text-xs bg-[#F7931A]/20 text-[#F7931A] px-2 py-0.5 rounded-full">Native</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {bitcoinBalance ? `${(bitcoinBalance.total / 100000000).toFixed(8)} BTC` : '0 BTC'}
                  </p>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-500 rotate-[-90deg]" />
              </button>
              
              {/* Tron Option */}
              {tronAddress && (
                <button
                  onClick={() => setSendType('tron')}
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-[#FF0013]/10 to-[#FF0013]/5 border border-[#FF0013]/20 rounded-2xl mb-4 hover:bg-[#FF0013]/20 transition-colors"
                >
                  <div className="w-12 h-12 bg-[#FF0013] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">T</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">Tron</span>
                      <span className="text-xs bg-[#FF0013]/20 text-[#FF0013] px-2 py-0.5 rounded-full">TRX</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {tronBalance ? `${tronBalance.trxFormatted} TRX` : '0 TRX'}
                    </p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-500 rotate-[-90deg]" />
                </button>
              )}
              
              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-gray-500 text-xs uppercase">EVM Tokens</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>
            </>
          )}

          {/* EVM Tokens */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#F0B90B] animate-spin" />
            </div>
          ) : balances.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No tokens with balance found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {balances.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    setSelectedToken(token);
                    setSendType('evm');
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-[#1A1A2E] rounded-2xl hover:bg-[#252542] transition-colors"
                >
                  <div className="w-12 h-12 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#F0B90B] font-bold">{token.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold">{token.symbol}</p>
                    <p className="text-gray-400 text-sm">
                      {parseFloat(token.balanceFormatted).toFixed(6)} {token.symbol}
                    </p>
                  </div>
                  {token.balanceUSD && token.balanceUSD > 0 && (
                    <p className="text-gray-400 text-sm">{formatUSD(token.balanceUSD)}</p>
                  )}
                  <ChevronDown className="w-5 h-5 text-gray-500 rotate-[-90deg]" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // EVM Send Form
  return (
    <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
      <div className="flex items-center gap-4 p-4 border-b border-gray-800 safe-area-top">
        <button onClick={() => setSendType('select')} className="p-2 hover:bg-gray-800 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">Send {selectedToken?.symbol}</h1>
          <p className="text-gray-500 text-sm">{chain.name}</p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto pb-safe">
        {/* Selected Token */}
        <button
          onClick={() => setShowTokenPicker(true)}
          className="w-full flex items-center justify-between p-4 bg-[#1A1A2E] rounded-2xl mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
              <span className="text-[#F0B90B] font-bold">{selectedToken?.symbol.slice(0, 2)}</span>
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">{selectedToken?.symbol}</p>
              <p className="text-gray-400 text-sm">
                Balance: {parseFloat(selectedToken?.balanceFormatted || '0').toFixed(6)}
              </p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </button>

        {/* Recipient Address */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Recipient Address</label>
          <div className="relative">
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value.trim())}
              placeholder="0x..."
              className="w-full bg-[#1A1A2E] text-white p-4 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-[#F0B90B] placeholder-gray-500 font-mono text-sm"
            />
            <button
              onClick={() => navigator.clipboard.readText().then(setToAddress)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-700 rounded-lg"
            >
              <Copy className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-400 text-sm">Amount</label>
            <button onClick={handleSetMax} className="text-[#F0B90B] text-sm font-medium">
              MAX
            </button>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#1A1A2E] text-white text-2xl p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#F0B90B] placeholder-gray-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendEVM}
          disabled={isSending || !toAddress || !amount}
          className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-400 text-black font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            `Send ${selectedToken?.symbol}`
          )}
        </button>
      </div>

      {/* Token Picker Modal */}
      {showTokenPicker && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTokenPicker(false)} />
          <div className="relative w-full max-w-md bg-[#1A1A2E] rounded-t-3xl sm:rounded-3xl max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Select Token</h2>
              <button onClick={() => setShowTokenPicker(false)} className="text-gray-400">Cancel</button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              <div className="space-y-2">
                {balances.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => {
                      setSelectedToken(token);
                      setShowTokenPicker(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                      selectedToken?.address === token.address
                        ? 'bg-[#F0B90B]/20 border border-[#F0B90B]/30'
                        : 'bg-[#252542] hover:bg-[#2d2d5a]'
                    }`}
                  >
                    <div className="w-10 h-10 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                      <span className="text-[#F0B90B] font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{token.symbol}</p>
                      <p className="text-gray-500 text-sm">{parseFloat(token.balanceFormatted).toFixed(6)}</p>
                    </div>
                    {selectedToken?.address === token.address && (
                      <Check className="w-5 h-5 text-[#F0B90B]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendScreen;
