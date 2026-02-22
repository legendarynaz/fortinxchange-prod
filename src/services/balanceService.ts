// Balance Service - Fetch on-chain token balances
import { ethers } from 'ethers';
import { getProvider } from './walletService';
import { CHAINS, POPULAR_TOKENS, type TokenConfig } from '../config/chains';

export interface TokenBalance {
  address: string; // '0x0' for native token
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  balanceUSD?: number;
  price?: number;
  priceChange24h?: number;
  logoUrl?: string;
  isNative: boolean;
}

// ERC-20 ABI for balance and token info
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

// Get native token balance
export const getNativeBalance = async (
  address: string,
  chainId: number
): Promise<TokenBalance> => {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);
  
  const provider = getProvider(chainId);
  const balance = await provider.getBalance(address);
  
  return {
    address: '0x0000000000000000000000000000000000000000',
    symbol: chain.symbol,
    name: chain.nativeCurrency.name,
    decimals: chain.decimals,
    balance: balance.toString(),
    balanceFormatted: ethers.formatUnits(balance, chain.decimals),
    isNative: true,
  };
};

// Get ERC-20 token balance
export const getTokenBalance = async (
  walletAddress: string,
  tokenConfig: TokenConfig,
  chainId: number
): Promise<TokenBalance> => {
  const provider = getProvider(chainId);
  const contract = new ethers.Contract(tokenConfig.address, ERC20_ABI, provider);
  
  try {
    const balance = await contract.balanceOf(walletAddress);
    
    return {
      address: tokenConfig.address,
      symbol: tokenConfig.symbol,
      name: tokenConfig.name,
      decimals: tokenConfig.decimals,
      balance: balance.toString(),
      balanceFormatted: ethers.formatUnits(balance, tokenConfig.decimals),
      logoUrl: tokenConfig.logoUrl,
      isNative: false,
    };
  } catch (error) {
    console.error(`Failed to get balance for ${tokenConfig.symbol}:`, error);
    return {
      address: tokenConfig.address,
      symbol: tokenConfig.symbol,
      name: tokenConfig.name,
      decimals: tokenConfig.decimals,
      balance: '0',
      balanceFormatted: '0',
      logoUrl: tokenConfig.logoUrl,
      isNative: false,
    };
  }
};

const CUSTOM_TOKENS_KEY = '4ortinx_custom_tokens';

// Get custom tokens from localStorage
const getCustomTokens = (chainId: number): TokenConfig[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_TOKENS_KEY);
    if (!stored) return [];
    const tokens: Record<number, TokenConfig[]> = JSON.parse(stored);
    return tokens[chainId] || [];
  } catch {
    return [];
  }
};

// Non-EVM chain IDs that should be skipped
const NON_EVM_CHAINS = [728126428]; // Tron

// Get all balances for an address on a chain
export const getAllBalances = async (
  address: string,
  chainId: number,
  includeZeroBalances: boolean = false
): Promise<TokenBalance[]> => {
  const balances: TokenBalance[] = [];
  
  // Skip non-EVM chains (they have their own balance handling)
  if (NON_EVM_CHAINS.includes(chainId)) {
    return balances;
  }
  
  // Get native token balance
  try {
    const nativeBalance = await getNativeBalance(address, chainId);
    if (includeZeroBalances || parseFloat(nativeBalance.balanceFormatted) > 0) {
      balances.push(nativeBalance);
    }
  } catch (error) {
    console.error('Failed to get native balance:', error);
  }
  
  // Combine popular tokens with custom tokens
  const popularTokens = POPULAR_TOKENS[chainId] || [];
  const customTokens = getCustomTokens(chainId);
  
  // Merge tokens, avoiding duplicates
  const tokenMap = new Map<string, TokenConfig>();
  [...popularTokens, ...customTokens].forEach(token => {
    tokenMap.set(token.address.toLowerCase(), token);
  });
  const allTokens = Array.from(tokenMap.values());
  
  await Promise.all(
    allTokens.map(async (token) => {
      try {
        const tokenBalance = await getTokenBalance(address, token, chainId);
        if (includeZeroBalances || parseFloat(tokenBalance.balanceFormatted) > 0) {
          balances.push(tokenBalance);
        }
      } catch (error) {
        console.error(`Failed to get ${token.symbol} balance:`, error);
      }
    })
  );
  
  return balances;
};

// Get custom token info
export const getTokenInfo = async (
  tokenAddress: string,
  chainId: number
): Promise<TokenConfig | null> => {
  try {
    const provider = getProvider(chainId);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [symbol, name, decimals] = await Promise.all([
      contract.symbol(),
      contract.name(),
      contract.decimals(),
    ]);
    
    return {
      address: tokenAddress,
      symbol,
      name,
      decimals: Number(decimals),
    };
  } catch (error) {
    console.error('Failed to get token info:', error);
    return null;
  }
};

// Format balance for display
export const formatBalance = (balance: string, decimals: number = 4): string => {
  const num = parseFloat(balance);
  if (num === 0) return '0';
  if (num < 0.0001) return '<0.0001';
  if (num < 1) return num.toFixed(decimals);
  if (num < 1000) return num.toFixed(decimals);
  if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
  return `${(num / 1000000).toFixed(2)}M`;
};

// Calculate total portfolio value
export const calculateTotalValue = (balances: TokenBalance[]): number => {
  return balances.reduce((total, token) => {
    return total + (token.balanceUSD || 0);
  }, 0);
};
