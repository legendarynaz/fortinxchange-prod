import React, { useState, useEffect, useCallback } from 'react';
import type { Market, GroundingSource } from '../../types';
import { fetchMarketAnalysis } from '../../services/geminiService';
import Card from '../ui/Card';
import SparklesIcon from '../icons/SparklesIcon';

interface MarketInfoProps {
  market: Market;
}

const MarketInfo: React.FC<MarketInfoProps> = ({ market }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getAnalysis = useCallback(async () => {
    setIsLoading(true);
    setAnalysis('');
    setSources([]);
    const result = await fetchMarketAnalysis(market.base);
    setAnalysis(result.analysis);
    setSources(result.sources);
    setIsLoading(false);
  }, [market]);

  useEffect(() => {
    getAnalysis();
  }, [getAnalysis]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{analysis}</p>
        {sources.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sources</h4>
            <ul className="space-y-1.5">
              {sources.map((source, index) => (
                <li key={index}>
                  <a
                    href={source.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 hover:text-sky-700 text-sm truncate block hover:underline"
                    title={source.web.title}
                  >
                    {source.web.title || source.web.uri}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-sky-500"/>
            AI Market Analysis: {market.base}
        </h3>
        <button onClick={getAnalysis} disabled={isLoading} className="text-xs text-slate-500 hover:text-slate-900 disabled:opacity-50">Refresh</button>
      </div>
      {renderContent()}
    </Card>
  );
};

export default MarketInfo;