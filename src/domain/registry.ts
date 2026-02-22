// 4ortin-X Chain Registry
// Central registry of supported chains and their capabilities

import type { Chain, Asset, StakeOption } from './types';

// ============================================================================
// Supported Chains
// ============================================================================

export const SUPPORTED_CHAINS: Record<string, Chain> = {
  ethereum: {
    id: 'ethereum',
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    iconUrl: '/icons/eth.svg',
    enabled: true,
  },
  bsc: {
    id: 'bsc',
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    explorerUrl: 'https://bscscan.com',
    iconUrl: '/icons/bnb.svg',
    enabled: true,
  },
  polygon: {
    id: 'polygon',
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    iconUrl: '/icons/polygon.svg',
    enabled: true,
  },
  arbitrum: {
    id: 'arbitrum',
    chainId: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    iconUrl: '/icons/arbitrum.svg',
    enabled: true,
  },
  optimism: {
    id: 'optimism',
    chainId: 10,
    name: 'Optimism',
    symbol: 'ETH',
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    iconUrl: '/icons/optimism.svg',
    enabled: true,
  },
  avalanche: {
    id: 'avalanche',
    chainId: 43114,
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    iconUrl: '/icons/avax.svg',
    enabled: true,
  },
  base: {
    id: 'base',
    chainId: 8453,
    name: 'Base',
    symbol: 'ETH',
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    iconUrl: '/icons/base.svg',
    enabled: true,
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    type: 'btc',
    decimals: 8,
    rpcUrl: 'https://blockstream.info/api',
    explorerUrl: 'https://blockstream.info',
    iconUrl: '/icons/btc.svg',
    enabled: true,
  },
  tron: {
    id: 'tron',
    name: 'TRON',
    symbol: 'TRX',
    type: 'tron',
    decimals: 6,
    rpcUrl: 'https://api.trongrid.io',
    explorerUrl: 'https://tronscan.org',
    iconUrl: '/icons/trx.svg',
    enabled: true,
  },
  // Testnets
  sepolia: {
    id: 'sepolia',
    chainId: 11155111,
    name: 'Sepolia',
    symbol: 'ETH',
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    testnet: true,
    enabled: true,
  },
  bitcoin_testnet: {
    id: 'bitcoin_testnet',
    name: 'Bitcoin Testnet',
    symbol: 'tBTC',
    type: 'btc',
    decimals: 8,
    rpcUrl: 'https://blockstream.info/testnet/api',
    explorerUrl: 'https://blockstream.info/testnet',
    testnet: true,
    enabled: true,
  },
  tron_nile: {
    id: 'tron_nile',
    name: 'TRON Nile',
    symbol: 'TRX',
    type: 'tron',
    decimals: 6,
    rpcUrl: 'https://nile.trongrid.io',
    explorerUrl: 'https://nile.tronscan.org',
    testnet: true,
    enabled: true,
  },
};

// ============================================================================
// Native Assets
// ============================================================================

export const NATIVE_ASSETS: Record<string, Asset> = {
  'ethereum_eth': {
    id: 'ethereum_eth',
    symbol: 'ETH',
    name: 'Ethereum',
    chainId: 'ethereum',
    type: 'native',
    decimals: 18,
    coingeckoId: 'ethereum',
    verified: true,
  },
  'bsc_bnb': {
    id: 'bsc_bnb',
    symbol: 'BNB',
    name: 'BNB',
    chainId: 'bsc',
    type: 'native',
    decimals: 18,
    coingeckoId: 'binancecoin',
    verified: true,
  },
  'polygon_matic': {
    id: 'polygon_matic',
    symbol: 'MATIC',
    name: 'Polygon',
    chainId: 'polygon',
    type: 'native',
    decimals: 18,
    coingeckoId: 'matic-network',
    verified: true,
  },
  'arbitrum_eth': {
    id: 'arbitrum_eth',
    symbol: 'ETH',
    name: 'Ethereum',
    chainId: 'arbitrum',
    type: 'native',
    decimals: 18,
    coingeckoId: 'ethereum',
    verified: true,
  },
  'optimism_eth': {
    id: 'optimism_eth',
    symbol: 'ETH',
    name: 'Ethereum',
    chainId: 'optimism',
    type: 'native',
    decimals: 18,
    coingeckoId: 'ethereum',
    verified: true,
  },
  'avalanche_avax': {
    id: 'avalanche_avax',
    symbol: 'AVAX',
    name: 'Avalanche',
    chainId: 'avalanche',
    type: 'native',
    decimals: 18,
    coingeckoId: 'avalanche-2',
    verified: true,
  },
  'base_eth': {
    id: 'base_eth',
    symbol: 'ETH',
    name: 'Ethereum',
    chainId: 'base',
    type: 'native',
    decimals: 18,
    coingeckoId: 'ethereum',
    verified: true,
  },
  'bitcoin_btc': {
    id: 'bitcoin_btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    chainId: 'bitcoin',
    type: 'native',
    decimals: 8,
    coingeckoId: 'bitcoin',
    verified: true,
  },
  'tron_trx': {
    id: 'tron_trx',
    symbol: 'TRX',
    name: 'TRON',
    chainId: 'tron',
    type: 'native',
    decimals: 6,
    coingeckoId: 'tron',
    verified: true,
  },
};

// ============================================================================
// Popular Tokens
// ============================================================================

export const POPULAR_TOKENS: Asset[] = [
  // Ethereum tokens
  {
    id: 'ethereum_usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    chainId: 'ethereum',
    type: 'erc20',
    decimals: 6,
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    coingeckoId: 'tether',
    verified: true,
  },
  {
    id: 'ethereum_usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    chainId: 'ethereum',
    type: 'erc20',
    decimals: 6,
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    coingeckoId: 'usd-coin',
    verified: true,
  },
  {
    id: 'ethereum_dai',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    chainId: 'ethereum',
    type: 'erc20',
    decimals: 18,
    contractAddress: '0x6B175474E89094C44Da98b954EesitedcdF1F4C',
    coingeckoId: 'dai',
    verified: true,
  },
  {
    id: 'ethereum_wbtc',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    chainId: 'ethereum',
    type: 'erc20',
    decimals: 8,
    contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    coingeckoId: 'wrapped-bitcoin',
    verified: true,
  },
  {
    id: 'ethereum_steth',
    symbol: 'stETH',
    name: 'Lido Staked ETH',
    chainId: 'ethereum',
    type: 'erc20',
    decimals: 18,
    contractAddress: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    coingeckoId: 'staked-ether',
    verified: true,
  },
  // BSC tokens
  {
    id: 'bsc_usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    chainId: 'bsc',
    type: 'bep20',
    decimals: 18,
    contractAddress: '0x55d398326f99059fF775485246999027B3197955',
    coingeckoId: 'tether',
    verified: true,
  },
  {
    id: 'bsc_busd',
    symbol: 'BUSD',
    name: 'Binance USD',
    chainId: 'bsc',
    type: 'bep20',
    decimals: 18,
    contractAddress: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    coingeckoId: 'binance-usd',
    verified: true,
  },
  // TRON tokens
  {
    id: 'tron_usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    chainId: 'tron',
    type: 'trc20',
    decimals: 6,
    contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    coingeckoId: 'tether',
    verified: true,
  },
];

// ============================================================================
// Staking Options
// ============================================================================

export const STAKE_OPTIONS: StakeOption[] = [
  {
    provider: 'lido',
    chainId: 'ethereum',
    name: 'Lido Staked ETH',
    description: 'Stake ETH and receive stETH. Liquid staking with no minimum.',
    apy: 3.8,
    minStake: '0',
    enabled: true,
  },
  {
    provider: 'tron-native',
    chainId: 'tron',
    name: 'TRON Energy Staking',
    description: 'Stake TRX to earn energy and bandwidth. Unlock after 14 days.',
    apy: 4.2,
    minStake: '1',
    lockPeriod: 14 * 24 * 60 * 60, // 14 days in seconds
    enabled: true,
  },
];

// ============================================================================
// BIP44 Derivation Paths
// ============================================================================

export const DERIVATION_PATHS = {
  ethereum: "m/44'/60'/0'/0",      // ETH and EVM chains
  bitcoin: "m/84'/0'/0'/0",        // BTC Native SegWit (BIP84)
  bitcoin_legacy: "m/44'/0'/0'/0", // BTC Legacy
  tron: "m/44'/195'/0'/0",         // TRON
} as const;

// ============================================================================
// Chain Capabilities
// ============================================================================

export interface ChainCapabilities {
  send: boolean;
  receive: boolean;
  swap: boolean;
  stake: boolean;
  nft: boolean;
  hardwareWallet: boolean;
}

export const CHAIN_CAPABILITIES: Record<string, ChainCapabilities> = {
  ethereum: { send: true, receive: true, swap: true, stake: true, nft: true, hardwareWallet: true },
  bsc: { send: true, receive: true, swap: true, stake: false, nft: true, hardwareWallet: true },
  polygon: { send: true, receive: true, swap: true, stake: false, nft: true, hardwareWallet: true },
  arbitrum: { send: true, receive: true, swap: true, stake: false, nft: true, hardwareWallet: true },
  optimism: { send: true, receive: true, swap: true, stake: false, nft: true, hardwareWallet: true },
  avalanche: { send: true, receive: true, swap: true, stake: false, nft: false, hardwareWallet: true },
  base: { send: true, receive: true, swap: true, stake: false, nft: true, hardwareWallet: true },
  bitcoin: { send: true, receive: true, swap: false, stake: false, nft: false, hardwareWallet: true },
  tron: { send: true, receive: true, swap: true, stake: true, nft: false, hardwareWallet: false },
};

// ============================================================================
// Utility Functions
// ============================================================================

export const getChain = (chainId: string): Chain | undefined => {
  return SUPPORTED_CHAINS[chainId];
};

export const getChainByEvmId = (evmChainId: number): Chain | undefined => {
  return Object.values(SUPPORTED_CHAINS).find(c => c.chainId === evmChainId);
};

export const getNativeAsset = (chainId: string): Asset | undefined => {
  const chain = getChain(chainId);
  if (!chain) return undefined;
  return NATIVE_ASSETS[`${chainId}_${chain.symbol.toLowerCase()}`];
};

export const getEnabledChains = (): Chain[] => {
  return Object.values(SUPPORTED_CHAINS).filter(c => c.enabled && !c.testnet);
};

export const getTestnetChains = (): Chain[] => {
  return Object.values(SUPPORTED_CHAINS).filter(c => c.enabled && c.testnet);
};

export const getChainCapabilities = (chainId: string): ChainCapabilities => {
  return CHAIN_CAPABILITIES[chainId] || {
    send: false,
    receive: false,
    swap: false,
    stake: false,
    nft: false,
    hardwareWallet: false,
  };
};

export const getDerivationPath = (chainId: string, accountIndex: number = 0): string => {
  const chain = getChain(chainId);
  if (!chain) return DERIVATION_PATHS.ethereum + `/${accountIndex}`;
  
  switch (chain.type) {
    case 'btc':
      return `${DERIVATION_PATHS.bitcoin}/${accountIndex}`;
    case 'tron':
      return `${DERIVATION_PATHS.tron}/${accountIndex}`;
    case 'evm':
    default:
      return `${DERIVATION_PATHS.ethereum}/${accountIndex}`;
  }
};

export const formatExplorerUrl = (chainId: string, type: 'tx' | 'address' | 'token', value: string): string => {
  const chain = getChain(chainId);
  if (!chain) return '#';
  
  const paths: Record<string, Record<string, string>> = {
    ethereum: { tx: 'tx', address: 'address', token: 'token' },
    bsc: { tx: 'tx', address: 'address', token: 'token' },
    polygon: { tx: 'tx', address: 'address', token: 'token' },
    arbitrum: { tx: 'tx', address: 'address', token: 'token' },
    optimism: { tx: 'tx', address: 'address', token: 'token' },
    avalanche: { tx: 'tx', address: 'address', token: 'token' },
    base: { tx: 'tx', address: 'address', token: 'token' },
    bitcoin: { tx: 'tx', address: 'address', token: '' },
    tron: { tx: '#/transaction', address: '#/address', token: '#/token20' },
  };
  
  const pathMap = paths[chainId] || paths.ethereum;
  return `${chain.explorerUrl}/${pathMap[type]}/${value}`;
};
