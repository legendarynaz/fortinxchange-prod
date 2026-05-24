import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { MAINNET_CHAINS, TESTNET_CHAINS, type ChainConfig } from '../../config/chains';

interface NetworkSelectorProps {
  compact?: boolean;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ compact = false }) => {
  const { chain, switchChain } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [showTestnets, setShowTestnets] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-64 bg-[#1A1A2E] rounded-xl border border-gray-700 shadow-xl z-[100] overflow-hidden"
        >
          {/* Network list */}
          <div className="overflow-auto max-h-80 p-2">
            {/* Native Networks (non-EVM) */}
            <div className="mb-2">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1 px-2">Native</p>
              <div className="space-y-0.5">
                {/* Bitcoin */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'receive', network: 'bitcoin' } }));
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-[#252542]"
                >
                  <div className="rounded-full flex items-center justify-center" style={{ width: 28, height: 28, backgroundColor: '#F7931A20' }}>
                    <span className="text-[#F7931A] font-bold text-sm">₿</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white text-sm font-medium">Bitcoin</p>
                    <p className="text-gray-500 text-xs">BTC</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Mainnets */}
            <div className="mb-2">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1 px-2">Mainnets</p>
              <div className="space-y-0.5">
                {MAINNET_CHAINS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      chain.id === c.id 
                        ? 'bg-[#F0B90B]/10 border border-[#F0B90B]/30' 
                        : 'hover:bg-[#252542]'
                    }`}
                  >
                    <ChainIcon chain={c} size={28} />
                    <div className="flex-1 text-left">
                      <p className="text-white text-sm font-medium">{c.name}</p>
                      <p className="text-gray-500 text-xs">{c.symbol}</p>
                    </div>
                    {chain.id === c.id && (
                      <Check className="w-4 h-4 text-[#F0B90B]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Testnets toggle */}
            <button
              onClick={() => setShowTestnets(!showTestnets)}
              className="w-full text-gray-500 text-xs py-1.5 hover:text-gray-400 transition-colors"
            >
              {showTestnets ? 'Hide' : 'Show'} Testnets
            </button>

            {/* Testnets */}
            {showTestnets && TESTNET_CHAINS.length > 0 && (
              <div className="mt-1">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1 px-2">Testnets</p>
                <div className="space-y-0.5">
                  {TESTNET_CHAINS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        chain.id === c.id 
                          ? 'bg-[#F0B90B]/10 border border-[#F0B90B]/30' 
                          : 'hover:bg-[#252542]'
                      }`}
                    >
                      <ChainIcon chain={c} size={28} />
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm font-medium">{c.name}</p>
                        <p className="text-gray-500 text-xs">{c.symbol}</p>
                      </div>
                      {chain.id === c.id && (
                        <Check className="w-4 h-4 text-[#F0B90B]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkSelector;
