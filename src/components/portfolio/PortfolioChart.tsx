import React, { useState, useEffect } from 'react';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import {
  getTokenPriceHistory,
  formatChartData,
  calculatePriceChange,
  downsampleData,
  type TimeRange,
} from '../../services/portfolioService';

interface PortfolioChartProps {
  symbol?: string;
}

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' },
];

const PortfolioChart: React.FC<PortfolioChartProps> = ({ 
  symbol = 'ETH',
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priceChange, setPriceChange] = useState({ change: 0, changePercent: 0, isPositive: true });
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    fetchChartData();
  }, [symbol, timeRange]);

  const fetchChartData = async () => {
    setIsLoading(true);
    try {
      const history = await getTokenPriceHistory(symbol, timeRange);
      
      if (history.length > 0) {
        const downsampled = downsampleData(history, 50);
        const formatted = formatChartData(downsampled, timeRange);
        setChartData(formatted);
        
        const change = calculatePriceChange(history);
        setPriceChange(change);
        
        setCurrentPrice(history[history.length - 1].price);
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    }
    setIsLoading(false);
  };

  const formatPrice = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(4)}`;
  };

  const chartColor = priceChange.isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="bg-[#1A1A2E] rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm">{symbol} Price</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {formatPrice(currentPrice)}
            </span>
            <span className={`flex items-center text-sm ${
              priceChange.isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {priceChange.isPositive ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {Math.abs(priceChange.changePercent).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 mb-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#F0B90B] animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['auto', 'auto']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={formatPrice}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value) => {
                  const numValue = typeof value === 'number' ? value : Number(value);
                  return [formatPrice(numValue), 'Price'];
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No data available
          </div>
        )}
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {TIME_RANGES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTimeRange(value)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === value
                ? 'bg-[#F0B90B] text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PortfolioChart;
