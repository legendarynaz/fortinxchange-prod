import React, { useState, useEffect } from 'react';
import type { Trade, Market } from '../../types';
import Card from '../ui/Card';

const generateRandomTrade = (basePrice: number): Trade => ({
  id: crypto.randomUUID(),
  time: new Date().toLocaleTimeString('en-US', { hour12: false }),
  price: parseFloat((basePrice + (Math.random() - 0.5) * 5).toFixed(2)),
  amount: parseFloat((Math.random() * 0.5).toFixed(4)),
  side: Math.random() > 0.5 ? 'buy' : 'sell',
});

const TradeHistory: React.FC<{ market: Market, basePrice: number }> = ({ market, basePrice }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [latestTradeId, setLatestTradeId] = useState<string | null>(null);

  useEffect(() => {
    if (basePrice > 0 && trades.length === 0) {
      setTrades(Array.from({ length: 30 }, () => generateRandomTrade(basePrice)));
    }
  }, [basePrice, trades.length]);

  useEffect(() => {
    if (basePrice <= 0) return;

    const interval = setInterval(() => {
      const newTrade = generateRandomTrade(basePrice);
      setTrades(currentTrades => [
        newTrade,
        ...currentTrades,
      ].slice(0, 50));
      setLatestTradeId(newTrade.id);
    }, 2500);

    return () => clearInterval(interval);
  }, [basePrice]);

  return (
    <Card className="h-full flex flex-col" padding="p-0">
      <h3 className="text-base font-bold text-slate-900 p-3 border-b border-slate-200">Trade History</h3>
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-500 p-2 px-2 bg-slate-50">
        <span>Time</span>
        <span className="text-right">Price ({market.quote})</span>
        <span className="text-right">Amount ({market.base})</span>
      </div>
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
    </Card>
  );
};

export default TradeHistory;