// Comprehensive chain configuration for 4ortin-X
export interface ChainConfig {
  id: number;
  name: string;
  shortName: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  explorerUrl: string;
  iconColor: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const CHAINS: Record<number, ChainConfig> = {
  1: {
    id: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    iconColor: '#627EEA',
    isTestnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  56: {
    id: 56,
    name: 'BNB Smart Chain',
    shortName: 'BSC',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    explorerUrl: 'https://bscscan.com',
    iconColor: '#F0B90B',
    isTestnet: false,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
  137: {
    id: 137,
    name: 'Polygon',
    shortName: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    iconColor: '#8247E5',
    isTestnet: false,
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  42161: {
    id: 42161,
    name: 'Arbitrum One',
    shortName: 'ARB',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    iconColor: '#28A0F0',
    isTestnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  10: {
    id: 10,
    name: 'Optimism',
    shortName: 'OP',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    iconColor: '#FF0420',
    isTestnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  43114: {
    id: 43114,
    name: 'Avalanche C-Chain',
    shortName: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    iconColor: '#E84142',
    isTestnet: false,
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  },
  250: {
    id: 250,
    name: 'Fantom Opera',
    shortName: 'FTM',
    symbol: 'FTM',
    decimals: 18,
    rpcUrl: 'https://rpc.ftm.tools',
    explorerUrl: 'https://ftmscan.com',
    iconColor: '#1969FF',
    isTestnet: false,
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
  },
  8453: {
    id: 8453,
    name: 'Base',
    shortName: 'BASE',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    iconColor: '#0052FF',
    isTestnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  324: {
    id: 324,
    name: 'zkSync Era',
    shortName: 'zkSync',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.era.zksync.io',
    explorerUrl: 'https://explorer.zksync.io',
    iconColor: '#8C8DFC',
    isTestnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  // Tron Network (non-EVM, handled separately like Bitcoin)
  728126428: {
    id: 728126428,
    name: 'Tron',
    shortName: 'TRX',
    symbol: 'TRX',
    decimals: 6,
    rpcUrl: 'https://api.trongrid.io',
    explorerUrl: 'https://tronscan.org',
    iconColor: '#FF0013',
    isTestnet: false,
    nativeCurrency: { name: 'Tron', symbol: 'TRX', decimals: 6 },
  },
  // Solana (non-EVM)
  101: {
    id: 101,
    name: 'Solana',
    shortName: 'SOL',
    symbol: 'SOL',
    decimals: 9,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    iconColor: '#9945FF',
    isTestnet: false,
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  },
  // XRP Ledger (non-EVM)
  144: {
    id: 144,
    name: 'XRP Ledger',
    shortName: 'XRP',
    symbol: 'XRP',
    decimals: 6,
    rpcUrl: 'https://s1.ripple.com:51234',
    explorerUrl: 'https://xrpscan.com',
    iconColor: '#23292F',
    isTestnet: false,
    nativeCurrency: { name: 'XRP', symbol: 'XRP', decimals: 6 },
  },
  // Litecoin (non-EVM, UTXO)
  2: {
    id: 2,
    name: 'Litecoin',
    shortName: 'LTC',
    symbol: 'LTC',
    decimals: 8,
    rpcUrl: 'https://litecoinspace.org/api',
    explorerUrl: 'https://litecoinspace.org',
    iconColor: '#345D9D',
    isTestnet: false,
    nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 8 },
  },
  // Dogecoin (non-EVM, UTXO)
  3: {
    id: 3,
    name: 'Dogecoin',
    shortName: 'DOGE',
    symbol: 'DOGE',
    decimals: 8,
    rpcUrl: 'https://api.blockcypher.com/v1/doge/main',
    explorerUrl: 'https://dogechain.info',
    iconColor: '#C2A633',
    isTestnet: false,
    nativeCurrency: { name: 'Dogecoin', symbol: 'DOGE', decimals: 8 },
  },
  // Dash (non-EVM, UTXO)
  5: {
    id: 5,
    name: 'Dash',
    shortName: 'DASH',
    symbol: 'DASH',
    decimals: 8,
    rpcUrl: 'https://insight.dash.org/insight-api',
    explorerUrl: 'https://insight.dash.org',
    iconColor: '#008CE7',
    isTestnet: false,
    nativeCurrency: { name: 'Dash', symbol: 'DASH', decimals: 8 },
  },
  // Filecoin (non-EVM)
  314: {
    id: 314,
    name: 'Filecoin',
    shortName: 'FIL',
    symbol: 'FIL',
    decimals: 18,
    rpcUrl: 'https://api.node.glif.io/rpc/v1',
    explorerUrl: 'https://filfox.info',
    iconColor: '#0090FF',
    isTestnet: false,
    nativeCurrency: { name: 'Filecoin', symbol: 'FIL', decimals: 18 },
  },
  // Cosmos Hub (non-EVM)
  118: {
    id: 118,
    name: 'Cosmos Hub',
    shortName: 'ATOM',
    symbol: 'ATOM',
    decimals: 6,
    rpcUrl: 'https://cosmos-rpc.polkachu.com',
    explorerUrl: 'https://www.mintscan.io/cosmos',
    iconColor: '#2E3148',
    isTestnet: false,
    nativeCurrency: { name: 'Cosmos', symbol: 'ATOM', decimals: 6 },
  },
  // Bitcoin Cash (non-EVM, UTXO)
  145: {
    id: 145,
    name: 'Bitcoin Cash',
    shortName: 'BCH',
    symbol: 'BCH',
    decimals: 8,
    rpcUrl: 'https://api.fullstack.cash/v5',
    explorerUrl: 'https://blockchair.com/bitcoin-cash',
    iconColor: '#8DC351',
    isTestnet: false,
    nativeCurrency: { name: 'Bitcoin Cash', symbol: 'BCH', decimals: 8 },
  },
  // Cardano (non-EVM)
  1815: {
    id: 1815,
    name: 'Cardano',
    shortName: 'ADA',
    symbol: 'ADA',
    decimals: 6,
    rpcUrl: 'https://cardano-mainnet.blockfrost.io/api/v0',
    explorerUrl: 'https://cardanoscan.io',
    iconColor: '#0033AD',
    isTestnet: false,
    nativeCurrency: { name: 'Cardano', symbol: 'ADA', decimals: 6 },
  },
  // Hyper EVM (EVM compatible)
  999: {
    id: 999,
    name: 'Hyper EVM',
    shortName: 'HYPE',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://rpc.hyperliquid.xyz/evm',
    explorerUrl: 'https://explorer.hyperliquid.xyz',
    iconColor: '#00D4AA',
    isTestnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  // Testnets
  11155111: {
    id: 11155111,
    name: 'Sepolia',
    shortName: 'SEP',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    iconColor: '#627EEA',
    isTestnet: true,
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  },
};

export const DEFAULT_CHAIN_ID = 1; // Ethereum mainnet

export const MAINNET_CHAINS = Object.values(CHAINS).filter(c => !c.isTestnet);
export const TESTNET_CHAINS = Object.values(CHAINS).filter(c => c.isTestnet);

export const getChain = (chainId: number): ChainConfig | undefined => CHAINS[chainId];
export const getChainName = (chainId: number): string => CHAINS[chainId]?.name || 'Unknown';

// Popular tokens per chain
export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}

export const POPULAR_TOKENS: Record<number, TokenConfig[]> = {
  1: [ // Ethereum
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x6B175474E89094C44Da98b954EesigcdB97dFc231', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', symbol: 'SHIB', name: 'Shiba Inu', decimals: 18 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
  ],
  56: [ // BSC
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18 },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
    { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', name: 'Binance USD', decimals: 18 },
    { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'ETH', name: 'Ethereum Token', decimals: 18 },
    { address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', symbol: 'BTCB', name: 'Bitcoin BEP2', decimals: 18 },
    { address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', symbol: 'CAKE', name: 'PancakeSwap', decimals: 18 },
  ],
  137: [ // Polygon
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
  ],
  42161: [ // Arbitrum
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
    { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', name: 'Arbitrum', decimals: 18 },
  ],
  10: [ // Optimism
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
    { address: '0x4200000000000000000000000000000000000042', symbol: 'OP', name: 'Optimism', decimals: 18 },
  ],
  8453: [ // Base
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  ],
  999: [ // Hyper EVM
    { address: '0x0000000000000000000000000000000000000000', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  43114: [ // Avalanche
    { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', symbol: 'WETH.e', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x50b7545627a5162F82A992c33b87aDc75187B218', symbol: 'WBTC.e', name: 'Wrapped BTC', decimals: 8 },
  ],
};
