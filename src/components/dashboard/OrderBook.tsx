import React, { useState, useEffect, useCallback } from 'react';
import type { Order } from '../../types';
import Card from '../ui/Card';
import { getOrderBook, toSymbol } from '../../services/binanceService';
import { Loader2 } from 'lucide-react';

interface OrderBookProps {
    basePrice: number;
    onPriceClick: (price: number) => void;
    symbol?: string;
}

const OrderBook: React.FC<OrderBookProps> = ({ basePrice, onPriceClick, symbol = 'BTC' }) => {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatedPrices, setUpdatedPrices] = useState<Record<string, 'up' | 'down'>>({});

  const fetchOrderBook = useCallback(async () => {
    const binanceSymbol = toSymbol(symbol, 'USDT');
    const data = await getOrderBook(binanceSymbol, 20);
    
    if (data) {
      const prevBids = new Map(bids.map(b => [b.price.toString(), b.size]));
      const prevAsks = new Map(asks.map(a => [a.price.toString(), a.size]));
      
      const newBids: Order[] = data.bids.map(b => {
        const price = parseFloat(b.price);
        const size = parseFloat(b.size);
        const prevSize = prevBids.get(b.price);
        
        // Track price changes for animation
        if (prevSize !== undefined && prevSize !== size) {
          setUpdatedPrices(prev => ({ ...prev, [price]: size > prevSize ? 'up' : 'down' }));
          setTimeout(() => setUpdatedPrices(prev => {
            const copy = { ...prev };
            delete copy[price];
            return copy;
          }), 750);
        }
        
        return {
          price,
          size,
          total: parseFloat((price * size).toFixed(4)),
        };
      });
      
      const newAsks: Order[] = data.asks.map(a => {
        const price = parseFloat(a.price);
        const size = parseFloat(a.size);
        const prevSize = prevAsks.get(a.price);
        
        if (prevSize !== undefined && prevSize !== size) {
          setUpdatedPrices(prev => ({ ...prev, [price]: size > prevSize ? 'up' : 'down' }));
          setTimeout(() => setUpdatedPrices(prev => {
            const copy = { ...prev };
            delete copy[price];
            return copy;
          }), 750);
        }
        
        return {
          price,
          size,
          total: parseFloat((price * size).toFixed(4)),
        };
      });
      
      setBids(newBids.sort((a, b) => b.price - a.price));
      setAsks(newAsks.sort((a, b) => a.price - b.price));
    }
    setIsLoading(false);
  }, [symbol, bids, asks]);

  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 2000); // Update every 2s
    return () => clearInterval(interval);
  }, [symbol]); // Only re-setup on symbol change
  
  const OrderRow = ({ order, type }: { order: Order, type: 'bid' | 'ask'}) => {
    const barWidth = `${Math.min(order.total / 100, 1) * 100}%`;
    const bgColor = type === 'bid' ? 'bg-green-500/10' : 'bg-red-500/10';
    const textColor = type === 'bid' ? 'text-green-600' : 'text-red-600';
    const updateType = updatedPrices[order.price];
    const flashClass = updateType === 'up' ? 'flash-green' : updateType === 'down' ? 'flash-red' : '';

    return (
        <div 
          className={`relative grid grid-cols-3 gap-2 text-xs font-mono py-1 px-2 hover:bg-slate-100/70 transition-colors duration-150 cursor-pointer ${flashClass}`}
          onClick={() => onPriceClick(order.price)}
        >
            <div className={`absolute top-0 bottom-0 right-0 ${bgColor}`} style={{ width: barWidth }}></div>
            <span className={`z-10 ${textColor}`}>{order.price.toFixed(2)}</span>
            <span className="z-10 text-slate-600 text-right">{order.size.toFixed(4)}</span>
            <span className="z-10 text-slate-600 text-right">{order.total.toFixed(4)}</span>
        </div>
    );
  };

  return (
    <Card className="h-full flex flex-col" padding="p-0">
      <div className="flex items-center justify-between p-3 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900">Order Book</h3>
        <span className="text-xs text-green-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          LIVE
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-500 p-2 px-2 bg-slate-50">
        <span>Price (USD)</span>
        <span className="text-right">Amount ({symbol})</span>
        <span className="text-right">Total (USD)</span>
      </div>
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto">
          <div className="h-1/2 flex flex-col-reverse">
            {asks.slice(0, 20).map((ask, index) => (
              <OrderRow key={index} order={ask} type="ask" />
            ))}
          </div>
          <div className="py-2 text-center text-lg font-bold text-slate-800 border-y border-slate-200 bg-slate-50/50">
            {basePrice > 0 ? basePrice.toFixed(2) : '-'}
          </div>
          <div className="h-1/2 flex flex-col">
            {bids.slice(0, 20).map((bid, index) => (
              <OrderRow key={index} order={bid} type="bid" />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default OrderBook;