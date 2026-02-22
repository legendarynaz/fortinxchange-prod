import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { CHAINS } from '../../config/chains';
import { getChainBalance, type MultiChainBalance } from '../../services/multiChainService';

interface MultiChainAssetsProps {
  hideBalance?: boolean;
  onReceive?: (symbol: string) => void;
}

const CHAIN_ICONS: Record<string, string> = {
  SOL: '◎',
  XRP: '✕',
  LTC: 'Ł',
  DOGE: 'Ð',
  DASH: 'Đ',
  FIL: '⨎',
  ATOM: '⚛',
  BCH: '₿',
  ADA: '₳',
};

const CHAIN_COLORS: Record<string, string> = {
  SOL: '#9945FF',
  XRP: '#23292F',
  LTC: '#345D9D',
  DOGE: '#C2A633',
  DASH: '#008CE7',
  FIL: '#0090FF',
  ATOM: '#2E3148',
  BCH: '#8DC351',
  ADA: '#0033AD',
};

const MultiChainAssets: React.FC<MultiChainAssetsProps> = ({ hideBalance = false, onReceive }) => {
  const { multiChainAddresses, multiChainPrices } = useWallet();
  const [expanded, setExpanded] = useState(true);
  const [balances, setBalances] = useState<Record<string, MultiChainBalance>>({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (multiChainAddresses.length > 0) {
      fetchBalances();
    }
  }, [multiChainAddresses]);

  // Periodic refresh of balances (every 60s)
  useEffect(() => {
    if (multiChainAddresses.length === 0) return;
    const id = setInterval(() => {
      fetchBalances();
    }, 60_000);
    return () => clearInterval(id);
  }, [multiChainAddresses]);

  const fetchBalances = async () => {
    setIsLoading(true);
    const newBalances: Record<string, MultiChainBalance> = {};
    
    for (const addr of multiChainAddresses) {
      try {
        const balance = await getChainBalance(addr.chainId, addr.address);
        if (balance) {
          // Add USD value from prices
          const price = multiChainPrices[addr.symbol] || 0;
          balance.balanceUSD = parseFloat(balance.balanceFormatted) * price;
          newBalances[addr.symbol] = balance;
        }
      } catch (error) {
        console.error(`Failed to fetch ${addr.symbol} balance:`, error);
      }
    }
    
    setBalances(newBalances);
    setIsLoading(false);
  };

  const handleCopy = (address: string, symbol: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(symbol);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatBalance = (balance: string | undefined) => {
    if (hideBalance) return '••••••';
    if (!balance) return '0';
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    return num.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  const formatUSD = (value: number | undefined) => {
    if (hideBalance) return '••••••';
    if (!value || value === 0) return '$0.00';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getExplorerUrl = (symbol: string, address: string): string => {
    const chain = multiChainAddresses.find(a => a.symbol === symbol);
    if (!chain) return '#';
    const chainConfig = CHAINS[chain.chainId];
    if (!chainConfig) return '#';
    return `${chainConfig.explorerUrl}/address/${address}`;
  };

  const totalValue = Object.values(balances).reduce((sum, b) => sum + (b.balanceUSD || 0), 0);

  if (multiChainAddresses.length === 0) {
    return null;
  }

  return (
    <div className="px-4 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Multi-Chain Assets</h2>
          <span className="text-xs bg-[#F0B90B]/20 text-[#F0B90B] px-2 py-0.5 rounded-full">
            {multiChainAddresses.length} chains
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">
            {hideBalance ? '••••••' : formatUSD(totalValue)}
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="space-y-2">
          {multiChainAddresses.map((chain) => {
            const balance = balances[chain.symbol];
            const price = multiChainPrices[chain.symbol] || 0;
            const color = CHAIN_COLORS[chain.symbol] || '#666';
            const icon = CHAIN_ICONS[chain.symbol] || chain.symbol[0];

            return (
              <div
                key={chain.symbol}
                className="bg-[#1A1A2E] rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: color }}
                    >
                      {icon}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{chain.chain}</p>
                      <p className="text-gray-500 text-sm">
                        {price > 0 ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 4 })}` : 'Loading...'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {isLoading ? '...' : `${formatBalance(balance?.balanceFormatted)} ${chain.symbol}`}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {isLoading ? '...' : formatUSD(balance?.balanceUSD)}
                    </p>
                  </div>
                </div>

                {/* Address row */}
                <div className="flex items-center justify-between bg-[#0D1117] rounded-xl px-3 py-2">
                  <p className="text-gray-400 text-xs truncate flex-1 mr-2">
                    {chain.address.slice(0, 12)}...{chain.address.slice(-8)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(chain.address, chain.symbol)}
                      className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      {copiedAddress === chain.symbol ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <a
                      href={getExplorerUrl(chain.symbol, chain.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </a>
                    {onReceive && (
                      <button
                        onClick={() => onReceive(chain.symbol)}
                        className="text-xs bg-[#F0B90B]/20 text-[#F0B90B] px-3 py-1.5 rounded-lg hover:bg-[#F0B90B]/30 transition-colors"
                      >
                        Receive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiChainAssets;
