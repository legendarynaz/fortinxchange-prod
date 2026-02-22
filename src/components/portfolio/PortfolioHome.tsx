// 4ortin-X Portfolio Home
// Main landing page with portfolio overview and quick actions

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, TrendingUp, Wallet, Settings, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import CryptoBackground from '../ui/CryptoBackground';
import { useCurrency } from '../../context/CurrencyContext';
import { getActiveAccount, getActiveAccountAddresses, formatAddress } from '../../services/walletService';
import { wsService } from '../../services/websocketService';
import { SUPPORTED_CHAINS } from '../../domain/registry';

interface BalanceItem {
  chainId: string;
  symbol: string;
  name: string;
  balance: string;
  balanceUsd: number;
  price: number;
  change24h: number;
  color: string;
}

const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  bitcoin: '#F7931A',
  tron: '#EF0027',
  bsc: '#F0B90B',
  polygon: '#8247E5',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',
  avalanche: '#E84142',
  base: '#0052FF',
};

const PortfolioHome: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [isConnected, setIsConnected] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalChange24h] = useState(0);
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [selectedChain, setSelectedChain] = useState('ethereum');

  // Get wallet addresses
  useEffect(() => {
    const addrs = getActiveAccountAddresses();
    setAddresses(addrs);
  }, []);

  // Subscribe to price updates
  useEffect(() => {
    const handlePrice = (symbol: string, price: number, change24h: number) => {
      setBalances(prev => {
        const updated = prev.map(b => {
          if (b.symbol === symbol) {
            return {
              ...b,
              price,
              change24h,
              balanceUsd: parseFloat(b.balance) * price,
            };
          }
          return b;
        });
        
        // Update totals
        const total = updated.reduce((sum, b) => sum + b.balanceUsd, 0);
        setTotalBalance(total);
        
        return updated;
      });
    };

    const unsubscribe = wsService.subscribeAll(handlePrice);
    const unsubscribeConnection = wsService.onConnectionChange(setIsConnected);

    // Initialize with mock balances for demo
    const initialBalances: BalanceItem[] = [
      { chainId: 'ethereum', symbol: 'ETH', name: 'Ethereum', balance: '1.5', balanceUsd: 0, price: 0, change24h: 0, color: CHAIN_COLORS.ethereum },
      { chainId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', balance: '0.05', balanceUsd: 0, price: 0, change24h: 0, color: CHAIN_COLORS.bitcoin },
      { chainId: 'tron', symbol: 'TRX', name: 'TRON', balance: '5000', balanceUsd: 0, price: 0, change24h: 0, color: CHAIN_COLORS.tron },
      { chainId: 'bsc', symbol: 'BNB', name: 'BNB', balance: '2.0', balanceUsd: 0, price: 0, change24h: 0, color: CHAIN_COLORS.bsc },
    ];
    setBalances(initialBalances);

    return () => {
      unsubscribe();
      unsubscribeConnection();
    };
  }, []);

  const account = getActiveAccount();

  const QuickAction: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
  }> = ({ icon, label, onClick, color = 'bg-sky-600' }) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
    >
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white`}>
        {icon}
      </div>
      <span className="text-sm text-slate-300">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 relative">
      <CryptoBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">4</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">4ortin-X</h1>
              <p className="text-xs text-slate-400">Multi-Chain Wallet</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-slate-400">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Total Balance Card */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm mb-2">Total Balance</p>
              <p className="text-4xl font-bold text-white mb-2">
                {formatCurrency(totalBalance || 25420.50)}
              </p>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                totalChange24h >= 0 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'bg-red-500/10 text-red-400'
              }`}>
                <TrendingUp className="w-4 h-4" />
                <span>{totalChange24h >= 0 ? '+' : ''}{(totalChange24h || 3.24).toFixed(2)}% (24h)</span>
              </div>
            </div>
            
            {/* Wallet Address */}
            {account && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Wallet Address</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-slate-300 bg-slate-800 px-3 py-1 rounded">
                      {formatAddress(addresses[selectedChain] || account.address, 6)}
                    </code>
                    <select
                      value={selectedChain}
                      onChange={(e) => setSelectedChain(e.target.value)}
                      className="text-xs bg-slate-800 text-slate-300 rounded px-2 py-1 border-none"
                    >
                      {Object.keys(addresses).map(chainId => (
                        <option key={chainId} value={chainId}>
                          {SUPPORTED_CHAINS[chainId]?.name || chainId}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3">
            <QuickAction
              icon={<ArrowUpRight className="w-6 h-6" />}
              label="Send"
              onClick={() => navigate('/wallet?action=send')}
              color="bg-orange-600"
            />
            <QuickAction
              icon={<ArrowDownLeft className="w-6 h-6" />}
              label="Receive"
              onClick={() => navigate('/wallet?action=receive')}
              color="bg-green-600"
            />
            <QuickAction
              icon={<RefreshCcw className="w-6 h-6" />}
              label="Swap"
              onClick={() => navigate('/swap')}
              color="bg-purple-600"
            />
            <QuickAction
              icon={<TrendingUp className="w-6 h-6" />}
              label="Earn"
              onClick={() => navigate('/earn')}
              color="bg-sky-600"
            />
          </div>

          {/* Assets List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Assets</h3>
              <button
                onClick={() => navigate('/wallet')}
                className="text-sky-400 text-sm hover:text-sky-300 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {balances.map((balance) => (
                <div
                  key={balance.chainId}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/wallet?chain=${balance.chainId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: balance.color }}
                    >
                      {balance.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{balance.name}</p>
                      <p className="text-sm text-slate-400">
                        {parseFloat(balance.balance).toLocaleString()} {balance.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">
                      {formatCurrency(balance.balanceUsd || parseFloat(balance.balance) * 2500)}
                    </p>
                    <p className={`text-sm ${balance.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {balance.change24h >= 0 ? '+' : ''}{(balance.change24h || 2.5).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-slate-800/50 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <button
                onClick={() => navigate('/history')}
                className="text-sky-400 text-sm hover:text-sky-300 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-center py-8 text-slate-400">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recent transactions</p>
              <p className="text-sm mt-1">Your transaction history will appear here</p>
            </div>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 z-20 bg-slate-900/95 backdrop-blur border-t border-slate-800">
        <div className="max-w-md mx-auto flex justify-around py-3">
          {[
            { path: '/portfolio', label: 'Portfolio', icon: '📊', active: true },
            { path: '/wallet', label: 'Wallet', icon: '💰' },
            { path: '/swap', label: 'Swap', icon: '🔄' },
            { path: '/earn', label: 'Earn', icon: '📈' },
            { path: '/settings', label: 'Settings', icon: '⚙️' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-colors ${
                item.active
                  ? 'text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default PortfolioHome;
