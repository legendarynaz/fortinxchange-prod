import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import {
  createOrder,
  getBalances,
  getTicker,
  isConfigured,
  toSymbol,
  type BinanceAccount,
  type Ticker,
} from '../../services/binanceService';

interface BinanceTradeProps {
  symbol: string;
  currentPrice: number;
}

type OrderType = 'market' | 'limit';
type Side = 'buy' | 'sell';

const BinanceTrade: React.FC<BinanceTradeProps> = ({ symbol, currentPrice }) => {
  const [side, setSide] = useState<Side>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [balances, setBalances] = useState<BinanceAccount[]>([]);
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const binanceSymbol = toSymbol(symbol, 'USDT');
  
  // Get relevant balances
  const usdtBalance = balances.find(b => b.asset === 'USDT');
  const cryptoBalance = balances.find(b => b.asset === symbol);
  const usdtFree = parseFloat(usdtBalance?.free || '0');
  const cryptoFree = parseFloat(cryptoBalance?.free || '0');

  // Fetch balances and ticker
  const fetchData = useCallback(async () => {
    if (!isConfigured()) return;
    
    setIsLoading(true);
    try {
      const [bals, tick] = await Promise.all([
        getBalances(),
        getTicker(binanceSymbol),
      ]);
      setBalances(bals);
      setTicker(tick);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
    setIsLoading(false);
  }, [binanceSymbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (orderType === 'limit' && !limitPrice && currentPrice > 0) {
      setLimitPrice(currentPrice.toFixed(2));
    }
  }, [orderType, limitPrice, currentPrice]);

  const calculateTotal = () => {
    const qty = parseFloat(amount) || 0;
    const price = orderType === 'limit' ? parseFloat(limitPrice) || 0 : currentPrice;
    return (qty * price).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (side === 'buy') {
      const total = parseFloat(calculateTotal());
      if (total > usdtFree) {
        setError(`Insufficient USDT balance. Available: ${usdtFree.toFixed(2)}`);
        return;
      }
    } else {
      if (parseFloat(amount) > cryptoFree) {
        setError(`Insufficient ${symbol} balance. Available: ${cryptoFree.toFixed(8)}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const order = await createOrder({
        symbol: binanceSymbol,
        side: side === 'buy' ? 'BUY' : 'SELL',
        type: orderType === 'market' ? 'MARKET' : 'LIMIT',
        quantity: amount,
        price: orderType === 'limit' ? limitPrice : undefined,
      });

      if (order) {
        setSuccess(`Order placed! ID: ${order.orderId}`);
        setAmount('');
        fetchData();
      } else {
        setError('Failed to place order. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed');
    }

    setIsSubmitting(false);
  };

  if (!isConfigured()) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Binance API Not Configured</h3>
          <p className="text-gray-400 text-sm mb-4">
            Add your Binance API credentials to enable live trading.
          </p>
          <p className="text-gray-500 text-xs">
            Set VITE_BINANCE_API_KEY and VITE_BINANCE_API_SECRET in your .env file
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Trade {symbol}/USDT</h3>
        <div className="flex items-center gap-2">
          {ticker && (
            <span className={`text-sm font-medium ${
              parseFloat(ticker.priceChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {parseFloat(ticker.priceChangePercent) >= 0 ? <TrendingUp className="w-4 h-4 inline" /> : <TrendingDown className="w-4 h-4 inline" />}
              {' '}{parseFloat(ticker.priceChangePercent).toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Live indicator */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mb-4">
        <p className="text-center text-yellow-400 text-xs font-medium flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
          LIVE TRADING via Binance • Real funds will be used
        </p>
      </div>

      {/* Buy/Sell Tabs */}
      <div className="flex mb-4 bg-gray-900 rounded-lg p-1">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            side === 'buy' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            side === 'sell' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Order Type */}
      <Tabs
        tabs={[
          { id: 'market', label: 'Market' },
          { id: 'limit', label: 'Limit' },
        ]}
        activeTab={orderType}
        onTabClick={(t) => setOrderType(t as OrderType)}
      />

      {/* Balance Display */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg p-3 my-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Available USDT:</span>
            <span className="text-white font-mono">{usdtFree.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Available {symbol}:</span>
            <span className="text-white font-mono">{cryptoFree.toFixed(8)}</span>
          </div>
        </div>
      )}

      {/* Order Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {orderType === 'limit' && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Limit Price (USDT)</label>
            <input
              type="number"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-gray-400 block mb-1">Amount ({symbol})</label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
          />
          <div className="flex gap-2 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  const maxAmount = side === 'buy' ? usdtFree / currentPrice : cryptoFree;
                  setAmount((maxAmount * pct / 100).toFixed(8));
                }}
                className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Total</span>
            <span className="text-white font-semibold">{calculateTotal()} USDT</span>
          </div>
          {orderType === 'market' && (
            <p className="text-xs text-gray-500 mt-1">
              Price: ${currentPrice.toFixed(2)} (market)
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">{success}</span>
          </div>
        )}

        <Button
          type="submit"
          variant={side === 'buy' ? 'buy' : 'sell'}
          className="w-full"
          disabled={isSubmitting || !amount}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`
          )}
        </Button>
      </form>

      <p className="text-xs text-gray-500 text-center mt-4">
        Orders execute on Binance Spot
      </p>
    </Card>
  );
};

export default BinanceTrade;
