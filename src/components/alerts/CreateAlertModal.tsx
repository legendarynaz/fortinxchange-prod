import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { createAlert, POPULAR_ALERT_TOKENS } from '../../services/priceAlertService';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  prices: Record<string, number>;
}

const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  prices,
}) => {
  const [selectedToken, setSelectedToken] = useState<{ symbol: string; name: string } | null>(null);
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState<'select' | 'configure'>('select');

  if (!isOpen) return null;

  const handleSelectToken = (token: { symbol: string; name: string }) => {
    setSelectedToken(token);
    const currentPrice = prices[token.symbol];
    if (currentPrice) {
      // Default to +10% for above, -10% for below
      const suggestedPrice = condition === 'above' 
        ? currentPrice * 1.1 
        : currentPrice * 0.9;
      setTargetPrice(suggestedPrice.toFixed(suggestedPrice < 1 ? 6 : 2));
    }
    setStep('configure');
  };

  const handleCreate = () => {
    if (!selectedToken || !targetPrice) return;

    createAlert({
      symbol: selectedToken.symbol,
      tokenName: selectedToken.name,
      targetPrice: parseFloat(targetPrice),
      condition,
      currentPrice: prices[selectedToken.symbol],
    });

    // Reset state
    setSelectedToken(null);
    setTargetPrice('');
    setCondition('above');
    setStep('select');
    onCreated();
  };

  const handleBack = () => {
    setStep('select');
    setSelectedToken(null);
  };

  const filteredTokens = POPULAR_ALERT_TOKENS.filter(
    t => t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
         t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentPrice = selectedToken ? prices[selectedToken.symbol] : 0;

  const formatPrice = (price: number): string => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="w-full bg-[#1A1A2E] rounded-t-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {step === 'configure' && (
              <button onClick={handleBack} className="text-gray-400 hover:text-white">
                ←
              </button>
            )}
            <h3 className="text-lg font-semibold text-white">
              {step === 'select' ? 'Select Token' : 'Set Alert'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {step === 'select' ? (
          <>
            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens..."
                  className="w-full bg-[#0D1117] text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#F0B90B] placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Token List */}
            <div className="overflow-auto max-h-[50vh] p-4 pt-0">
              <div className="space-y-2">
                {filteredTokens.map((token) => {
                  const price = prices[token.symbol];
                  return (
                    <button
                      key={token.symbol}
                      onClick={() => handleSelectToken(token)}
                      className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[#252542] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                          <span className="text-[#F0B90B] font-bold text-sm">
                            {token.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{token.symbol}</p>
                          <p className="text-gray-500 text-sm">{token.name}</p>
                        </div>
                      </div>
                      {price && (
                        <span className="text-white font-medium">{formatPrice(price)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 space-y-6">
            {/* Selected Token */}
            {selectedToken && (
              <div className="bg-[#0D1117] rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#F0B90B] font-bold">
                      {selectedToken.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{selectedToken.symbol}</p>
                    <p className="text-gray-400">{selectedToken.name}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-gray-500 text-sm">Current Price</p>
                    <p className="text-white font-semibold">
                      {currentPrice ? formatPrice(currentPrice) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Condition */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Alert When Price Goes</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCondition('above')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    condition === 'above'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <TrendingUp className={`w-5 h-5 ${condition === 'above' ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className={condition === 'above' ? 'text-green-500 font-medium' : 'text-gray-400'}>
                    Above
                  </span>
                </button>
                <button
                  onClick={() => setCondition('below')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    condition === 'below'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <TrendingDown className={`w-5 h-5 ${condition === 'below' ? 'text-red-500' : 'text-gray-400'}`} />
                  <span className={condition === 'below' ? 'text-red-500 font-medium' : 'text-gray-400'}>
                    Below
                  </span>
                </button>
              </div>
            </div>

            {/* Target Price */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Target Price (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#0D1117] text-white text-xl font-semibold pl-8 pr-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-[#F0B90B] placeholder:text-gray-600"
                />
              </div>
              
              {/* Quick adjust buttons */}
              {currentPrice > 0 && (
                <div className="flex gap-2 mt-3">
                  {[5, 10, 20, 50].map(percent => (
                    <button
                      key={percent}
                      onClick={() => {
                        const multiplier = condition === 'above' 
                          ? 1 + percent / 100 
                          : 1 - percent / 100;
                        const newPrice = currentPrice * multiplier;
                        setTargetPrice(newPrice.toFixed(newPrice < 1 ? 6 : 2));
                      }}
                      className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 text-sm"
                    >
                      {condition === 'above' ? '+' : '-'}{percent}%
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={!targetPrice || parseFloat(targetPrice) <= 0}
              className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-4 rounded-xl transition-colors"
            >
              Create Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateAlertModal;
