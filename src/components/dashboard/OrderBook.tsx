import React, { useState, useEffect, useRef } from 'react';
import type { Order } from '../../types';
import Card from '../ui/Card';

const generateOrderBookData = (count: number, centerPrice: number, isBid: boolean): Order[] => {
  const orders: Order[] = [];
  let currentPrice = centerPrice;
  for (let i = 0; i < count; i++) {
    const priceFluctuation = Math.random() * (centerPrice * 0.001);
    currentPrice += isBid ? -priceFluctuation : priceFluctuation;
    const size = parseFloat((Math.random() * 5).toFixed(4));
    orders.push({
      price: parseFloat(currentPrice.toFixed(2)),
      size,
      total: parseFloat((currentPrice * size).toFixed(4)),
    });
  }
  return orders.sort((a, b) => (isBid ? b.price - a.price : a.price - b.price));
};


interface OrderBookProps {
    basePrice: number;
    onPriceClick: (price: number) => void;
}

const OrderBook: React.FC<OrderBookProps> = ({ basePrice, onPriceClick }) => {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const [updatedPrices, setUpdatedPrices] = useState<Record<string, 'up' | 'down'>>({});
  const prevBasePriceRef = useRef(basePrice);

  useEffect(() => {
    if (basePrice > 0 && Math.abs(basePrice - prevBasePriceRef.current) > basePrice * 0.01) {
        setBids(generateOrderBookData(20, basePrice, true));
        setAsks(generateOrderBookData(20, basePrice, false));
        prevBasePriceRef.current = basePrice;
    }
  }, [basePrice]);


  useEffect(() => {
    const interval = setInterval(() => {
        const updateOrders = (orders: Order[], isBid: boolean) => {
            if(orders.length === 0) return orders;
            const newOrders = [...orders];
            const randomIndex = Math.floor(Math.random() * newOrders.length);
            const factor = 0.9 + Math.random() * 0.2;
            const newSize = parseFloat((newOrders[randomIndex].size * factor).toFixed(4));
            
            const updatedPrice = newOrders[randomIndex].price;
            setUpdatedPrices(prev => ({...prev, [updatedPrice]: factor > 1 ? 'up' : 'down'}));
            setTimeout(() => setUpdatedPrices(prev => {
                const copy = {...prev};
                delete copy[updatedPrice];
                return copy;
            }), 750);

            if (newSize > 0.001) {
                newOrders[randomIndex].size = newSize;
                newOrders[randomIndex].total = parseFloat((newOrders[randomIndex].price * newSize).toFixed(4));
            } else {
                newOrders.splice(randomIndex, 1);
            }
            return newOrders.sort((a, b) => (isBid ? b.price - a.price : a.price - b.price));
        };

        setBids(bids => updateOrders(bids, true));
        setAsks(asks => updateOrders(asks, false));

    }, 1500);

    return () => clearInterval(interval);
  }, []);
  
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
      <h3 className="text-base font-bold text-slate-900 p-3 border-b border-slate-200">Order Book</h3>
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-500 p-2 px-2 bg-slate-50">
        <span>Price (USDT)</span>
        <span className="text-right">Amount (BTC)</span>
        <span className="text-right">Total (USDT)</span>
      </div>
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
    </Card>
  );
};

export default OrderBook;