import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Send, QrCode, ArrowDownUp, RefreshCw, Plus, TrendingUp, TrendingDown, Bell } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { getAllBalances, type TokenBalance, calculateTotalValue } from '../../services/balanceService';
import { enrichBalancesWithPrices, formatUSD } from '../../services/priceService';
import SmartInsights from '../insights/SmartInsights';
import AIChatModal from '../insights/AIChatModal';
import TokenScannerModal from '../insights/TokenScannerModal';
import AddTokenModal from './AddTokenModal';
import PortfolioChart from '../portfolio/PortfolioChart';
import MultiChainAssets from './MultiChainAssets';

interface WalletHomeProps {
  onSend: (token?: string) => void;
  onReceive: (token?: string) => void;
}

const WalletHome: React.FC<WalletHomeProps> = ({ onSend, onReceive }) => {
  const { activeAccount, chainId, chain, bitcoinAddress, bitcoinBalance, bitcoinPrice, refreshBitcoinBalance, tronAddress, tronBalance, tronPrice, refreshTronBalance } = useWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [totalUSD, setTotalUSD] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeAccount?.address) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch on-chain balances
      let bals = await getAllBalances(activeAccount.address, chainId, true);
      
      // Enrich with prices
      bals = await enrichBalancesWithPrices(bals);
      
      // Sort by USD value
      bals.sort((a, b) => (b.balanceUSD || 0) - (a.balanceUSD || 0));
      
      setBalances(bals);
      setTotalUSD(calculateTotalValue(bals));
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, [activeAccount?.address, chainId]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
    refreshBitcoinBalance();
    refreshTronBalance();
  };

  // Calculate total including Bitcoin and Tron
  const bitcoinValueUSD = bitcoinBalance ? (bitcoinBalance.total / 100000000) * bitcoinPrice : 0;
  const tronValueUSD = tronBalance ? (tronBalance.trx / 1000000) * tronPrice : 0;
  const grandTotalUSD = totalUSD + bitcoinValueUSD + tronValueUSD;

  const formatCrypto = (value: string, decimals: number = 6) => {
    if (hideBalance) return '••••••';
    const num = parseFloat(value);
    if (num === 0) return '0';
    if (num < 0.000001) return '<0.000001';
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: decimals 
    });
  };

  const handleSwap = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'swap' } }));
  };

  return (
    <div className="flex-1 bg-app-bg">
      {/* Portfolio Header */}
      <div className="px-4 pt-6 pb-4">
        {/* Network indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: chain.iconColor }}
          />
          <span className="text-gray-400 text-sm">{chain.name}</span>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Total Balance</span>
          <button onClick={() => setHideBalance(!hideBalance)} className="p-1">
            {hideBalance ? (
              <EyeOff className="w-5 h-5 text-gray-500" />
            ) : (
              <Eye className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">
            {hideBalance ? '••••••' : formatUSD(grandTotalUSD)}
          </span>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1"
          >
            <RefreshCw className={`w-5 h-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <button 
            onClick={() => onSend()}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors bg-card-bg hover:bg-card-hover"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-light">
              <Send className="w-6 h-6 text-accent" />
            </div>
            <span className="text-white text-sm font-medium">Send</span>
          </button>
          
          <button 
            onClick={() => onReceive()}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors bg-card-bg hover:bg-card-hover"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-light">
              <QrCode className="w-6 h-6 text-accent" />
            </div>
            <span className="text-white text-sm font-medium">Receive</span>
          </button>
          
          <button 
            onClick={handleSwap}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors bg-card-bg hover:bg-card-hover"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-light">
              <ArrowDownUp className="w-6 h-6 text-accent" />
            </div>
            <span className="text-white text-sm font-medium">Swap</span>
          </button>
        </div>
      </div>

      {/* Portfolio Chart */}
      <div className="px-4 mt-2 mb-4">
        <PortfolioChart symbol={chain.symbol} />
      </div>

      {/* Quick Links - Price Alerts */}
      <div className="px-4 mb-4">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'alerts' } }))}
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-colors bg-card-bg hover:bg-card-hover"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent-light">
              <Bell className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium">Price Alerts</p>
              <p className="text-gray-400 text-sm">Get notified on price movements</p>
            </div>
          </div>
          <span className="text-sm text-accent">Set up →</span>
        </button>
      </div>

      {/* Smart Insights Section */}
      <div className="px-4 mt-2 mb-6">
        <SmartInsights
          holdings={balances.map(b => ({
            symbol: b.symbol,
            balance: parseFloat(b.balanceFormatted),
            value: b.balanceUSD || 0
          }))}
          totalValue={totalUSD}
          onOpenChat={() => {
            console.log('[WalletHome] Opening AI Chat');
            setShowAIChat(true);
          }}
          onOpenScanner={() => setShowScanner(true)}
        />
      </div>

      {/* Bitcoin Section */}
      {bitcoinAddress && (
        <div className="px-4 mb-4">
          <h2 className="text-lg font-semibold text-white mb-3">Bitcoin</h2>
          <button
            onClick={() => onReceive('BTC')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl transition-colors bg-gradient-to-r from-btc/10 to-btc/5 border border-btc/20 hover:bg-btc/20"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-btc">
              <span className="text-white font-bold text-lg">₿</span>
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-lg">Bitcoin</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-btc/20 text-btc">Native</span>
              </div>
              <div className="text-gray-400 text-sm">
                {bitcoinPrice > 0 ? `$${bitcoinPrice.toLocaleString()}` : 'Loading...'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-semibold">
                {hideBalance ? '••••••' : (
                  bitcoinBalance ? `${(bitcoinBalance.total / 100000000).toFixed(8)} BTC` : '0 BTC'
                )}
              </div>
              <div className="text-gray-400 text-sm">
                {hideBalance ? '••••••' : formatUSD(bitcoinValueUSD)}
              </div>
            </div>
          </button>
          {bitcoinAddress && (
            <div className="mt-2 text-center">
              <p className="text-gray-500 text-xs truncate">Address: {bitcoinAddress}</p>
            </div>
          )}
        </div>
      )}

      {/* Multi-Chain Assets (XRP, SOL, LTC, DOGE, etc.) */}
      <MultiChainAssets hideBalance={hideBalance} onReceive={onReceive} />

      {/* Tron Section */}
      {tronAddress && (
        <div className="px-4 mb-4">
          <h2 className="text-lg font-semibold text-white mb-3">Tron</h2>
          <button
            onClick={() => onReceive('TRX')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl transition-colors bg-gradient-to-r from-trx/10 to-trx/5 border border-trx/20 hover:bg-trx/20"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-trx">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-lg">Tron</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-trx/20 text-trx">TRX</span>
              </div>
              <div className="text-gray-400 text-sm">
                {tronPrice > 0 ? `$${tronPrice.toFixed(4)}` : 'Loading...'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-semibold">
                {hideBalance ? '••••••' : (
                  tronBalance ? `${tronBalance.trxFormatted} TRX` : '0 TRX'
                )}
              </div>
              <div className="text-gray-400 text-sm">
                {hideBalance ? '••••••' : formatUSD(tronValueUSD)}
              </div>
            </div>
          </button>
          {tronAddress && (
            <div className="mt-2 text-center">
              <p className="text-gray-500 text-xs truncate">Address: {tronAddress}</p>
            </div>
          )}
          {/* TRC20 Tokens */}
          {tronBalance && tronBalance.tokens.length > 0 && (
            <div className="mt-3 space-y-2">
              {tronBalance.tokens.map((token) => (
                <div
                  key={token.contractAddress}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card-bg"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-trx/20">
                    <span className="font-bold text-xs text-trx">{token.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-white text-sm font-medium">{token.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white text-sm">
                      {hideBalance ? '••••••' : parseFloat(token.balanceFormatted).toFixed(4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assets Section */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{chain.name} Assets</h2>
            <button 
              onClick={() => setShowAddToken(true)}
              className="flex items-center gap-1 text-sm transition-colors text-accent hover:text-accent/80"
            >
            <Plus className="w-4 h-4" />
            Add Token
          </button>
        </div>

        {isLoading ? (
          // Skeleton loader
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl animate-pulse bg-card-bg">
                <div className="w-10 h-10 bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="w-20 h-4 bg-gray-700 rounded mb-2" />
                  <div className="w-16 h-3 bg-gray-700 rounded" />
                </div>
                <div className="text-right">
                  <div className="w-24 h-4 bg-gray-700 rounded mb-2" />
                  <div className="w-16 h-3 bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 mb-2">No assets yet</p>
            <p className="text-gray-500 text-sm">
              Receive some {chain.symbol} to get started on {chain.name}.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {balances.map((token) => {
              const priceChange = token.priceChange24h || 0;

              return (
                <button
                  key={token.address}
                  onClick={() => onSend(token.symbol)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl transition-colors bg-card-bg hover:bg-card-hover"
                >
                  {/* Token Icon */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: token.isNative ? `${chain.iconColor}20` : '#F0B90B20' }}
                  >
                    <span 
                      className="font-bold text-sm"
                      style={{ color: token.isNative ? chain.iconColor : '#F0B90B' }}
                    >
                      {token.symbol.slice(0, 2)}
                    </span>
                  </div>
                  
                  {/* Token Info */}
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">{token.symbol}</div>
                    <div className="flex items-center gap-1 text-sm">
                      {token.price && (
                        <>
                          <span className="text-gray-400">
                            ${token.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </span>
                          <span className={`flex items-center ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {priceChange >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-0.5" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-0.5" />
                            )}
                            {Math.abs(priceChange).toFixed(2)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Balance */}
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {formatCrypto(token.balanceFormatted)}
                    </div>
                    {token.balanceUSD !== undefined && (
                      <div className="text-gray-400 text-sm">
                        {hideBalance ? '••••••' : formatUSD(token.balanceUSD)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Chat Modal */}
      <AIChatModal
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        holdings={balances.map(b => ({
          symbol: b.symbol,
          balance: parseFloat(b.balanceFormatted),
          value: b.balanceUSD || 0
        }))}
        totalValue={totalUSD}
      />

      {/* Token Scanner Modal */}
      <TokenScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
      />

      {/* Add Token Modal */}
      <AddTokenModal
        isOpen={showAddToken}
        onClose={() => setShowAddToken(false)}
        onTokenAdded={handleRefresh}
      />
    </div>
  );
};

export default WalletHome;
