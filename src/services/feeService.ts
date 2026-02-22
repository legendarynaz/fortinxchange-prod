// Fee Service - Revenue Management for 4ortin-X
// Handles swap fees, on-ramp commissions, and fee collection

import { ethers } from 'ethers';

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fee Configuration
export const FEE_CONFIG = {
  // Swap fee percentage (0.5% = 50 basis points)
  SWAP_FEE_PERCENT: 0.5,
  
  // Minimum swap amount to charge fee (in USD)
  MIN_SWAP_FOR_FEE: 10,
  
  // Fee wallet address - REPLACE WITH YOUR ACTUAL WALLET
  FEE_WALLET: import.meta.env.VITE_FEE_WALLET || '0x742d35Cc6634C0532925a3b844Bc9e7595f5bE21',
  
  // Fee tiers (optional - for premium users)
  FEE_TIERS: {
    standard: 0.5,    // 0.5% for regular users
    premium: 0.3,     // 0.3% for premium subscribers
    vip: 0.1,         // 0.1% for VIP/high volume
  },
  
  // On-ramp partner fees (our cut from partner's fee)
  ONRAMP_COMMISSION: {
    moonpay: 0.5,     // 0.5% of transaction
    transak: 0.5,
    simplex: 0.4,
  },
  
  // Bridge fees
  BRIDGE_FEE_PERCENT: 0.1,
  
  // NFT marketplace fee
  NFT_FEE_PERCENT: 2.5,
};

export interface FeeCalculation {
  inputAmount: string;
  outputAmount: string;
  feeAmount: string;
  feePercent: number;
  feeInUSD: number;
  netOutputAmount: string;
  feeWallet: string;
}

export interface SwapWithFee {
  fromAmount: string;
  toAmount: string;
  toAmountAfterFee: string;
  feeAmount: string;
  feePercent: number;
}

// Calculate swap fee
export const calculateSwapFee = (
  outputAmount: string,
  outputDecimals: number,
  outputPriceUSD: number = 1,
  userTier: 'standard' | 'premium' | 'vip' = 'standard'
): FeeCalculation => {
  const feePercent = FEE_CONFIG.FEE_TIERS[userTier];
  const outputBigInt = BigInt(outputAmount);
  
  // Calculate fee in token units
  const feeBasisPoints = BigInt(Math.round(feePercent * 100)); // 0.5% = 50
  const feeAmount = (outputBigInt * feeBasisPoints) / BigInt(10000);
  const netOutputAmount = outputBigInt - feeAmount;
  
  // Calculate fee in USD
  const feeFormatted = Number(ethers.formatUnits(feeAmount, outputDecimals));
  const feeInUSD = feeFormatted * outputPriceUSD;
  
  return {
    inputAmount: outputAmount,
    outputAmount: outputAmount,
    feeAmount: feeAmount.toString(),
    feePercent,
    feeInUSD,
    netOutputAmount: netOutputAmount.toString(),
    feeWallet: FEE_CONFIG.FEE_WALLET,
  };
};

// Calculate fee for display (before swap)
export const estimateSwapFee = (
  estimatedOutput: number,
  userTier: 'standard' | 'premium' | 'vip' = 'standard'
): { feeAmount: number; feePercent: number; netOutput: number } => {
  const feePercent = FEE_CONFIG.FEE_TIERS[userTier];
  const feeAmount = estimatedOutput * (feePercent / 100);
  const netOutput = estimatedOutput - feeAmount;
  
  return {
    feeAmount,
    feePercent,
    netOutput,
  };
};

// Build swap transaction with fee
export const buildSwapWithFee = (
  toAmount: string,
  toDecimals: number,
  userTier: 'standard' | 'premium' | 'vip' = 'standard'
): SwapWithFee => {
  const feeCalc = calculateSwapFee(toAmount, toDecimals, 1, userTier);
  
  return {
    fromAmount: toAmount,
    toAmount: toAmount,
    toAmountAfterFee: feeCalc.netOutputAmount,
    feeAmount: feeCalc.feeAmount,
    feePercent: feeCalc.feePercent,
  };
};

// Format fee for display
export const formatFeeDisplay = (
  feeAmount: number,
  symbol: string,
  feePercent: number
): string => {
  if (feeAmount < 0.000001) return `< 0.000001 ${symbol} (${feePercent}%)`;
  return `${feeAmount.toFixed(6)} ${symbol} (${feePercent}%)`;
};

// Check if swap qualifies for fee (minimum amount check)
export const shouldChargeFee = (amountUSD: number): boolean => {
  return amountUSD >= FEE_CONFIG.MIN_SWAP_FOR_FEE;
};

// Calculate on-ramp commission
export const calculateOnrampCommission = (
  amount: number,
  partner: 'moonpay' | 'transak' | 'simplex'
): number => {
  const commissionPercent = FEE_CONFIG.ONRAMP_COMMISSION[partner];
  return amount * (commissionPercent / 100);
};

// Calculate bridge fee
export const calculateBridgeFee = (amount: number): number => {
  return amount * (FEE_CONFIG.BRIDGE_FEE_PERCENT / 100);
};

// Calculate NFT marketplace fee
export const calculateNFTFee = (salePrice: number): number => {
  return salePrice * (FEE_CONFIG.NFT_FEE_PERCENT / 100);
};

// Revenue tracking (for analytics)
export interface RevenueEvent {
  type: 'swap' | 'onramp' | 'bridge' | 'nft' | 'premium';
  amount: number;
  currency: string;
  timestamp: number;
  txHash?: string;
  userAddress?: string;
  chainId: number;
}

// Store revenue event - sends to backend API
export const trackRevenueEvent = async (event: RevenueEvent): Promise<void> => {
  console.log('[Revenue]', event);
  
  // Store locally as backup
  const events = JSON.parse(localStorage.getItem('4ortinx_revenue_events') || '[]');
  events.push(event);
  localStorage.setItem('4ortinx_revenue_events', JSON.stringify(events.slice(-100)));
  
  // Send to backend
  try {
    const response = await fetch(`${API_URL}/fees/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: event.type,
        chainId: event.chainId,
        txHash: event.txHash || `local_${Date.now()}`,
        userAddress: event.userAddress || 'unknown',
        grossAmount: event.amount.toString(),
        feeAmount: event.amount.toString(),
        feePercent: 0.5,
        feeUsd: event.amount,
        tokenSymbol: event.currency,
        metadata: { timestamp: event.timestamp },
      }),
    });
    
    if (!response.ok) {
      console.warn('Failed to record fee on backend:', await response.text());
    }
  } catch (error) {
    console.warn('Backend fee recording failed:', error);
    // Local storage serves as fallback
  }
};

// Get revenue summary (for admin dashboard)
export const getRevenueSummary = (): {
  total: number;
  byType: Record<string, number>;
  last24h: number;
  last7d: number;
} => {
  const events: RevenueEvent[] = JSON.parse(
    localStorage.getItem('4ortinx_revenue_events') || '[]'
  );
  
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  let total = 0;
  let last24h = 0;
  let last7d = 0;
  const byType: Record<string, number> = {};
  
  events.forEach(event => {
    total += event.amount;
    byType[event.type] = (byType[event.type] || 0) + event.amount;
    
    if (now - event.timestamp < day) last24h += event.amount;
    if (now - event.timestamp < 7 * day) last7d += event.amount;
  });
  
  return { total, byType, last24h, last7d };
};

// Premium subscription check - checks backend API
export const getUserTier = async (address: string): Promise<'standard' | 'premium' | 'vip'> => {
  try {
    const response = await fetch(`${API_URL}/fees/tier/${address.toLowerCase()}`);
    if (response.ok) {
      const data = await response.json();
      return data.tier || 'standard';
    }
  } catch (error) {
    console.warn('Failed to fetch user tier:', error);
  }
  
  // Fallback to local storage
  const premiumUsers = JSON.parse(localStorage.getItem('4ortinx_premium_users') || '{}');
  return premiumUsers[address.toLowerCase()] || 'standard';
};

// Sync version for immediate use (uses cached value)
export const getUserTierSync = (address: string): 'standard' | 'premium' | 'vip' => {
  const premiumUsers = JSON.parse(localStorage.getItem('4ortinx_premium_users') || '{}');
  return premiumUsers[address.toLowerCase()] || 'standard';
};

// Set user tier (admin function)
export const setUserTier = (
  address: string, 
  tier: 'standard' | 'premium' | 'vip'
): void => {
  const premiumUsers = JSON.parse(localStorage.getItem('4ortinx_premium_users') || '{}');
  premiumUsers[address.toLowerCase()] = tier;
  localStorage.setItem('4ortinx_premium_users', JSON.stringify(premiumUsers));
};

// Confirm fee transaction was successful (call after tx confirms)
export const confirmFeeTransaction = async (txHash: string, chainId: number): Promise<void> => {
  try {
    await fetch(`${API_URL}/fees/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash, chainId }),
    });
  } catch (error) {
    console.warn('Failed to confirm fee transaction:', error);
  }
};

// Get user's fee history
export const getUserFeeHistory = async (address: string): Promise<RevenueEvent[]> => {
  try {
    const response = await fetch(`${API_URL}/fees/user/${address.toLowerCase()}`);
    if (response.ok) {
      const data = await response.json();
      return data.transactions || [];
    }
  } catch (error) {
    console.warn('Failed to fetch fee history:', error);
  }
  
  // Fallback to local storage
  return JSON.parse(localStorage.getItem('4ortinx_revenue_events') || '[]');
};
