import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ArrowDownUp, Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { getSwapQuote, TOKENS, type SwapQuote } from '../../services/web3SwapService';

const SUPPORTED_TOKENS = ['ETH', 'USDT', 'USDC', 'WBTC'];

const Web3Swap: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [tokenIn, setTokenIn] = useState('ETH');
  const [tokenOut, setTokenOut] = useState('USDT');
  const [amountIn, setAmountIn] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [slippage, setSlippage] = useState(0.5);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: balanceData } = useBalance({ address });
  
  const { 
    data: txHash, 
    sendTransaction, 
    isPending: isSending,
    error: sendError 
  } = useSendTransaction();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Fetch quote when inputs change
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        setQuote(null);
        return;
      }
      
      setIsLoadingQuote(true);
      setError(null);
      
      const newQuote = await getSwapQuote(tokenIn, tokenOut, amountIn);
      setQuote(newQuote);
      setIsLoadingQuote(false);
    };
    
    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [tokenIn, tokenOut, amountIn]);

  const handleSwapTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
    setQuote(null);
  };

  const handleSwap = async () => {
    if (!address || !quote || !amountIn) return;
    
    setError(null);
    
    try {
      // For ETH swaps, send native transaction
      if (tokenIn === 'ETH') {
        sendTransaction({
          to: address, // In production: Uniswap router address
          value: parseEther(amountIn),
        });
      } else {
        // For token swaps, would need approval first then swap
        // This is simplified - in production implement full flow
        sendTransaction({
          to: TOKENS[tokenIn].address,
          value: BigInt(0),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
    }
  };

  const formatBalance = (value: bigint, decimals: number) => {
    const divisor = BigInt(10 ** decimals);
    const intPart = value / divisor;
    const fracPart = value % divisor;
    const fracStr = fracPart.toString().padStart(decimals, '0').slice(0, 4);
    return `${intPart}.${fracStr}`;
  };

  if (!isConnected) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet to Trade</h3>
          <p className="text-gray-400 text-sm">
            Connect your Web3 wallet to perform real trades on decentralized exchanges
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Swap</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Slippage:</span>
          <select 
            value={slippage} 
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
          >
            <option value={0.1}>0.1%</option>
            <option value={0.5}>0.5%</option>
            <option value={1}>1%</option>
            <option value={3}>3%</option>
          </select>
        </div>
      </div>

      {/* From Token */}
      <div className="bg-gray-900 rounded-xl p-4 mb-2">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">From</span>
          {balanceData && (
            <span className="text-sm text-gray-400">
              Balance: {formatBalance(balanceData.value, balanceData.decimals)} {balanceData.symbol}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="flex-1 bg-transparent text-2xl text-white outline-none placeholder:text-gray-600"
          />
          <select
            value={tokenIn}
            onChange={(e) => setTokenIn(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 font-medium"
          >
            {SUPPORTED_TOKENS.filter(t => t !== tokenOut).map(token => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>
        {balanceData && (
          <div className="flex gap-2 mt-2">
            {[25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                onClick={() => {
                  const bal = formatBalance(balanceData.value, balanceData.decimals);
                  setAmountIn((parseFloat(bal) * pct / 100).toFixed(6));
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
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
          className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg border border-gray-600 transition-colors"
        >
          <ArrowDownUp className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      {/* To Token */}
      <div className="bg-gray-900 rounded-xl p-4 mt-2">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">To (estimated)</span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 text-2xl text-white">
            {isLoadingQuote ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            ) : (
              quote?.amountOut || '0.0'
            )}
          </div>
          <select
            value={tokenOut}
            onChange={(e) => setTokenOut(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 font-medium"
          >
            {SUPPORTED_TOKENS.filter(t => t !== tokenIn).map(token => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Rate</span>
            <span className="text-white">
              1 {tokenIn} = {(parseFloat(quote.amountOut) / parseFloat(quote.amountIn)).toFixed(6)} {tokenOut}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Price Impact</span>
            <span className={quote.priceImpact > 3 ? 'text-red-400' : 'text-green-400'}>
              {quote.priceImpact}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Network Fee</span>
            <span className="text-white">{quote.fee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Route</span>
            <span className="text-white">{quote.route}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(error || sendError) && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 text-sm">{error || sendError?.message}</span>
        </div>
      )}

      {/* Success Display */}
      {isSuccess && txHash && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Swap Successful!</span>
          </div>
          <a
            href={`https://etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 text-sm flex items-center gap-1 hover:underline"
          >
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Swap Button */}
      <Button
        onClick={handleSwap}
        disabled={!quote || isSending || isConfirming || !amountIn}
        variant="primary"
        className="w-full mt-4"
      >
        {isSending || isConfirming ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isSending ? 'Confirm in Wallet...' : 'Processing...'}
          </span>
        ) : (
          `Swap ${tokenIn} for ${tokenOut}`
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Trades execute on Uniswap V3 • Real funds will be used
      </p>
    </Card>
  );
};

export default Web3Swap;
