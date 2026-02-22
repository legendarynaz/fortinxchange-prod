import React from 'react';
import { Search, ExternalLink, Zap, Image, Gamepad2, BarChart3 } from 'lucide-react';

const categories = [
  { id: 'defi', name: 'DeFi', icon: BarChart3, color: 'from-blue-500 to-purple-500' },
  { id: 'nft', name: 'NFTs', icon: Image, color: 'from-pink-500 to-rose-500' },
  { id: 'games', name: 'Games', icon: Gamepad2, color: 'from-green-500 to-emerald-500' },
  { id: 'tools', name: 'Tools', icon: Zap, color: 'from-yellow-500 to-orange-500' },
];

const featuredDApps = [
  { name: 'Uniswap', desc: 'Decentralized Exchange', category: 'DeFi', url: 'https://app.uniswap.org' },
  { name: 'OpenSea', desc: 'NFT Marketplace', category: 'NFT', url: 'https://opensea.io' },
  { name: 'Aave', desc: 'Lending Protocol', category: 'DeFi', url: 'https://app.aave.com' },
  { name: 'PancakeSwap', desc: 'DEX on BSC', category: 'DeFi', url: 'https://pancakeswap.finance' },
];

const DiscoverScreen: React.FC = () => {
  return (
    <div className="flex-1 bg-[#0D1117] overflow-auto pb-20">
      {/* Header */}
      <div className="p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Discover</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search DApps"
            className="w-full bg-[#1A1A2E] border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#F0B90B]"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Categories</h2>
        <div className="grid grid-cols-4 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                className="flex flex-col items-center gap-2 p-4 bg-[#1A1A2E] hover:bg-[#252542] rounded-2xl transition-colors"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${cat.color} rounded-full flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured DApps */}
      <div className="px-4">
        <h2 className="text-lg font-semibold text-white mb-3">Popular DApps</h2>
        <div className="space-y-3">
          {featuredDApps.map((dapp) => (
            <a
              key={dapp.name}
              href={dapp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-[#1A1A2E] hover:bg-[#252542] rounded-2xl transition-colors"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#F0B90B]/20 to-[#F0B90B]/5 rounded-xl flex items-center justify-center">
                <span className="text-[#F0B90B] font-bold">{dapp.name.slice(0, 2)}</span>
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">{dapp.name}</div>
                <div className="text-gray-400 text-sm">{dapp.desc}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                  {dapp.category}
                </span>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="px-4 mt-8">
        <div className="bg-gradient-to-r from-[#F0B90B]/10 to-purple-500/10 border border-[#F0B90B]/30 rounded-2xl p-6 text-center">
          <h3 className="text-white font-semibold mb-2">DApp Browser Coming Soon</h3>
          <p className="text-gray-400 text-sm">
            Connect to any DApp directly from 4ortin-X. Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiscoverScreen;
