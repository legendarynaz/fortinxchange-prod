import React from 'react';
import type { Market } from '../../types';
import Card from '../ui/Card';
import SparklesIcon from '../icons/SparklesIcon';

interface MarketInfoProps {
  market: Market;
}

const MarketInfo: React.FC<MarketInfoProps> = ({ market }) => {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-sky-500"/>
            Market Info: {market.base}
        </h3>
      </div>
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          View real-time market data and price information for {market.base}/{market.quote}.
        </p>
        <div className="text-xs text-slate-500">
          <p>• Check the chart for price trends</p>
          <p>• Review order book for liquidity</p>
          <p>• Monitor trade history for market activity</p>
        </div>
      </div>
    </Card>
  );
};

export default MarketInfo;
