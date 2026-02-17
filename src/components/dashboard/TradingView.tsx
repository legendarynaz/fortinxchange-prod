import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import type { Market, AppConfig } from '../../types';
import TradingChart from './TradingChart';
import OrderBook from './OrderBook';
import TradeHistory from './TradeHistory';
import MarketInfo from './MarketInfo';
import PriceAlerts from '../alerts/PriceAlerts';
import OpenOrders from '../orders/OpenOrders';
import Web3Swap from '../trading/Web3Swap';
import { fetchLivePrice } from '../../services/geminiService';

const FALLBACK_PRICES: Record<string, number> = {
  'BTC': 68500,
  'ETH': 3800,
  'SOL': 165,
  'DOGE': 0.16,
  'XRP': 0.52,
};

interface TradingViewProps {
  market: Market;
  appConfig: AppConfig;
}

const TradingView: React.FC<TradingViewProps> = ({ market, appConfig }) => {
  const { isConnected } = useAccount();
  const [initialPrice, setInitialPrice] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [orderPrice, setOrderPrice] = useState<string>('');
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>(FALLBACK_PRICES);
  
  const handlePriceClick = useCallback((price: number) => {
    setOrderPrice(price.toFixed(2));
  }, []);

  useEffect(() => {
    const getPrice = async () => {
      setInitialPrice(0); // Reset to show loading state
      setCurrentPrice(0);
      setOrderPrice('');

      let newInitialPrice: number | null = 0;

      if (appConfig.rateMode === 'manual') {
        newInitialPrice = appConfig.manualRates[market.base] || FALLBACK_PRICES[market.base] || 0;
      } else {
        // Live mode
        const livePrice = await fetchLivePrice(market.base, market.quote);
        newInitialPrice = livePrice || FALLBACK_PRICES[market.base] || 0;
      }

      setInitialPrice(newInitialPrice);
    };
    getPrice();
  }, [market, appConfig.rateMode, appConfig.manualRates]);
  
  useEffect(() => {
    if (currentPrice > 0 && !orderPrice) {
      setOrderPrice(currentPrice.toFixed(2));
    }
  }, [currentPrice, orderPrice]);

  // Update current prices for alerts
  useEffect(() => {
    if (currentPrice > 0) {
      setCurrentPrices(prev => ({ ...prev, [market.base]: currentPrice }));
    }
  }, [currentPrice, market.base]);

  return (
    <main className="flex-1 p-2 sm:p-4 grid grid-cols-1 xl:grid-cols-[300px_1fr_340px] gap-4 h-full overflow-hidden">
      {/* Trading Mode Banner */}
      {isConnected ? (
        <div className="col-span-full bg-green-500/10 border border-green-500/30 rounded-lg p-2 mb-2">
          <p className="text-center text-green-600 dark:text-green-400 text-sm font-medium">
            🔗 LIVE TRADING - Wallet connected • Real funds will be used
          </p>
        </div>
      ) : (
        <div className="col-span-full bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 mb-2">
          <p className="text-center text-blue-600 dark:text-blue-400 text-sm font-medium">
            👛 Connect your wallet in the Wallet tab to enable real trading
          </p>
        </div>
      )}
      
      <div className="hidden xl:flex flex-col gap-4 min-h-0">
        <div className="flex-1 min-h-0">
          <OrderBook basePrice={currentPrice} onPriceClick={handlePriceClick} />
        </div>
        <div className="flex-1 min-h-0">
         <TradeHistory market={market} basePrice={currentPrice} />
        </div>
      </div>
      
      <div className="flex flex-col gap-4 min-h-0">
        <div className="flex-shrink-0">
          {isConnected ? (
            <Web3Swap />
          ) : (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Start Trading</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Connect your wallet or deposit funds to begin real-time trading
                </p>
                <div className="space-y-3">
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate', { detail: 'wallet' })); }}
                    className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    Connect Wallet
                  </a>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate', { detail: 'wallet' })); }}
                    className="block w-full bg-gray-700 text-white font-medium py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Deposit Funds
                  </a>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Trade ETH, USDT, USDC, WBTC on decentralized exchanges
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-h-[300px] sm:min-h-[400px]">
          <TradingChart 
            key={`${market.id}-${initialPrice}`}
            market={market} 
            initialPrice={initialPrice}
            onPriceChange={setCurrentPrice} 
          />
        </div>
        <div className="xl:hidden flex flex-col md:flex-row gap-4">
            <div className="flex-1 min-h-[400px]">
                <OrderBook basePrice={currentPrice} onPriceClick={handlePriceClick} />
            </div>
            <div className="flex-1 min-h-[400px]">
                <TradeHistory market={market} basePrice={currentPrice} />
            </div>
        </div>
      </div>

      <div className="hidden xl:flex flex-col gap-4 min-h-0 overflow-auto">
        <MarketInfo market={market} />
        <OpenOrders currentPrice={currentPrice} market={market.id} />
        <PriceAlerts currentPrices={currentPrices} />
      </div>

    </main>
  );
};

export default TradingView;
