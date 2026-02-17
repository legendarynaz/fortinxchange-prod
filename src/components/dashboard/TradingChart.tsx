import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataPoint, Market } from '../../types';
import Card from '../ui/Card';
import { wsService } from '../../services/websocketService';

const generateInitialData = (length: number, initialPrice: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  let price = initialPrice;
  const now = new Date();
  for (let i = length - 1; i >= 0; i--) {
    // Start with smaller fluctuations for a smoother initial graph
    price += (Math.random() - 0.5) * (price * 0.005);
    const time = new Date(now.getTime() - i * 60 * 1000);
    data.push({ time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), price: parseFloat(price.toFixed(2)) });
  }
  return data;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    value?: number;
  }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-2 rounded-md border border-slate-200 text-sm shadow-md">
        <p className="label text-slate-500">{`Time : ${label}`}</p>
        <p className="intro text-slate-900 font-bold">{`Price : $${payload[0].value?.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

interface TradingChartProps {
    market: Market;
    initialPrice: number;
    onPriceChange: (price: number) => void;
}

const TradingChart: React.FC<TradingChartProps> = ({ market, initialPrice, onPriceChange }) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [change24h, setChange24h] = useState(0);

  // Handle WebSocket price updates
  const handlePriceUpdate = useCallback((symbol: string, price: number, change: number) => {
    if (symbol === market.base) {
      setIsLive(true);
      setChange24h(change);
      setData(currentData => {
        if (currentData.length === 0) return [];
        const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newData = [...currentData.slice(1), { time: newTime, price: parseFloat(price.toFixed(2)) }];
        onPriceChange(price);
        return newData;
      });
    }
  }, [market.base, onPriceChange]);

  // Initialize chart data
  useEffect(() => {
    if (initialPrice > 0) {
        const initialData = generateInitialData(50, initialPrice);
        setData(initialData);
        if (initialData.length > 0) {
            onPriceChange(initialData[initialData.length - 1].price);
        }
    }
  }, [initialPrice, market.id]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    const unsubscribe = wsService.subscribe(market.base, handlePriceUpdate);
    return () => unsubscribe();
  }, [market.base, handlePriceUpdate]);
  
  // Fallback simulation when WebSocket not connected
  useEffect(() => {
    if (data.length === 0 || isLive) return;

    const interval = setInterval(() => {
      setData(currentData => {
        if (currentData.length === 0) return [];
        const lastDataPoint = currentData[currentData.length - 1];
        const newPrice = lastDataPoint.price + (Math.random() - 0.5) * (lastDataPoint.price * 0.0015);
        const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newData = [...currentData.slice(1), { time: newTime, price: parseFloat(newPrice.toFixed(2)) }];
        onPriceChange(newData[newData.length - 1].price);
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [data.length, isLive, onPriceChange]);

  if (data.length === 0) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg">
             <div className="text-center">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-slate-500">Fetching live price...</p>
            </div>
        </div>
    )
  }

  const lastPrice = data[data.length - 1].price;
  const firstPrice = data[0].price;
  const isUp = lastPrice >= firstPrice;

  return (
    <Card className="h-full flex flex-col" padding="p-0">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
              <div className="flex items-baseline space-x-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{market.name}</h2>
                  <div className="flex items-baseline">
                    <span className={`text-xl font-bold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                      {lastPrice > 0 ? lastPrice.toFixed(2) : '-'}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">{market.quote}</span>
                  </div>
                  {change24h !== 0 && (
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      change24h >= 0 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      24h: {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                    </span>
                  )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className="text-slate-500 dark:text-slate-400">
                  {isLive ? 'Live' : 'Simulated'}
                </span>
              </div>
          </div>
      </div>
      <div className="flex-grow pt-4 pr-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPriceUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPriceDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} interval={Math.floor(data.length / 5)} />
            <YAxis domain={['dataMin - dataMin * 0.01', 'dataMax + dataMax * 0.01']} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} orientation="right" tickFormatter={(value) => typeof value === 'number' ? value.toFixed(0) : ''} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="price" stroke={isUp ? "#16a34a" : "#dc2626"} strokeWidth={2} fillOpacity={1} fill={`url(#${isUp ? 'colorPriceUp' : 'colorPriceDown'})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TradingChart;