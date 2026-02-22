import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Share2, ChevronDown, X } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { CHAINS } from '../../config/chains';

interface ReceiveScreenProps {
  onBack: () => void;
}

// Bitcoin network config
const BITCOIN_NETWORK = {
  id: 'bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  iconColor: '#F7931A',
};

// Tron network config
const TRON_NETWORK = {
  id: 'tron',
  name: 'Tron',
  symbol: 'TRX',
  iconColor: '#FF0013',
};

const CHAIN_LIST = Object.values(CHAINS);

const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ onBack }) => {
  const { activeAccount, chain, chainId, switchChain, bitcoinAddress, tronAddress } = useWallet();
  const [copied, setCopied] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<'bitcoin' | 'tron' | number>(chainId);

  // Determine network type
  const isBitcoinSelected = selectedNetwork === 'bitcoin';
  const isTronSelected = selectedNetwork === 'tron';
  
  // Get current network info
  const currentNetwork = isBitcoinSelected 
    ? BITCOIN_NETWORK 
    : isTronSelected
    ? TRON_NETWORK
    : chain;

  // Get the correct address based on selected network
  const displayAddress = isBitcoinSelected
    ? (bitcoinAddress || 'Creating Bitcoin address...')
    : isTronSelected
    ? (tronAddress || 'Creating Tron address...')
    : (activeAccount?.address || '0x...connect wallet');

  const handleCopy = async () => {
    if (displayAddress && !displayAddress.includes('...') && !displayAddress.includes('Creating')) {
      await navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (displayAddress && navigator.share && !displayAddress.includes('...') && !displayAddress.includes('Creating')) {
      await navigator.share({
        title: `My ${currentNetwork.name} Wallet Address`,
        text: displayAddress,
      });
    }
  };

  const handleNetworkSelect = (networkId: 'bitcoin' | 'tron' | number) => {
    setSelectedNetwork(networkId);
    if (networkId !== 'bitcoin' && networkId !== 'tron') {
      switchChain(networkId);
    }
    setShowNetworkSelector(false);
  };

  // Simple QR code using a public API
  const hasValidAddress = displayAddress && !displayAddress.includes('...') && !displayAddress.includes('Creating');
  const qrCodeUrl = hasValidAddress
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${displayAddress}&bgcolor=ffffff&color=000000`
    : null;

  return (
    <div className="flex-1 bg-[#0D1117] flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-800 safe-area-top">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-semibold text-white">Receive</h1>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pt-8 pb-safe overflow-auto">
        {/* Network Selector */}
        <button 
          onClick={() => setShowNetworkSelector(true)}
          className="flex items-center gap-2 px-4 py-3 bg-[#1A1A2E] rounded-full mb-8 min-h-[44px] active:bg-[#252542] transition-colors"
        >
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: currentNetwork.iconColor }}
          />
          <span className="text-white font-medium">{currentNetwork.name}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="Wallet QR Code" className="w-48 h-48" />
          ) : (
            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-lg">
              <span className="text-gray-500 text-sm text-center px-4">
                {isBitcoinSelected && !bitcoinAddress 
                  ? 'Loading...' 
                  : 'Connect wallet'}
              </span>
            </div>
          )}
        </div>

        {/* Warning */}
        <div 
          className="rounded-xl p-4 mb-6 max-w-sm"
          style={{ 
            backgroundColor: `${currentNetwork.iconColor}15`,
            borderColor: `${currentNetwork.iconColor}40`,
            borderWidth: 1
          }}
        >
          <p className="text-sm text-center" style={{ color: currentNetwork.iconColor }}>
            Only send <strong>{currentNetwork.name}</strong> {isBitcoinSelected ? '(BTC)' : 'assets'} to this address. 
            Sending other assets may result in permanent loss.
          </p>
        </div>

        {/* Address Display */}
        <div className="w-full max-w-sm">
          <label className="text-gray-400 text-sm mb-2 block text-center">
            Your {currentNetwork.name} Address
          </label>
          <div 
            className="rounded-xl p-4"
            style={{ 
              backgroundColor: '#1A1A2E',
              borderColor: isBitcoinSelected ? `${BITCOIN_NETWORK.iconColor}40` : 'transparent',
              borderWidth: isBitcoinSelected ? 1 : 0
            }}
          >
            <p className="text-white text-center font-mono text-sm break-all select-all">
              {displayAddress}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handleCopy}
            disabled={!hasValidAddress}
            className={`flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all min-h-[48px] ${
              hasValidAddress 
                ? 'bg-[#F0B90B] hover:bg-[#F0B90B]/90 active:scale-95 text-black' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy
              </>
            )}
          </button>
          
          <button
            onClick={handleShare}
            disabled={!hasValidAddress}
            className={`flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all min-h-[48px] ${
              hasValidAddress
                ? 'bg-[#1A1A2E] hover:bg-[#252542] active:scale-95 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      </div>

      {/* Network Selector Modal */}
      {showNetworkSelector && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNetworkSelector(false)}
          />
          <div className="relative w-full max-w-md bg-[#1A1A2E] rounded-t-3xl sm:rounded-3xl max-h-[70vh] overflow-hidden safe-area-bottom">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Select Network</h2>
              <button
                onClick={() => setShowNetworkSelector(false)}
                className="p-2 hover:bg-gray-800 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              <div className="space-y-2">
                {/* Bitcoin Option - Always first */}
                <button
                  onClick={() => handleNetworkSelect('bitcoin')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors min-h-[56px] ${
                    selectedNetwork === 'bitcoin'
                      ? 'bg-[#F7931A]/10 border border-[#F7931A]/30' 
                      : 'bg-[#252542] hover:bg-[#2d2d5a]'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#F7931A20' }}
                  >
                    <span className="text-[#F7931A] font-bold text-lg">₿</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Bitcoin</p>
                    <p className="text-gray-500 text-sm">BTC • Native</p>
                  </div>
                  {selectedNetwork === 'bitcoin' && (
                    <Check className="w-5 h-5 text-[#F7931A]" />
                  )}
                </button>

                {/* Tron Option */}
                <button
                  onClick={() => handleNetworkSelect('tron')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors min-h-[56px] ${
                    selectedNetwork === 'tron'
                      ? 'bg-[#FF0013]/10 border border-[#FF0013]/30' 
                      : 'bg-[#252542] hover:bg-[#2d2d5a]'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#FF001320' }}
                  >
                    <span className="text-[#FF0013] font-bold text-lg">T</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Tron</p>
                    <p className="text-gray-500 text-sm">TRX • Native</p>
                  </div>
                  {selectedNetwork === 'tron' && (
                    <Check className="w-5 h-5 text-[#FF0013]" />
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-gray-700" />
                  <span className="text-gray-500 text-xs uppercase">EVM Networks</span>
                  <div className="flex-1 h-px bg-gray-700" />
                </div>

                {/* EVM Chains */}
                {CHAIN_LIST.map((networkChain) => (
                  <button
                    key={networkChain.id}
                    onClick={() => handleNetworkSelect(networkChain.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors min-h-[56px] ${
                      selectedNetwork === networkChain.id 
                        ? 'bg-[#F0B90B]/10 border border-[#F0B90B]/30' 
                        : 'bg-[#252542] hover:bg-[#2d2d5a]'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${networkChain.iconColor}20` }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: networkChain.iconColor }}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{networkChain.name}</p>
                      <p className="text-gray-500 text-sm">{networkChain.symbol}</p>
                    </div>
                    {selectedNetwork === networkChain.id && (
                      <Check className="w-5 h-5 text-[#F0B90B]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiveScreen;
