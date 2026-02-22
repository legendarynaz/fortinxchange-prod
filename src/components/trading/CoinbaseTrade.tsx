import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import {
  createOrder,
  getAccounts,
  getTicker,
  isConfigured,
  toProductId,
  type CoinbaseAccount,
  type Ticker,
} from '../../services/coinbaseService';

interface CoinbaseTradeProps {
  symbol: string;
  currentPrice: number;
}

type OrderType = 'market' | 'limit';
type Side = 'buy' | 'sell';

const CoinbaseTrade: React.FC<CoinbaseTradeProps> = ({ symbol, currentPrice }) => {
  const [side, setSide] = useState<Side>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [accounts, setAccounts] = useState<CoinbaseAccount[]>([]);
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const productId = toProductId(symbol, 'USD');
  
  // Get relevant balances
  const usdAccount = accounts.find(a => a.currency === 'USD');
  const cryptoAccount = accounts.find(a => a.currency === symbol);
  const usdBalance = parseFloat(usdAccount?.available_balance.value || '0');
  const cryptoBalance = parseFloat(cryptoAccount?.available_balance.value || '0');

  // Fetch accounts and ticker
  const fetchData = useCallback(async () => {
    if (!isConfigured()) return;
    
    setIsLoading(true);
    try {
      const [accts, tick] = await Promise.all([
        getAccounts(),
        getTicker(productId),
      ]);
      setAccounts(accts);
      setTicker(tick);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
    setIsLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Set limit price when switching to limit orders
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

    // Validation
    if (side === 'buy') {
      const total = parseFloat(calculateTotal());
      if (total > usdBalance) {
        setError(`Insufficient USD balance. Available: $${usdBalance.toFixed(2)}`);
        return;
      }
    } else {
      if (parseFloat(amount) > cryptoBalance) {
        setError(`Insufficient ${symbol} balance. Available: ${cryptoBalance.toFixed(8)}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const order = await createOrder({
        product_id: productId,
        side: side === 'buy' ? 'BUY' : 'SELL',
        order_type: orderType === 'market' ? 'MARKET' : 'LIMIT',
        size: side === 'sell' ? amount : undefined,
        quote_size: side === 'buy' && orderType === 'market' ? calculateTotal() : undefined,
        limit_price: orderType === 'limit' ? limitPrice : undefined,
      });

      if (order) {
        setSuccess(`Order placed! ID: ${order.order_id.slice(0, 8)}...`);
        setAmount('');
        fetchData(); // Refresh balances
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
          <h3 className="text-lg font-semibold text-white mb-2">Coinbase API Not Configured</h3>
          <p className="text-gray-400 text-sm mb-4">
            Add your Coinbase API credentials to enable live trading.
          </p>
          <p className="text-gray-500 text-xs">
            Set VITE_COINBASE_API_KEY and VITE_COINBASE_API_SECRET in your .env file
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Trade {symbol}</h3>
        <div className="flex items-center gap-2">
          {ticker && (
            <span className={`text-sm font-medium ${
              parseFloat(ticker.price_percent_chg_24h) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {parseFloat(ticker.price_percent_chg_24h) >= 0 ? <TrendingUp className="w-4 h-4 inline" /> : <TrendingDown className="w-4 h-4 inline" />}
              {' '}{parseFloat(ticker.price_percent_chg_24h).toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Live indicator */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 mb-4">
        <p className="text-center text-green-400 text-xs font-medium flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          LIVE TRADING via Coinbase • Real funds will be used
        </p>
      </div>

      {/* Buy/Sell Tabs */}
      <div className="flex mb-4 bg-gray-900 rounded-lg p-1">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            side === 'buy'
              ? 'bg-green-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            side === 'sell'
              ? 'bg-red-500 text-white'
              : 'text-gray-400 hover:text-white'
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
            <span className="text-gray-400">Available USD:</span>
            <span className="text-white font-mono">${usdBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Available {symbol}:</span>
            <span className="text-white font-mono">{cryptoBalance.toFixed(8)}</span>
          </div>
        </div>
      )}

      {/* Order Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Limit Price (for limit orders) */}
        {orderType === 'limit' && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Limit Price (USD)</label>
            <input
              type="number"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Amount ({symbol})
          </label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
          />
          {/* Quick percentage buttons */}
          <div className="flex gap-2 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  const maxAmount = side === 'buy'
                    ? usdBalance / currentPrice
                    : cryptoBalance;
                  setAmount((maxAmount * pct / 100).toFixed(8));
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Total</span>
            <span className="text-white font-semibold">${calculateTotal()}</span>
          </div>
          {orderType === 'market' && (
            <p className="text-xs text-gray-500 mt-1">
              Price: ${currentPrice.toFixed(2)} (market)
            </p>
          )}
        </div>

        {/* Error/Success Messages */}
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

        {/* Submit Button */}
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
        Orders execute on Coinbase Advanced Trade
      </p>
    </Card>
  );
};

export default CoinbaseTrade;
