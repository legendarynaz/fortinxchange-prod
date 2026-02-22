import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  Fuel,
  Shield,
  ChevronRight,
  RefreshCw,
  Bot
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { 
  analyzePortfolio, 
  getPortfolioHealth,
  type PortfolioInsight,
  type PortfolioHealth 
} from '../../services/aiAssistantService';
import { 
  getGasPrice, 
  formatGasPrice, 
  getGasStatus,
  type GasPriceFormatted 
} from '../../services/gasService';

interface SmartInsightsProps {
  holdings: Array<{ symbol: string; balance: number; value: number }>;
  totalValue: number;
  onOpenChat: () => void;
  onOpenScanner: () => void;
}

const SmartInsights: React.FC<SmartInsightsProps> = ({ 
  holdings, 
  totalValue,
  onOpenChat,
  onOpenScanner
}) => {
  const { chainId, chain } = useWallet();
  const [insights, setInsights] = useState<PortfolioInsight[]>([]);
  const [health, setHealth] = useState<PortfolioHealth | null>(null);
  const [gasPrice, setGasPrice] = useState<GasPriceFormatted | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInsights();
    loadGasPrice();
  }, [holdings, totalValue, chainId]);

  const loadInsights = async () => {
    if (holdings.length === 0 || totalValue === 0) {
      setIsLoading(false);
      return;
    }
    
    try {
      const [portfolioInsights, portfolioHealth] = await Promise.all([
        analyzePortfolio(holdings, totalValue),
        Promise.resolve(getPortfolioHealth(holdings, totalValue)),
      ]);
      setInsights(portfolioInsights);
      setHealth(portfolioHealth);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
    setIsLoading(false);
  };

  const loadGasPrice = async () => {
    try {
      const price = await getGasPrice(chainId);
      setGasPrice(formatGasPrice(price, chainId));
    } catch (error) {
      console.error('Failed to load gas price:', error);
    }
  };

  const getInsightIcon = (type: PortfolioInsight['type']) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <Lightbulb className="w-4 h-4" />;
      case 'action': return <ChevronRight className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: PortfolioInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'text-green-400 bg-green-500/10';
      case 'risk': return 'text-red-400 bg-red-500/10';
      case 'info': return 'text-blue-400 bg-blue-500/10';
      case 'action': return 'text-yellow-400 bg-yellow-500/10';
    }
  };

  const gasStatus = gasPrice ? getGasStatus(gasPrice.standard, chainId) : null;

  const getHealthColor = (score: number) => {
    if (score >= 70) return '#22c55e';
    if (score >= 50) return '#eab308';
    return '#ef4444';
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[#1A1A2E] to-[#252542] rounded-2xl p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-20 bg-gray-700 rounded mb-3" />
        <div className="h-16 bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with AI Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">Smart Insights</span>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">AI</span>
        </div>
        <button 
          onClick={loadInsights}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            console.log('[SmartInsights] AI Assistant button clicked');
            onOpenChat();
          }}
          className="flex-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-xl p-3 flex items-center gap-2 transition-all"
        >
          <Bot className="w-5 h-5 text-purple-400" />
          <div className="text-left">
            <p className="text-white text-sm font-medium">AI Assistant</p>
            <p className="text-gray-400 text-xs">Ask anything</p>
          </div>
        </button>
        <button
          onClick={onOpenScanner}
          className="flex-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-xl p-3 flex items-center gap-2 transition-all"
        >
          <Shield className="w-5 h-5 text-green-400" />
          <div className="text-left">
            <p className="text-white text-sm font-medium">Token Scanner</p>
            <p className="text-gray-400 text-xs">Check safety</p>
          </div>
        </button>
      </div>

      {/* Portfolio Health & Gas */}
      <div className="grid grid-cols-2 gap-3">
        {/* Portfolio Health */}
        {health && (
          <div className="bg-[#1A1A2E] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">Portfolio Health</span>
              <span 
                className="text-lg font-bold"
                style={{ color: getHealthColor(health.score) }}
              >
                {health.score}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className="h-2 rounded-full transition-all"
                style={{ 
                  width: `${health.score}%`,
                  backgroundColor: getHealthColor(health.score)
                }}
              />
            </div>
            <p className="text-gray-500 text-xs capitalize">{health.diversification} diversification</p>
          </div>
        )}

        {/* Gas Widget */}
        {gasPrice && gasStatus && (
          <div className="bg-[#1A1A2E] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <Fuel className="w-3 h-3" /> Gas
              </span>
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${gasStatus.color}20`,
                  color: gasStatus.color 
                }}
              >
                {gasStatus.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{gasPrice.standard}</p>
            <p className="text-gray-500 text-xs">{gasPrice.unit} on {chain.name}</p>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.slice(0, 3).map((insight, idx) => (
            <div 
              key={idx}
              className="bg-[#1A1A2E] rounded-xl p-3 flex items-start gap-3"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getInsightColor(insight.type)}`}>
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{insight.title}</p>
                <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{insight.description}</p>
              </div>
              {insight.actionLabel && (
                <button className="text-[#F0B90B] text-xs font-medium whitespace-nowrap">
                  {insight.actionLabel} →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {holdings.length === 0 && (
        <div className="bg-[#1A1A2E] rounded-xl p-6 text-center">
          <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Your insights will appear here</p>
          <p className="text-gray-500 text-sm">Add tokens to your wallet to get AI-powered insights</p>
        </div>
      )}
    </div>
  );
};

export default SmartInsights;
