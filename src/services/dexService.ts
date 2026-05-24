// DEX Aggregator Service - 1inch API Integration
// With integrator fee support for revenue generation
import { ethers } from 'ethers';
import { CHAINS } from '../config/chains';
import { FEE_CONFIG, getUserTierSync, trackRevenueEvent } from './feeService';

const INCH_API_BASE = 'https://api.1inch.dev/swap/v6.0';
const INCH_API_KEY = import.meta.env.VITE_1INCH_API_KEY || '';

// Fee wallet for receiving integrator fees
const FEE_WALLET = FEE_CONFIG.FEE_WALLET;

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
  // Fee info for display
  feePercent?: number;
  feeAmount?: string;
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

// Get swap quote (includes fee estimate for display)
export const getSwapQuote = async (
  chainId: number,
  fromToken: string,
  toToken: string,
  amount: string,
  userAddress?: string
): Promise<SwapQuote | null> => {
  if (!isChainSupported(chainId)) {
    console.warn('Chain not supported for swaps');
    return null;
  }

  try {
    // Get user's fee tier
    const userTier = userAddress ? getUserTierSync(userAddress) : 'standard';
    const feeBps = FEE_CONFIG.FEE_TIERS_BPS[userTier];
    
    const params = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount: amount,
      // Include fee in quote for accurate output estimate
      fee: feeBps.toString(),
    });

    const response = await fetch(`${INCH_API_BASE}/${chainId}/quote?${params}`, {
      headers: INCH_API_KEY ? { 'Authorization': `Bearer ${INCH_API_KEY}` } : {},
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.description || 'Failed to get quote');
    }
    
    const data = await response.json();
    
    // Calculate fee amount for display
    const outputAmount = BigInt(data.dstAmount);
    const feeAmount = (outputAmount * BigInt(feeBps)) / BigInt(10000);
    
    return {
      fromToken: data.srcToken,
      toToken: data.dstToken,
      fromAmount: data.srcAmount,
      toAmount: data.dstAmount,
      estimatedGas: data.gas?.toString() || '0',
      protocols: data.protocols || [],
      // Add fee info for UI display
      feePercent: feeBps / 100,
      feeAmount: feeAmount.toString(),
    };
  } catch (error) {
    console.error('Failed to get swap quote:', error);
    return null;
  }
};

// Build swap transaction with integrator fee
// Fee is automatically sent to FEE_WALLET by 1inch protocol
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
    // Get user's fee tier based on their address
    const userTier = getUserTierSync(fromAddress);
    const feeBps = FEE_CONFIG.FEE_TIERS_BPS[userTier];
    
    console.log(`[Swap] Building tx with ${feeBps} bps fee (${userTier} tier) -> ${FEE_WALLET}`);
    
    const urlParams = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount: amount,
      from: fromAddress,
      slippage: slippage.toString(),
      disableEstimate: 'true',
      // INTEGRATOR FEE PARAMS - This is where revenue comes from!
      fee: feeBps.toString(),           // Fee in basis points (30 = 0.3%)
      referrer: FEE_WALLET,             // Wallet that receives the fee
    });

    const response = await fetch(`${INCH_API_BASE}/${chainId}/swap?${urlParams}`, {
      headers: INCH_API_KEY ? { 'Authorization': `Bearer ${INCH_API_KEY}` } : {},
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.description || 'Failed to build swap');
    }
    
    const data = await response.json();
    
    // Attach fee metadata for tracking after tx confirms
    return {
      ...data.tx,
      _feeMetadata: {
        feeBps,
        feeWallet: FEE_WALLET,
        userTier,
        chainId,
        fromToken,
        toToken,
        amount,
      },
    };
  } catch (error) {
    console.error('Failed to build swap transaction:', error);
    return null;
  }
};

// Execute swap and track revenue
export const executeSwap = async (
  txData: any,
  signer?: ethers.Signer
): Promise<string | null> => {
  try {
    if (!signer) {
      console.warn('No signer provided - returning tx data for manual execution');
      console.log('Swap tx data:', txData);
      return null;
    }
    
    // Extract fee metadata before sending
    const feeMetadata = txData._feeMetadata;
    delete txData._feeMetadata;
    
    // Send the transaction
    const tx = await signer.sendTransaction({
      to: txData.to,
      data: txData.data,
      value: txData.value ? BigInt(txData.value) : 0n,
      gasLimit: txData.gas ? BigInt(txData.gas) : undefined,
    });
    
    console.log(`[Swap] Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (receipt && receipt.status === 1) {
      console.log(`[Swap] Transaction confirmed! Fee of ${feeMetadata?.feeBps || 30} bps sent to ${feeMetadata?.feeWallet}`);
      
      // Track revenue event
      if (feeMetadata) {
        trackRevenueEvent({
          type: 'swap',
          amount: parseFloat(feeMetadata.amount) * (feeMetadata.feeBps / 10000),
          currency: feeMetadata.toToken,
          timestamp: Date.now(),
          txHash: tx.hash,
          userAddress: await signer.getAddress(),
          chainId: feeMetadata.chainId,
        });
      }
      
      return tx.hash;
    }
    
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
