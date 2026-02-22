// DEX Aggregator Service - 1inch API Integration
import { ethers } from 'ethers';
import { CHAINS } from '../config/chains';

const INCH_API_BASE = 'https://api.1inch.dev/swap/v6.0';
const INCH_API_KEY = import.meta.env.VITE_1INCH_API_KEY || '';

// Supported chains for 1inch
export const SUPPORTED_CHAINS = [1, 56, 137, 42161, 10, 43114, 250, 8453];
const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS;

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  protocols: string[][];
  priceImpact?: number;
}

export interface SwapParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  slippage: number;
}

// Native token address representation
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Check if chain is supported
export const isChainSupported = (chainId: number): boolean => {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
};

// Get tokens list for a chain
export const getTokens = async (chainId: number): Promise<Token[]> => {
  if (!isChainSupported(chainId)) {
    return getDefaultTokens(chainId);
  }

  try {
    const response = await fetch(`${INCH_API_BASE}/${chainId}/tokens`, {
      headers: INCH_API_KEY ? { 'Authorization': `Bearer ${INCH_API_KEY}` } : {},
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tokens');
    }
    
    const data = await response.json();
    return Object.values(data.tokens) as Token[];
  } catch (error) {
    console.error('Failed to fetch tokens from 1inch:', error);
    return getDefaultTokens(chainId);
  }
};

// Get default tokens for unsupported chains or fallback
const getDefaultTokens = (chainId: number): Token[] => {
  const chain = CHAINS[chainId];
  if (!chain) return [];
  
  return [
    {
      address: NATIVE_TOKEN_ADDRESS,
      symbol: chain.symbol,
      name: chain.nativeCurrency.name,
      decimals: chain.decimals,
    },
  ];
};

// Get swap quote
export const getSwapQuote = async (
  chainId: number,
  fromToken: string,
  toToken: string,
  amount: string
): Promise<SwapQuote | null> => {
  if (!isChainSupported(chainId)) {
    console.warn('Chain not supported for swaps');
    return null;
  }

  try {
    const params = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount: amount,
    });

    const response = await fetch(`${INCH_API_BASE}/${chainId}/quote?${params}`, {
      headers: INCH_API_KEY ? { 'Authorization': `Bearer ${INCH_API_KEY}` } : {},
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.description || 'Failed to get quote');
    }
    
    const data = await response.json();
    
    return {
      fromToken: data.srcToken,
      toToken: data.dstToken,
      fromAmount: data.srcAmount,
      toAmount: data.dstAmount,
      estimatedGas: data.gas?.toString() || '0',
      protocols: data.protocols || [],
    };
  } catch (error) {
    console.error('Failed to get swap quote:', error);
    return null;
  }
};

// Build swap transaction (simplified for DexSwapScreen)
export const buildSwapTransaction = async (
  chainId: number,
  fromToken: string,
  toToken: string,
  amount: string,
  fromAddress: string,
  slippage: number = 1
): Promise<any | null> => {
  if (!isChainSupported(chainId)) {
    return null;
  }

  try {
    const urlParams = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount: amount,
      from: fromAddress,
      slippage: slippage.toString(),
      disableEstimate: 'true',
    });

    const response = await fetch(`${INCH_API_BASE}/${chainId}/swap?${urlParams}`, {
      headers: INCH_API_KEY ? { 'Authorization': `Bearer ${INCH_API_KEY}` } : {},
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.description || 'Failed to build swap');
    }
    
    const data = await response.json();
    
    return data.tx;
  } catch (error) {
    console.error('Failed to build swap transaction:', error);
    return null;
  }
};

// Execute swap (simplified - requires wallet integration)
export const executeSwap = async (
  txData: any
): Promise<string | null> => {
  try {
    // This requires the frontend to handle wallet signing
    // For now, return null - the frontend will use window.ethereum or similar
    console.log('Swap tx data:', txData);
    return null;
  } catch (error) {
    console.error('Failed to execute swap:', error);
    return null;
  }
};

// Approve token for spending
export const approveToken = async (
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  signer?: ethers.Signer
): Promise<void> => {
  if (!signer) {
    console.warn('No signer provided for approval');
    return;
  }
  const erc20Abi = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
  ];
  
  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
  
  // Check current allowance
  const currentAllowance = await tokenContract.allowance(
    await signer.getAddress(),
    spenderAddress
  );
  
  if (currentAllowance >= BigInt(amount)) {
    return; // Already approved
  }
  
  // Approve max amount
  const approveTx = await tokenContract.approve(
    spenderAddress,
    ethers.MaxUint256
  );
  
  await approveTx.wait();
};

// Get price for display (simple quote without transaction)
export const getTokenPrice = async (
  chainId: number,
  tokenAddress: string,
  baseTokenAddress: string = NATIVE_TOKEN_ADDRESS
): Promise<number | null> => {
  try {
    const quote = await getSwapQuote(
      chainId,
      tokenAddress,
      baseTokenAddress,
      '1000000000000000000' // 1 token in wei (assuming 18 decimals)
    );
    
    if (!quote) return null;
    
    return parseFloat(ethers.formatUnits(quote.toAmount, quote.toToken.decimals));
  } catch {
    return null;
  }
};

// Format amount for display
export const formatSwapAmount = (amount: string, decimals: number): string => {
  const formatted = ethers.formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  if (num < 0.0001) return '<0.0001';
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(4);
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};
