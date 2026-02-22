// Gas Tracker Service
// Real-time gas prices, predictions, and optimization

import { ethers } from 'ethers';
import { CHAINS } from '../config/chains';

export interface GasPrice {
  slow: bigint;
  standard: bigint;
  fast: bigint;
  instant: bigint;
  baseFee?: bigint;
  priorityFee?: bigint;
}

export interface GasPriceFormatted {
  slow: number;
  standard: number;
  fast: number;
  instant: number;
  baseFee?: number;
  unit: string;
}

export interface GasPrediction {
  time: string;
  expectedPrice: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface GasHistory {
  timestamp: number;
  price: number;
}

// In-memory cache for gas prices
const gasCache: Record<number, { price: GasPrice; timestamp: number }> = {};
const CACHE_TTL = 15000; // 15 seconds

// Get current gas prices
export const getGasPrice = async (chainId: number): Promise<GasPrice> => {
  // Check cache
  const cached = gasCache[chainId];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }

  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error('Chain not supported');
  }

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);

  try {
    const feeData = await provider.getFeeData();
    
    const baseFee = feeData.gasPrice || BigInt(0);
    const priorityFee = feeData.maxPriorityFeePerGas || BigInt(0);

    // Calculate different speed tiers
    const price: GasPrice = {
      slow: baseFee * BigInt(90) / BigInt(100),
      standard: baseFee,
      fast: baseFee * BigInt(120) / BigInt(100) + priorityFee,
      instant: baseFee * BigInt(150) / BigInt(100) + priorityFee * BigInt(2),
      baseFee,
      priorityFee,
    };

    // Cache result
    gasCache[chainId] = { price, timestamp: Date.now() };

    return price;
  } catch (error) {
    console.error('Failed to fetch gas price:', error);
    // Return fallback values
    const fallback = BigInt(20) * BigInt(10 ** 9); // 20 gwei
    return {
      slow: fallback * BigInt(80) / BigInt(100),
      standard: fallback,
      fast: fallback * BigInt(120) / BigInt(100),
      instant: fallback * BigInt(150) / BigInt(100),
    };
  }
};

// Format gas price for display
export const formatGasPrice = (gasPrice: GasPrice, _chainId?: number): GasPriceFormatted => {
  // Use gwei for EVM chains
  const toGwei = (wei: bigint) => Number(wei) / 1e9;
  
  return {
    slow: Math.round(toGwei(gasPrice.slow) * 10) / 10,
    standard: Math.round(toGwei(gasPrice.standard) * 10) / 10,
    fast: Math.round(toGwei(gasPrice.fast) * 10) / 10,
    instant: Math.round(toGwei(gasPrice.instant) * 10) / 10,
    baseFee: gasPrice.baseFee ? Math.round(toGwei(gasPrice.baseFee) * 10) / 10 : undefined,
    unit: 'gwei',
  };
};

// Estimate transaction cost
export const estimateTransactionCost = async (
  chainId: number,
  gasLimit: number,
  speed: 'slow' | 'standard' | 'fast' | 'instant' = 'standard'
): Promise<{ wei: bigint; formatted: string; usd?: number }> => {
  const gasPrice = await getGasPrice(chainId);
  const priceForSpeed = gasPrice[speed];
  const costWei = priceForSpeed * BigInt(gasLimit);
  
  const chain = CHAINS[chainId];
  const formatted = `${(Number(costWei) / 1e18).toFixed(6)} ${chain?.symbol || 'ETH'}`;

  return { wei: costWei, formatted };
};

// Get gas price predictions (simplified algorithm)
export const getGasPredictions = async (chainId: number): Promise<GasPrediction[]> => {
  const currentPrice = await getGasPrice(chainId);
  const currentGwei = Number(currentPrice.standard) / 1e9;
  
  // Simplified predictions based on typical patterns
  const predictions: GasPrediction[] = [];
  const now = new Date();
  const hour = now.getUTCHours();
  
  // Patterns based on typical network usage
  // Lower on weekends, higher during US/EU business hours
  const dayOfWeek = now.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  for (let i = 1; i <= 6; i++) {
    const futureHour = (hour + i * 4) % 24;
    let modifier = 1;
    let confidence: GasPrediction['confidence'] = 'medium';
    
    // Lower gas during off-peak hours (UTC 2-8)
    if (futureHour >= 2 && futureHour <= 8) {
      modifier = 0.7;
      confidence = 'high';
    }
    // Higher gas during peak hours (UTC 14-20)
    else if (futureHour >= 14 && futureHour <= 20) {
      modifier = 1.3;
      confidence = 'high';
    }
    
    // Weekend discount
    if (isWeekend) {
      modifier *= 0.85;
    }
    
    const predictedTime = new Date(now.getTime() + i * 4 * 60 * 60 * 1000);
    predictions.push({
      time: predictedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expectedPrice: Math.round(currentGwei * modifier),
      confidence,
    });
  }
  
  return predictions;
};

// Check if current gas is considered low
export const isGasLow = async (chainId: number): Promise<boolean> => {
  const price = await getGasPrice(chainId);
  const gwei = Number(price.standard) / 1e9;
  
  // Thresholds vary by chain
  const thresholds: Record<number, number> = {
    1: 30,    // Ethereum: < 30 gwei is low
    56: 5,    // BSC: < 5 gwei is low
    137: 50,  // Polygon: < 50 gwei is low
    42161: 0.1, // Arbitrum
    10: 0.01,   // Optimism
  };
  
  const threshold = thresholds[chainId] || 30;
  return gwei < threshold;
};

// Get gas status label
export const getGasStatus = (gwei: number, chainId: number): { label: string; color: string } => {
  const thresholds: Record<number, { low: number; mid: number }> = {
    1: { low: 30, mid: 60 },
    56: { low: 5, mid: 10 },
    137: { low: 50, mid: 150 },
    42161: { low: 0.1, mid: 0.3 },
    10: { low: 0.01, mid: 0.05 },
    43114: { low: 30, mid: 60 },
    8453: { low: 0.01, mid: 0.1 },
  };
  
  const t = thresholds[chainId] || { low: 30, mid: 60 };
  
  if (gwei <= t.low) return { label: 'Low', color: '#22c55e' };
  if (gwei <= t.mid) return { label: 'Normal', color: '#eab308' };
  return { label: 'High', color: '#ef4444' };
};

// Subscribe to gas price updates
export const subscribeToGasUpdates = (
  chainId: number,
  callback: (price: GasPriceFormatted) => void,
  intervalMs: number = 15000
): (() => void) => {
  let isActive = true;
  
  const update = async () => {
    if (!isActive) return;
    try {
      const price = await getGasPrice(chainId);
      callback(formatGasPrice(price, chainId));
    } catch (error) {
      console.error('Gas update error:', error);
    }
  };
  
  // Initial update
  update();
  
  // Set up interval
  const intervalId = setInterval(update, intervalMs);
  
  // Return unsubscribe function
  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
};

// Get optimal time suggestion
export const getOptimalTimeSuggestion = async (chainId: number): Promise<string> => {
  const predictions = await getGasPredictions(chainId);
  const lowestPrediction = predictions.reduce((min, p) => 
    p.expectedPrice < min.expectedPrice ? p : min
  );
  
  if (lowestPrediction.confidence === 'high') {
    return `Best time: ~${lowestPrediction.time} (${lowestPrediction.expectedPrice} gwei expected)`;
  }
  return `Lower fees expected around ${lowestPrediction.time}`;
};
