import React, { useState, useEffect } from 'react';
import { 
  ArrowDownUp, 
  Settings, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  ChevronDown,
  Info,
  ExternalLink
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { 
  getSwapQuote, 
  buildSwapTransaction, 
  executeSwap,
  NATIVE_TOKEN_ADDRESS,
  SUPPORTED_CHAINS,
  type SwapQuote
} from '../../services/dexService';
import { getExplorerTxUrl } from '../../services/historyService';
import { formatAddress } from '../../services/walletService';
import { ethers } from 'ethers';
import { FEE_CONFIG } from '../../services/feeService';

// Popular tokens per chain
const POPULAR_TOKENS: Record<number, Array<{ address: string; symbol: string; decimals: number }>> = {
  1: [ // Ethereum
    { address: NATIVE_TOKEN_ADDRESS, symbol: 'ETH', decimals: 18 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 },
    { address: '0x6B175474E89094C44Da98b954EescdeCB5f3628', symbol: 'DAI', decimals: 18 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'BTC', decimals: 8 },
  ],
  56: [ // BSC
    { address: NATIVE_TOKEN_ADDRESS, symbol: 'BNB', decimals: 18 },
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18 },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18 },
    { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', decimals: 18 },
    { address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', symbol: 'BTCB', decimals: 18 },
  ],
  137: [ // Polygon
    { address: NATIVE_TOKEN_ADDRESS, symbol: 'MATIC', decimals: 18 },
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', decimals: 6 },
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', decimals: 6 },
    { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', decimals: 18 },
    { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'BTC', decimals: 8 },
  ],
  42161: [ // Arbitrum
    { address: NATIVE_TOKEN_ADDRESS, symbol: 'ETH', decimals: 18 },
    { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', symbol: 'USDC', decimals: 6 },
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', decimals: 6 },
    { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', symbol: 'BTC', decimals: 8 },
  ],
  10: [ // Optimism
    { address: NATIVE_TOKEN_ADDRESS, symbol: 'ETH', decimals: 18 },
    { address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', symbol: 'USDC', decimals: 6 },
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', decimals: 6 },
    { address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', symbol: 'BTC', decimals: 8 },
  ],
  43114: [ // Avalanche
    { address: NATIVE_TOKEN_ADDRESS, symbol: 'AVAX', decimals: 18 },
    { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', decimals: 6 },
    { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', symbol: 'USDT', decimals: 6 },
    { address: '0x152b9d0FdC40C096757F570A51E494bd4b943E50', symbol: 'BTC', decimals: 8 },
  ],
  8453: [ // Base
    { address: NATIVE_TOKEN_ADDRESS, symbol: 'ETH', decimals: 18 },
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 },
    { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', decimals: 18 },
  ],
};

const DexSwapScreen: React.FC = () => {
  const { activeAccount, chainId, chain, provider } = useWallet();
  const [fromToken, setFromToken] = useState<typeof POPULAR_TOKENS[1][0] | null>(null);
  const [toToken, setToToken] = useState<typeof POPULAR_TOKENS[1][0] | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [slippage, setSlippage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; txHash?: string } | null>(null);
  const [nativeBalance, setNativeBalance] = useState('0');

  const isSupported = SUPPORTED_CHAINS.includes(chainId);
  const tokens = POPULAR_TOKENS[chainId] || [];

  // Initialize default tokens
  useEffect(() => {
    if (tokens.length > 0) {
      setFromToken(tokens[0]);
      setToToken(tokens[1] || tokens[0]);
    }
  }, [chainId]);

  // Fetch native balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!activeAccount?.address || !provider) return;
      try {
        const balance = await provider.getBalance(activeAccount.address);
        setNativeBalance(ethers.formatEther(balance));
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    };
    fetchBalance();
  }, [activeAccount?.address, provider, chainId]);

  // Fetch quote when inputs change
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
        setQuote(null);
        return;
      }

      setIsQuoting(true);
      setError(null);

      try {
        const amount = ethers.parseUnits(fromAmount, fromToken.decimals).toString();
        const result = await getSwapQuote(
          chainId,
          fromToken.address,
          toToken.address,
          amount
        );
        setQuote(result);
      } catch (err) {
        console.error('Failed to get quote:', err);
        setQuote(null);
      }
      setIsQuoting(false);
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [fromToken, toToken, fromAmount, chainId]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
    setQuote(null);
  };

  const handleSwap = async () => {
    if (!activeAccount?.address || !fromToken || !toToken || !fromAmount || !quote) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const amount = ethers.parseUnits(fromAmount, fromToken.decimals).toString();

      // Check if we need to approve token first (not native token)
      if (fromToken.address !== NATIVE_TOKEN_ADDRESS) {
        // Approve would go here - need spender address from 1inch
        // For now, we'll attempt the swap and handle approval error
      }

      // Build the swap transaction
      const swapTx = await buildSwapTransaction(
        chainId,
        fromToken.address,
        toToken.address,
        amount,
        activeAccount.address,
        slippage
      );

      if (!swapTx) {
        throw new Error('Failed to build swap transaction');
      }

      // Execute the swap
      const txHash = await executeSwap(swapTx);

      if (txHash) {
        setSuccess({
          message: `Swapped ${fromAmount} ${fromToken.symbol} for ${toToken.symbol}`,
          txHash
        });
        setFromAmount('');
        setQuote(null);
      } else {
        throw new Error('Swap failed');
      }
    } catch (err: any) {
      console.error('Swap error:', err);
      if (err.message?.includes('insufficient funds')) {
        setError('Insufficient funds for gas');
      } else if (err.message?.includes('user rejected')) {
        setError('Transaction rejected');
      } else {
        setError(err.message || 'Swap failed. Please try again.');
      }
    }

    setIsLoading(false);
  };

  const formatToAmount = () => {
    if (!quote || !toToken) return '0.00';
    const amount = ethers.formatUnits(quote.toAmount, toToken.decimals);
    return parseFloat(amount).toFixed(6);
  };

  const TokenPicker = ({ 
    show, 
    onClose, 
    onSelect, 
    exclude 
  }: { 
    show: boolean; 
    onClose: () => void; 
    onSelect: (token: typeof POPULAR_TOKENS[1][0]) => void; 
    exclude: string | null;
  }) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
        <div className="w-full bg-[#1A1A2E] rounded-t-3xl max-h-[70vh] overflow-auto">
          <div className="sticky top-0 bg-[#1A1A2E] p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Select Token</h3>
              <button onClick={onClose} className="text-gray-400">Cancel</button>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {tokens.filter(t => t.address !== exclude).map((token) => (
              <button
                key={token.address}
                onClick={() => { onSelect(token); onClose(); }}
                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <div className="w-10 h-10 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                  <span className="text-[#F0B90B] font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">{token.symbol}</div>
                  <div className="text-gray-500 text-xs font-mono">
                    {token.address === NATIVE_TOKEN_ADDRESS ? 'Native' : formatAddress(token.address, 6)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isSupported) {
    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col items-center justify-center px-4 pb-20">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Network Not Supported</h2>
        <p className="text-gray-400 text-center mb-4">
          DEX swaps are not available on {chain.name}.
        </p>
        <p className="text-gray-500 text-sm text-center">
          Supported networks: Ethereum, BSC, Polygon, Arbitrum, Optimism, Avalanche, Base
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0D1117] flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold text-white">Swap</h1>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-800 rounded-full"
        >
          <Settings className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      {/* Network Badge */}
      <div className="px-4 mb-2">
        <div className="inline-flex items-center gap-2 bg-[#1A1A2E] px-3 py-1 rounded-full">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: chain.iconColor }}
          />
          <span className="text-gray-400 text-sm">{chain.name}</span>
        </div>
      </div>

      {/* Slippage Settings */}
      {showSettings && (
        <div className="mx-4 mb-4 p-4 bg-[#1A1A2E] rounded-xl">
          <label className="text-gray-400 text-sm mb-2 block">Slippage Tolerance</label>
          <div className="flex gap-2">
            {[0.5, 1, 2, 3].map((val) => (
              <button
                key={val}
                onClick={() => setSlippage(val)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  slippage === val 
                    ? 'bg-[#F0B90B] text-black' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 px-4">
        {/* From Token */}
        <div className="bg-[#1A1A2E] rounded-2xl p-4 mb-2">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400 text-sm">From</span>
            {fromToken?.address === NATIVE_TOKEN_ADDRESS && (
              <span className="text-gray-400 text-sm">
                Balance: {parseFloat(nativeBalance).toFixed(4)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl text-white outline-none placeholder:text-gray-600"
            />
            <button
              onClick={() => setShowFromPicker(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl transition-colors"
            >
              <div className="w-6 h-6 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                <span className="text-[#F0B90B] font-bold text-xs">
                  {fromToken?.symbol.slice(0, 2) || '??'}
                </span>
              </div>
              <span className="text-white font-medium">{fromToken?.symbol || 'Select'}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          {fromAmount && fromToken?.address === NATIVE_TOKEN_ADDRESS && (
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    const amount = parseFloat(nativeBalance) * pct / 100;
                    // Leave some for gas if 100%
                    const finalAmount = pct === 100 ? Math.max(0, amount - 0.01) : amount;
                    setFromAmount(finalAmount.toFixed(8));
                  }}
                  className="text-xs text-[#F0B90B] hover:text-[#F0B90B]/80"
                >
                  {pct}%
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="bg-[#252542] hover:bg-[#2d2d4d] p-3 rounded-xl border border-gray-700 transition-colors"
          >
            <ArrowDownUp className="w-5 h-5 text-[#F0B90B]" />
          </button>
        </div>

        {/* To Token */}
        <div className="bg-[#1A1A2E] rounded-2xl p-4 mt-2">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400 text-sm">To (estimated)</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 text-2xl text-white">
              {isQuoting ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              ) : (
                formatToAmount()
              )}
            </div>
            <button
              onClick={() => setShowToPicker(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl transition-colors"
            >
              <div className="w-6 h-6 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                <span className="text-[#F0B90B] font-bold text-xs">
                  {toToken?.symbol.slice(0, 2) || '??'}
                </span>
              </div>
              <span className="text-white font-medium">{toToken?.symbol || 'Select'}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Quote Info */}
        {quote && (
          <div className="mt-4 p-3 bg-[#1A1A2E]/50 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rate</span>
              <span className="text-white">
                1 {fromToken?.symbol} ≈ {(parseFloat(formatToAmount()) / parseFloat(fromAmount || '1')).toFixed(6)} {toToken?.symbol}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Slippage</span>
              <span className="text-white">{slippage}%</span>
            </div>
            {/* 4ortin-X Fee */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-1">
                <Info className="w-3 h-3" /> 4ortin-X Fee
              </span>
              <span className="text-[#F0B90B]">{FEE_CONFIG.SWAP_FEE_PERCENT}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">You receive</span>
              <span className="text-green-400 font-medium">
                ~{(parseFloat(formatToAmount()) * (1 - FEE_CONFIG.SWAP_FEE_PERCENT / 100)).toFixed(6)} {toToken?.symbol}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
              <span className="text-gray-400 flex items-center gap-1">
                <Info className="w-3 h-3" /> DEX Aggregator
              </span>
              <span className="text-[#F0B90B]">1inch</span>
            </div>
          </div>
        )}

        {/* Error/Success */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-500 text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500 text-sm">{success.message}</span>
            </div>
            {success.txHash && (
              <a
                href={getExplorerTxUrl(success.txHash, chainId)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-[#F0B90B] text-sm flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                View on Explorer
              </a>
            )}
          </div>
        )}
      </div>

      {/* Swap Button */}
      <div className="p-4">
        <button
          onClick={handleSwap}
          disabled={isLoading || !fromAmount || !quote || parseFloat(fromAmount) <= 0}
          className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-400 text-black font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Swapping...
            </>
          ) : !quote && fromAmount ? (
            'Getting Quote...'
          ) : (
            'Swap'
          )}
        </button>
      </div>

      <TokenPicker 
        show={showFromPicker} 
        onClose={() => setShowFromPicker(false)} 
        onSelect={setFromToken}
        exclude={toToken?.address || null}
      />
      <TokenPicker 
        show={showToPicker} 
        onClose={() => setShowToPicker(false)} 
        onSelect={setToToken}
        exclude={fromToken?.address || null}
      />
    </div>
  );
};

export default DexSwapScreen;
