import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { Wallet, LogOut, ChevronDown, ExternalLink, Copy, Check } from 'lucide-react';
import { CHAIN_NAMES } from '../../config/web3';

const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const formatBalance = (value: bigint, decimals: number) => {
    const divisor = BigInt(10 ** decimals);
    const intPart = value / divisor;
    const fracPart = value % divisor;
    const fracStr = fracPart.toString().padStart(decimals, '0').slice(0, 4);
    return `${intPart}.${fracStr}`;
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getConnectorIcon = (name: string) => {
    if (name.toLowerCase().includes('metamask')) return '🦊';
    if (name.toLowerCase().includes('coinbase')) return '🔵';
    if (name.toLowerCase().includes('walletconnect')) return '🔗';
    return '👛';
  };

  if (isConnected && address) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{formatAddress(address)}</span>
                <button onClick={copyAddress} className="text-gray-400 hover:text-white transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <a 
                  href={`https://etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <span className="text-sm text-gray-400">
                {balance ? `${formatBalance(balance.value, balance.decimals)} ${balance.symbol}` : 'Loading...'}
              </span>
            </div>
          </div>
          <button
            onClick={() => disconnect()}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Disconnect"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Chain Selector */}
        <div className="relative">
          <button
            onClick={() => setShowChainSelector(!showChainSelector)}
            className="w-full flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span className="text-sm text-gray-300">
              Network: <span className="text-white font-medium">{CHAIN_NAMES[chainId] || 'Unknown'}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showChainSelector ? 'rotate-180' : ''}`} />
          </button>
          
          {showChainSelector && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700 rounded-lg border border-gray-600 overflow-hidden z-10">
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => {
                    switchChain({ chainId: chain.id });
                    setShowChainSelector(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors ${
                    chainId === chain.id ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300'
                  }`}
                >
                  {CHAIN_NAMES[chain.id] || chain.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-sm text-gray-400">Connect your Web3 wallet to view real balances and trade</p>
      </div>

      <div className="space-y-3">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="w-full flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-2xl">{getConnectorIcon(connector.name)}</span>
            <span className="font-medium text-white">{connector.name}</span>
            {isPending && (
              <div className="ml-auto w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        By connecting, you agree to our Terms of Service
      </p>
    </div>
  );
};

export default WalletConnect;
