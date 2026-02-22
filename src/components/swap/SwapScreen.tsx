import React, { useState, useEffect } from 'react';
import { ArrowDownUp, Settings, Loader2, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { getBalances, getTicker, createOrder, isConfigured, type BinanceAccount } from '../../services/binanceService';

const SwapScreen: React.FC = () => {
  const [balances, setBalances] = useState<BinanceAccount[]>([]);
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState('BTC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      const bals = await getBalances();
      setBalances(bals);
    };
    fetchBalances();
  }, []);

  const fromBalance = balances.find(b => b.asset === fromToken);
  const fromAvailable = parseFloat(fromBalance?.free || '0');

  // Fetch rate when tokens change
  useEffect(() => {
    const fetchRate = async () => {
      if (!fromToken || !toToken || fromToken === toToken) return;
      
      setIsQuoting(true);
      try {
        // Try direct pair
        let ticker = await getTicker(`${fromToken}${toToken}`);
        if (ticker) {
          setRate(parseFloat(ticker.price));
        } else {
          // Try reverse pair
          ticker = await getTicker(`${toToken}${fromToken}`);
          if (ticker) {
            setRate(1 / parseFloat(ticker.price));
          } else {
            // Use USDT as intermediate
            const fromUSDT = await getTicker(`${fromToken}USDT`);
            const toUSDT = await getTicker(`${toToken}USDT`);
            if (fromUSDT && toUSDT) {
              setRate(parseFloat(fromUSDT.price) / parseFloat(toUSDT.price));
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch rate:', err);
      }
      setIsQuoting(false);
    };
    fetchRate();
  }, [fromToken, toToken]);

  // Update toAmount when fromAmount or rate changes
  useEffect(() => {
    if (rate && fromAmount) {
      const calculated = parseFloat(fromAmount) * rate;
      setToAmount(calculated.toFixed(8));
    } else {
      setToAmount('');
    }
  }, [fromAmount, rate]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
    setToAmount('');
  };

  const handleSwap = async () => {
    setError(null);
    setSuccess(null);
    
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Enter an amount');
      return;
    }
    
    if (parseFloat(fromAmount) > fromAvailable) {
      setError('Insufficient balance');
      return;
    }

    setIsLoading(true);

    try {
      const order = await createOrder({
        symbol: `${toToken}${fromToken}`,
        side: 'BUY',
        type: 'MARKET',
        quoteOrderQty: fromAmount,
      });

      if (order) {
        setSuccess(`Swapped ${fromAmount} ${fromToken} for ${toToken}`);
        setFromAmount('');
        // Refresh balances
        const bals = await getBalances();
        setBalances(bals);
      } else {
        setError('Swap failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
    }

    setIsLoading(false);
  };

  const TokenPicker = ({ 
    show, 
    onClose, 
    onSelect, 
    exclude 
  }: { 
    show: boolean; 
    onClose: () => void; 
    onSelect: (token: string) => void; 
    exclude: string;
  }) => {
    if (!show) return null;

    const tokens = ['BTC', 'ETH', 'BNB', 'USDT', 'SOL', 'XRP', 'DOGE', 'ADA', ...balances.map(b => b.asset)]
      .filter((t, i, arr) => arr.indexOf(t) === i && t !== exclude);

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
            {tokens.map((token) => {
              const bal = balances.find(b => b.asset === token);
              return (
                <button
                  key={token}
                  onClick={() => { onSelect(token); onClose(); }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <div className="w-10 h-10 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#F0B90B] font-bold text-sm">{token.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">{token}</div>
                    {bal && <div className="text-gray-400 text-sm">{parseFloat(bal.free).toFixed(6)}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (!isConfigured()) {
    return (
      <div className="flex-1 bg-[#0D1117] flex flex-col items-center justify-center px-4 pb-20">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Configure Binance API</h2>
        <p className="text-gray-400 text-center">Add your Binance API credentials to enable swapping.</p>
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

      {/* Slippage Settings */}
      {showSettings && (
        <div className="mx-4 mb-4 p-4 bg-[#1A1A2E] rounded-xl">
          <label className="text-gray-400 text-sm mb-2 block">Slippage Tolerance</label>
          <div className="flex gap-2">
            {[0.1, 0.5, 1, 3].map((val) => (
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
            <span className="text-gray-400 text-sm">
              Balance: {fromAvailable.toFixed(6)}
            </span>
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
                <span className="text-[#F0B90B] font-bold text-xs">{fromToken.slice(0, 2)}</span>
              </div>
              <span className="text-white font-medium">{fromToken}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          {fromAmount && (
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setFromAmount((fromAvailable * pct / 100).toFixed(8))}
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
                toAmount || '0.00'
              )}
            </div>
            <button
              onClick={() => setShowToPicker(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl transition-colors"
            >
              <div className="w-6 h-6 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                <span className="text-[#F0B90B] font-bold text-xs">{toToken.slice(0, 2)}</span>
              </div>
              <span className="text-white font-medium">{toToken}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Rate Info */}
        {rate && (
          <div className="mt-4 p-3 bg-[#1A1A2E]/50 rounded-xl">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rate</span>
              <span className="text-white">
                1 {fromToken} = {rate.toFixed(8)} {toToken}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-400">Slippage</span>
              <span className="text-white">{slippage}%</span>
            </div>
          </div>
        )}

        {/* Error/Success */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500 text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-500 text-sm">{success}</span>
          </div>
        )}
      </div>

      {/* Swap Button */}
      <div className="p-4">
        <button
          onClick={handleSwap}
          disabled={isLoading || !fromAmount || !rate}
          className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-400 text-black font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Swapping...
            </>
          ) : (
            'Swap'
          )}
        </button>
      </div>

      <TokenPicker 
        show={showFromPicker} 
        onClose={() => setShowFromPicker(false)} 
        onSelect={setFromToken}
        exclude={toToken}
      />
      <TokenPicker 
        show={showToPicker} 
        onClose={() => setShowToPicker(false)} 
        onSelect={setToToken}
        exclude={fromToken}
      />
    </div>
  );
};

export default SwapScreen;
