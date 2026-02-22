import React, { useState, useEffect } from 'react';
import { Grid3X3, List, RefreshCw, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface NFT {
  id: string;
  name: string;
  description?: string;
  image: string;
  collection: string;
  tokenId: string;
  contractAddress: string;
}

// Mock NFTs for demonstration
const MOCK_NFTS: NFT[] = [];

const NFTGallery: React.FC = () => {
  const { activeAccount, chain } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  useEffect(() => {
    const fetchNFTs = async () => {
      setIsLoading(true);
      // In production, fetch from Alchemy, OpenSea, or other NFT APIs
      // For now, show mock data after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNfts(MOCK_NFTS);
      setIsLoading(false);
    };

    if (activeAccount) {
      fetchNFTs();
    }
  }, [activeAccount, chain.id]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setNfts(MOCK_NFTS);
      setIsLoading(false);
    }, 1000);
  };

  // NFT Detail Modal
  if (selectedNFT) {
    return (
      <div className="flex-1 bg-[#0D1117] overflow-auto pb-20">
        <div className="p-4">
          <button
            onClick={() => setSelectedNFT(null)}
            className="text-[#F0B90B] mb-4"
          >
            ← Back
          </button>
          
          <div className="bg-[#1A1A2E] rounded-2xl overflow-hidden">
            <img
              src={selectedNFT.image}
              alt={selectedNFT.name}
              className="w-full aspect-square object-cover"
            />
            <div className="p-4">
              <p className="text-gray-400 text-sm">{selectedNFT.collection}</p>
              <h2 className="text-xl font-bold text-white mt-1">{selectedNFT.name}</h2>
              {selectedNFT.description && (
                <p className="text-gray-400 text-sm mt-2">{selectedNFT.description}</p>
              )}
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Token ID</span>
                  <span className="text-white">{selectedNFT.tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network</span>
                  <span className="text-white">{chain.name}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-black font-semibold py-3 rounded-xl transition-colors">
                  Send
                </button>
                <button className="flex-1 bg-[#1A1A2E] border border-gray-700 hover:bg-[#252542] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0D1117] overflow-auto pb-20">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">NFTs</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex bg-[#1A1A2E] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#252542]' : ''}`}
              >
                <Grid3X3 className={`w-4 h-4 ${viewMode === 'grid' ? 'text-white' : 'text-gray-500'}`} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#252542]' : ''}`}
              >
                <List className={`w-4 h-4 ${viewMode === 'list' ? 'text-white' : 'text-gray-500'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Network indicator */}
        <div className="bg-[#1A1A2E] rounded-xl px-4 py-2 mb-4 inline-flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: chain.iconColor }}
          />
          <span className="text-gray-400 text-sm">{chain.name}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {isLoading ? (
          // Loading skeleton
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`bg-[#1A1A2E] rounded-2xl overflow-hidden animate-pulse ${
                  viewMode === 'list' ? 'flex items-center gap-3 p-3' : ''
                }`}
              >
                <div className={`bg-gray-700 ${viewMode === 'grid' ? 'aspect-square w-full' : 'w-16 h-16 rounded-xl'}`} />
                {viewMode === 'grid' && (
                  <div className="p-3">
                    <div className="h-3 bg-gray-700 rounded w-2/3 mb-2" />
                    <div className="h-4 bg-gray-700 rounded w-full" />
                  </div>
                )}
                {viewMode === 'list' && (
                  <div className="flex-1">
                    <div className="h-3 bg-gray-700 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-gray-700 rounded w-2/3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : nfts.length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#1A1A2E] rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No NFTs Yet</h3>
            <p className="text-gray-400 mb-6 max-w-xs mx-auto">
              Your NFT collection will appear here. Explore marketplaces to find unique digital collectibles.
            </p>
            <a
              href="https://opensea.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Explore OpenSea
            </a>
          </div>
        ) : (
          // NFT Grid/List
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
            {nfts.map((nft) => (
              <button
                key={nft.id}
                onClick={() => setSelectedNFT(nft)}
                className={`bg-[#1A1A2E] rounded-2xl overflow-hidden hover:bg-[#252542] transition-colors text-left ${
                  viewMode === 'list' ? 'flex items-center gap-3 p-3' : ''
                }`}
              >
                <img
                  src={nft.image}
                  alt={nft.name}
                  className={`object-cover ${
                    viewMode === 'grid' ? 'aspect-square w-full' : 'w-16 h-16 rounded-xl'
                  }`}
                />
                <div className={viewMode === 'grid' ? 'p-3' : 'flex-1'}>
                  <p className="text-gray-500 text-xs truncate">{nft.collection}</p>
                  <p className="text-white font-medium truncate">{nft.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTGallery;
