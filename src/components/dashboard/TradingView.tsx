
import React, { useState, useEffect, useCallback } from 'react';
import type { Market, AppConfig } from '../../types';
import TradingChart from './TradingChart';
import OrderBook from './OrderBook';
import OrderForm from './OrderForm';
import TradeHistory from './TradeHistory';
import MarketInfo from './MarketInfo';
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
  const [initialPrice, setInitialPrice] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [orderPrice, setOrderPrice] = useState<string>('');
  
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

  return (
    <main className="flex-1 p-2 sm:p-4 grid grid-cols-1 xl:grid-cols-[300px_1fr_340px] gap-4 h-full overflow-hidden">
      
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
          <OrderForm market={market} price={orderPrice} setPrice={setOrderPrice} />
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

      <div className="hidden xl:flex flex-col min-h-0">
        <MarketInfo market={market} />
      </div>

    </main>
  );
};

export default TradingView;
