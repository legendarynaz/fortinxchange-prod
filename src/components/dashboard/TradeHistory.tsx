import React, { useState, useEffect, useCallback } from 'react';
import type { Trade, Market } from '../../types';
import Card from '../ui/Card';
import { getRecentTrades, toSymbol, type Trade as BinanceTrade } from '../../services/binanceService';
import { Loader2 } from 'lucide-react';

const TradeHistory: React.FC<{ market: Market, basePrice: number }> = ({ market }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [latestTradeId, setLatestTradeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    const binanceSymbol = toSymbol(market.base, 'USDT');
    const binanceTrades = await getRecentTrades(binanceSymbol, 50);
    
    if (binanceTrades.length > 0) {
      const prevFirstId = trades[0]?.id;
      
      const newTrades: Trade[] = binanceTrades.map((t: BinanceTrade) => ({
        id: t.id.toString(),
        time: new Date(t.time).toLocaleTimeString('en-US', { hour12: false }),
        price: parseFloat(t.price),
        amount: parseFloat(t.qty),
        side: t.isBuyerMaker ? 'sell' : 'buy',
      }));
      
      // Highlight new trades
      if (prevFirstId && newTrades[0]?.id !== prevFirstId) {
        setLatestTradeId(newTrades[0].id);
      }
      
      setTrades(newTrades);
    }
    setIsLoading(false);
  }, [market.base, trades]);

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 3000); // Update every 3s
    return () => clearInterval(interval);
  }, [market.base]); // Only re-setup on market change

  return (
    <Card className="h-full flex flex-col" padding="p-0">
      <div className="flex items-center justify-between p-3 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900">Trade History</h3>
        <span className="text-xs text-green-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          LIVE
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-500 p-2 px-2 bg-slate-50">
        <span>Time</span>
        <span className="text-right">Price (USD)</span>
        <span className="text-right">Amount ({market.base})</span>
      </div>
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto">
          {trades.map((trade) => (
            <div key={trade.id} className={`grid grid-cols-3 gap-2 text-xs font-mono py-1 px-2 hover:bg-slate-100/70 transition-colors duration-150 ${trade.id === latestTradeId ? 'highlight-new-trade' : ''}`}>
              <span className="text-slate-500">{trade.time}</span>
              <span className={`text-right ${trade.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                {trade.price.toFixed(2)}
              </span>
              <span className="text-right text-slate-600">{trade.amount.toFixed(4)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default TradeHistory;