import React, { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { MAINNET_CHAINS, TESTNET_CHAINS, type ChainConfig } from '../../config/chains';

interface NetworkSelectorProps {
  compact?: boolean;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ compact = false }) => {
  const { chain, switchChain } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [showTestnets, setShowTestnets] = useState(false);

  const handleSelect = (chainConfig: ChainConfig) => {
    switchChain(chainConfig.id);
    setIsOpen(false);
  };

  const ChainIcon: React.FC<{ chain: ChainConfig; size?: number }> = ({ chain: c, size = 24 }) => (
    <div 
      className="rounded-full flex items-center justify-center"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: `${c.iconColor}20` 
      }}
    >
      <span 
        className="font-bold"
        style={{ 
          color: c.iconColor,
          fontSize: size * 0.4 
        }}
      >
        {c.shortName.slice(0, 2)}
      </span>
    </div>
  );

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 rounded-xl transition-colors ${
          compact 
            ? 'bg-[#1A1A2E] hover:bg-[#252542] px-2 py-1.5' 
            : 'bg-[#1A1A2E] hover:bg-[#252542] px-3 py-2'
        }`}
      >
        <ChainIcon chain={chain} size={compact ? 20 : 24} />
        {!compact && (
          <>
            <span className="text-white text-sm font-medium">{chain.shortName}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-end justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full bg-[#1A1A2E] rounded-t-3xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Select Network</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Network list */}
            <div className="overflow-auto max-h-[60vh] p-4 pb-8">
              {/* Native Networks (non-EVM) */}
              <div className="mb-4">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-2">Native</p>
                <div className="space-y-1">
                  {/* Bitcoin */}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'receive', network: 'bitcoin' } }));
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[#252542]"
                  >
                    <div className="rounded-full flex items-center justify-center" style={{ width: 32, height: 32, backgroundColor: '#F7931A20' }}>
                      <span className="text-[#F7931A] font-bold">₿</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">Bitcoin</p>
                      <p className="text-gray-500 text-sm">BTC • Native</p>
                    </div>
                  </button>
                </div>
              </div>
              {/* Mainnets */}
              <div className="mb-4">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-2">
                  Mainnets
                </p>
                <div className="space-y-1">
                  {MAINNET_CHAINS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        chain.id === c.id 
                          ? 'bg-[#F0B90B]/10 border border-[#F0B90B]/30' 
                          : 'hover:bg-[#252542]'
                      }`}
                    >
                      <ChainIcon chain={c} size={32} />
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{c.name}</p>
                        <p className="text-gray-500 text-sm">{c.symbol}</p>
                      </div>
                      {chain.id === c.id && (
                        <Check className="w-5 h-5 text-[#F0B90B]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Testnets toggle */}
              <button
                onClick={() => setShowTestnets(!showTestnets)}
                className="w-full text-gray-500 text-sm py-2 hover:text-gray-400 transition-colors"
              >
                {showTestnets ? 'Hide' : 'Show'} Testnets
              </button>

              {/* Testnets */}
              {showTestnets && TESTNET_CHAINS.length > 0 && (
                <div className="mt-2">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-2">
                    Testnets
                  </p>
                  <div className="space-y-1">
                    {TESTNET_CHAINS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect(c)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          chain.id === c.id 
                            ? 'bg-[#F0B90B]/10 border border-[#F0B90B]/30' 
                            : 'hover:bg-[#252542]'
                        }`}
                      >
                        <ChainIcon chain={c} size={32} />
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium">{c.name}</p>
                          <p className="text-gray-500 text-sm">{c.symbol}</p>
                        </div>
                        {chain.id === c.id && (
                          <Check className="w-5 h-5 text-[#F0B90B]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkSelector;
