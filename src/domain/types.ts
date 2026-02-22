// 4ortin-X Core Domain Types
// Unified type definitions for multi-chain wallet operations

// ============================================================================
// Chain Types
// ============================================================================

export type ChainType = 'evm' | 'btc' | 'tron' | 'solana';

export interface Chain {
  id: string;                    // Unique identifier (e.g., 'ethereum', 'bitcoin', 'tron')
  chainId?: number;              // EVM chain ID (undefined for non-EVM)
  name: string;                  // Display name
  symbol: string;                // Native token symbol
  type: ChainType;
  decimals: number;              // Native token decimals
  rpcUrl: string;
  explorerUrl: string;
  iconUrl?: string;
  testnet?: boolean;
  enabled: boolean;
}

// ============================================================================
// Asset Types
// ============================================================================

export type AssetType = 'native' | 'erc20' | 'bep20' | 'trc20' | 'spl';

export interface Asset {
  id: string;                    // Unique identifier (chain_address or chain_symbol for native)
  symbol: string;
  name: string;
  chainId: string;               // Reference to Chain.id
  type: AssetType;
  decimals: number;
  contractAddress?: string;      // Token contract (undefined for native)
  iconUrl?: string;
  coingeckoId?: string;          // For price lookups
  verified?: boolean;            // Community/team verified
}

// ============================================================================
// Account Types
// ============================================================================

export type AccountType = 'software' | 'hardware' | 'watch-only';

export interface Account {
  id: string;                    // UUID
  name: string;                  // User-friendly name
  type: AccountType;
  addresses: ChainAddress[];     // Per-chain addresses
  createdAt: number;
  index?: number;                // BIP44 account index (for software wallets)
  hardwareType?: 'ledger' | 'trezor';
  hardwareDerivationPath?: string;
}

export interface ChainAddress {
  chainId: string;               // Reference to Chain.id
  address: string;               // Chain-specific address
  derivationPath?: string;       // BIP44 path used
}

// ============================================================================
// Wallet Types
// ============================================================================

export interface Wallet {
  id: string;
  name: string;
  encryptedMnemonic?: string;    // Only for software wallets
  accounts: Account[];
  activeAccountId: string;
  createdAt: number;
  backedUp: boolean;
  version: number;               // For migrations
}

// ============================================================================
// Balance Types
// ============================================================================

export interface Balance {
  assetId: string;               // Reference to Asset.id
  chainId: string;
  address: string;
  balance: string;               // Raw balance as string (to handle big numbers)
  balanceUsd?: number;           // USD value
  lastUpdated: number;
}

export interface PortfolioBalance {
  asset: Asset;
  chain: Chain;
  balance: string;
  balanceFormatted: string;
  balanceUsd: number;
  price: number;
  priceChange24h: number;
  allocation: number;            // Percentage of total portfolio
}

export interface PortfolioSummary {
  totalValueUsd: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  balances: PortfolioBalance[];
  lastUpdated: number;
}

// ============================================================================
// Transaction Types
// ============================================================================

export type TxStatus = 'pending' | 'confirming' | 'confirmed' | 'failed';
export type TxType = 'send' | 'receive' | 'swap' | 'approve' | 'stake' | 'unstake' | 'contract';

export interface Tx {
  id: string;                    // Local UUID
  hash?: string;                 // On-chain tx hash
  chainId: string;
  type: TxType;
  status: TxStatus;
  from: string;
  to: string;
  value: string;                 // Raw value
  valueUsd?: number;
  asset: Asset;
  fee?: string;
  feeUsd?: number;
  timestamp: number;
  blockNumber?: number;
  confirmations?: number;
  nonce?: number;
  data?: string;                 // Contract call data
  metadata?: TxMetadata;
}

export interface TxMetadata {
  // For swaps
  tokenIn?: Asset;
  tokenOut?: Asset;
  amountIn?: string;
  amountOut?: string;
  // For staking
  validator?: string;
  rewards?: string;
  // For NFTs
  tokenId?: string;
  collection?: string;
}

// ============================================================================
// Swap/Quote Types
// ============================================================================

export interface SwapQuote {
  id: string;
  fromAsset: Asset;
  toAsset: Asset;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;           // After slippage
  rate: number;
  priceImpact: number;
  fee: string;
  feeUsd?: number;
  route: SwapRoute[];
  provider: string;              // DEX aggregator used
  expiresAt: number;
  gasEstimate?: string;
}

export interface SwapRoute {
  protocol: string;              // e.g., 'Uniswap V3', 'SushiSwap'
  fromToken: string;
  toToken: string;
  portion: number;               // Percentage of swap through this route
}

// ============================================================================
// Staking Types
// ============================================================================

export type StakeProvider = 'lido' | 'rocketpool' | 'tron-native' | 'eth-native';

export interface StakePosition {
  id: string;
  chainId: string;
  provider: StakeProvider;
  stakedAmount: string;
  stakedAmountUsd?: number;
  rewardsEarned: string;
  rewardsEarnedUsd?: number;
  apy: number;
  status: 'active' | 'pending' | 'unstaking' | 'withdrawn';
  stakedAt: number;
  unlockAt?: number;             // For time-locked staking
}

export interface StakeOption {
  provider: StakeProvider;
  chainId: string;
  name: string;
  description: string;
  apy: number;
  minStake: string;
  lockPeriod?: number;           // In seconds, undefined = liquid
  enabled: boolean;
}

// ============================================================================
// Price Types
// ============================================================================

export interface PriceData {
  assetId: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: number;
}

export interface PriceHistory {
  assetId: string;
  prices: Array<{
    timestamp: number;
    price: number;
  }>;
  timeframe: '1h' | '24h' | '7d' | '30d' | '1y';
}

// ============================================================================
// Fee Estimation Types
// ============================================================================

export interface FeeEstimate {
  chainId: string;
  slow: FeeOption;
  medium: FeeOption;
  fast: FeeOption;
  lastUpdated: number;
}

export interface FeeOption {
  gasPrice?: string;             // For legacy txs
  maxFeePerGas?: string;         // For EIP-1559
  maxPriorityFeePerGas?: string;
  gasLimit?: string;
  totalFee: string;
  totalFeeUsd?: number;
  estimatedTime: string;         // e.g., "~30 sec"
}

// ============================================================================
// Notification/Alert Types
// ============================================================================

export interface PriceAlert {
  id: string;
  assetId: string;
  targetPrice: number;
  condition: 'above' | 'below';
  enabled: boolean;
  triggered: boolean;
  triggeredAt?: number;
  createdAt: number;
}

// ============================================================================
// Hardware Wallet Types
// ============================================================================

export interface HardwareWalletInfo {
  type: 'ledger' | 'trezor';
  connected: boolean;
  model?: string;
  firmwareVersion?: string;
  supportedChains: string[];
}

// ============================================================================
// Network Status Types
// ============================================================================

export interface NetworkStatus {
  chainId: string;
  connected: boolean;
  blockNumber?: number;
  gasPrice?: string;
  lastChecked: number;
}
