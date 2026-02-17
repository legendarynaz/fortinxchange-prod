import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '../ui/Card';
import { wsService } from '../../services/websocketService';
import { useCurrency } from '../../context/CurrencyContext';

interface Holding {
  symbol: string;
  name: string;
  amount: number;
  avgBuyPrice: number;
  color: string;
}

interface PriceData {
  price: number;
  change24h: number;
}

const STORAGE_KEY = 'fortinx_portfolio_holdings';

// Mock initial holdings - in production these would come from backend
const DEFAULT_HOLDINGS: Holding[] = [
  { symbol: 'BTC', name: 'Bitcoin', amount: 0.5, avgBuyPrice: 62000, color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', amount: 5.2, avgBuyPrice: 3200, color: '#627EEA' },
  { symbol: 'SOL', name: 'Solana', amount: 25, avgBuyPrice: 140, color: '#00FFA3' },
  { symbol: 'DOGE', name: 'Dogecoin', amount: 10000, avgBuyPrice: 0.12, color: '#C2A633' },
  { symbol: 'XRP', name: 'Ripple', amount: 2000, avgBuyPrice: 0.48, color: '#23292F' },
];

const getStoredHoldings = (): Holding[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_HOLDINGS;
  } catch {
    return DEFAULT_HOLDINGS;
  }
};

const PortfolioDashboard: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [holdings] = useState<Holding[]>(getStoredHoldings);
  const [livePrices, setLivePrices] = useState<Record<string, PriceData>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to all price updates
    const unsubscribe = wsService.subscribeAll((symbol, price, change24h) => {
      setLivePrices(prev => ({
        ...prev,
        [symbol]: { price, change24h },
      }));
    });

    const unsubscribeConnection = wsService.onConnectionChange(setIsConnected);

    return () => {
      unsubscribe();
      unsubscribeConnection();
    };
  }, []);

  // Calculate portfolio values
  const portfolioData = holdings.map(holding => {
    const currentPrice = livePrices[holding.symbol]?.price || holding.avgBuyPrice;
    const change24h = livePrices[holding.symbol]?.change24h || 0;
    const currentValue = holding.amount * currentPrice;
    const costBasis = holding.amount * holding.avgBuyPrice;
    const pnl = currentValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    return {
      ...holding,
      currentPrice,
      change24h,
      currentValue,
      costBasis,
      pnl,
      pnlPercent,
    };
  });

  const totalValue = portfolioData.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCostBasis = portfolioData.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnL = totalValue - totalCostBasis;
  const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  // Pie chart data
  const pieData = portfolioData.map(h => ({
    name: h.symbol,
    value: h.currentValue,
    color: h.color,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = ((item.value / totalValue) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {formatCurrency(item.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-end gap-2 text-sm">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-slate-500 dark:text-slate-400">
          {isConnected ? 'Live prices' : 'Connecting...'}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Total P&L</p>
            <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </p>
            <p className={`text-sm ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Cost Basis</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalCostBasis)}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Pie Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Portfolio Allocation
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-slate-700 dark:text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Holdings List */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Holdings
          </h3>
          <div className="space-y-3">
            {portfolioData.map((holding) => (
              <div 
                key={holding.symbol}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: holding.color }}
                  >
                    {holding.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {holding.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {holding.amount.toLocaleString()} {holding.symbol}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(holding.currentValue)}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <span className={`text-sm ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                    </span>
                    {holding.change24h !== 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        holding.change24h >= 0 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        24h: {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Performance Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="pb-3 font-medium">Asset</th>
                <th className="pb-3 font-medium text-right">Amount</th>
                <th className="pb-3 font-medium text-right">Avg. Buy Price</th>
                <th className="pb-3 font-medium text-right">Current Price</th>
                <th className="pb-3 font-medium text-right">Value</th>
                <th className="pb-3 font-medium text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.map((holding) => (
                <tr 
                  key={holding.symbol} 
                  className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: holding.color }}
                      >
                        {holding.symbol.slice(0, 1)}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {holding.symbol}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                    {holding.amount.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                    ${holding.avgBuyPrice.toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-mono text-slate-900 dark:text-white">
                      ${holding.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                    {formatCurrency(holding.currentValue)}
                  </td>
                  <td className="py-3 text-right">
                    <span className={`font-mono ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                    </span>
                    <span className={`block text-xs ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t-2 border-slate-300 dark:border-slate-600">
                <td className="pt-3 text-slate-900 dark:text-white">Total</td>
                <td className="pt-3"></td>
                <td className="pt-3"></td>
                <td className="pt-3"></td>
                <td className="pt-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(totalValue)}
                </td>
                <td className="pt-3 text-right">
                  <span className={`font-mono ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PortfolioDashboard;
