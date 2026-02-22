// Token Safety Scanner Service
// Analyzes token contracts for potential security risks

import { ethers } from 'ethers';
import { CHAINS } from '../config/chains';

export interface TokenScanResult {
  address: string;
  chainId: number;
  safetyScore: number; // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  verified: boolean;
  warnings: TokenWarning[];
  details: TokenDetails;
  timestamp: number;
}

export interface TokenWarning {
  type: 'honeypot' | 'high_tax' | 'ownership' | 'mint' | 'proxy' | 'blacklist' | 'pause' | 'other';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
}

export interface TokenDetails {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  owner: string | null;
  isProxy: boolean;
  hasBlacklist: boolean;
  hasPause: boolean;
  hasMint: boolean;
  buyTax: number;
  sellTax: number;
  holders?: number;
  liquidityLocked?: boolean;
  contractAge?: number; // days
}

// Known safe tokens (verified by major platforms)
const KNOWN_SAFE_TOKENS: Record<number, string[]> = {
  1: [ // Ethereum
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  ],
  56: [ // BSC
    '0x55d398326f99059ff775485246999027b3197955', // USDT
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
    '0xe9e7cea3dedca5984780bafc599bd69add087d56', // BUSD
  ],
  137: [ // Polygon
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC
  ],
};

// Suspicious function signatures (for future use)
// const SUSPICIOUS_FUNCTIONS = [
//   '0x42966c68', // burn(uint256)
//   '0xa9059cbb', // transfer
//   '0x8da5cb5b', // owner()
//   '0x715018a6', // renounceOwnership()
// ];

// ERC-20 ABI for basic checks
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function owner() view returns (address)',
  'function balanceOf(address) view returns (uint256)',
];

// Scan a token contract
export const scanToken = async (
  tokenAddress: string,
  chainId: number
): Promise<TokenScanResult> => {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error('Chain not supported');
  }

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const normalizedAddress = tokenAddress.toLowerCase();

  // Check if known safe token
  if (KNOWN_SAFE_TOKENS[chainId]?.includes(normalizedAddress)) {
    return createSafeResult(tokenAddress, chainId, await getTokenDetails(tokenAddress, provider));
  }

  const warnings: TokenWarning[] = [];
  let safetyScore = 100;

  try {
    // Get token details
    const details = await getTokenDetails(tokenAddress, provider);

    // Check contract code
    const code = await provider.getCode(tokenAddress);
    if (code === '0x') {
      return {
        address: tokenAddress,
        chainId,
        safetyScore: 0,
        riskLevel: 'critical',
        verified: false,
        warnings: [{
          type: 'other',
          severity: 'danger',
          title: 'No Contract Found',
          description: 'This address does not contain a smart contract.',
        }],
        details,
        timestamp: Date.now(),
      };
    }

    // Check for proxy pattern
    if (code.includes('363d3d373d3d3d363d73') || code.includes('5860208158601c335a63')) {
      details.isProxy = true;
      warnings.push({
        type: 'proxy',
        severity: 'warning',
        title: 'Proxy Contract',
        description: 'This is a proxy contract. The implementation can be changed by the owner.',
      });
      safetyScore -= 15;
    }

    // Check for blacklist function
    if (code.toLowerCase().includes('626c61636b6c697374') || // "blacklist" in hex
        code.toLowerCase().includes('697342616e6e6564')) {    // "isBanned" in hex
      details.hasBlacklist = true;
      warnings.push({
        type: 'blacklist',
        severity: 'warning',
        title: 'Blacklist Function',
        description: 'This token has a blacklist function that can block addresses from trading.',
      });
      safetyScore -= 20;
    }

    // Check for pause function
    if (code.toLowerCase().includes('7061757365') || // "pause" in hex
        code.toLowerCase().includes('50617573656421')) { // "Paused!" in hex
      details.hasPause = true;
      warnings.push({
        type: 'pause',
        severity: 'warning',
        title: 'Pausable Contract',
        description: 'Trading can be paused by the owner at any time.',
      });
      safetyScore -= 15;
    }

    // Check for mint function
    if (code.toLowerCase().includes('6d696e74') && !normalizedAddress.includes('mint')) {
      details.hasMint = true;
      warnings.push({
        type: 'mint',
        severity: 'info',
        title: 'Mint Function',
        description: 'New tokens can be minted. Check if it\'s controlled properly.',
      });
      safetyScore -= 10;
    }

    // Check owner
    if (details.owner && details.owner !== ethers.ZeroAddress) {
      warnings.push({
        type: 'ownership',
        severity: 'info',
        title: 'Has Active Owner',
        description: 'The contract has an owner who can modify settings.',
      });
      safetyScore -= 5;
    }

    // Estimate tax (simplified - would need simulation for accuracy)
    const estimatedTax = estimateTax(code);
    details.buyTax = estimatedTax.buy;
    details.sellTax = estimatedTax.sell;

    if (estimatedTax.sell > 10) {
      warnings.push({
        type: 'high_tax',
        severity: estimatedTax.sell > 25 ? 'danger' : 'warning',
        title: 'High Sell Tax',
        description: `Estimated sell tax: ${estimatedTax.sell}%. High taxes may indicate a honeypot.`,
      });
      safetyScore -= estimatedTax.sell > 25 ? 40 : 20;
    }

    // Determine risk level
    let riskLevel: TokenScanResult['riskLevel'];
    if (safetyScore >= 80) riskLevel = 'safe';
    else if (safetyScore >= 60) riskLevel = 'low';
    else if (safetyScore >= 40) riskLevel = 'medium';
    else if (safetyScore >= 20) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
      address: tokenAddress,
      chainId,
      safetyScore: Math.max(0, safetyScore),
      riskLevel,
      verified: false, // Would need etherscan API for verification
      warnings,
      details,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Token scan error:', error);
    return {
      address: tokenAddress,
      chainId,
      safetyScore: 30,
      riskLevel: 'high',
      verified: false,
      warnings: [{
        type: 'other',
        severity: 'warning',
        title: 'Scan Incomplete',
        description: 'Could not fully analyze this contract. Proceed with caution.',
      }],
      details: createDefaultDetails(),
      timestamp: Date.now(),
    };
  }
};

// Get basic token details
const getTokenDetails = async (
  tokenAddress: string,
  provider: ethers.JsonRpcProvider
): Promise<TokenDetails> => {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name().catch(() => 'Unknown'),
      contract.symbol().catch(() => '???'),
      contract.decimals().catch(() => 18),
      contract.totalSupply().catch(() => '0'),
    ]);

    let owner = null;
    try {
      owner = await contract.owner();
    } catch {}

    return {
      name,
      symbol,
      decimals,
      totalSupply: totalSupply.toString(),
      owner,
      isProxy: false,
      hasBlacklist: false,
      hasPause: false,
      hasMint: false,
      buyTax: 0,
      sellTax: 0,
    };
  } catch {
    return createDefaultDetails();
  }
};

const createDefaultDetails = (): TokenDetails => ({
  name: 'Unknown',
  symbol: '???',
  decimals: 18,
  totalSupply: '0',
  owner: null,
  isProxy: false,
  hasBlacklist: false,
  hasPause: false,
  hasMint: false,
  buyTax: 0,
  sellTax: 0,
});

const createSafeResult = (
  address: string,
  chainId: number,
  details: TokenDetails
): TokenScanResult => ({
  address,
  chainId,
  safetyScore: 100,
  riskLevel: 'safe',
  verified: true,
  warnings: [],
  details,
  timestamp: Date.now(),
});

// Simplified tax estimation from bytecode patterns
const estimateTax = (code: string): { buy: number; sell: number } => {
  // This is a simplified heuristic - real implementation would simulate transactions
  const codeLC = code.toLowerCase();
  
  // Look for common fee patterns
  let sellTax = 0;
  let buyTax = 0;
  
  // Check for hardcoded percentages (simplified)
  if (codeLC.includes('0a')) sellTax += 2; // 10% patterns
  if (codeLC.includes('14')) sellTax += 4; // 20% patterns
  if (codeLC.includes('19')) sellTax += 5; // 25% patterns
  
  buyTax = Math.floor(sellTax * 0.8); // Usually buy tax is lower
  
  return { buy: Math.min(buyTax, 30), sell: Math.min(sellTax, 30) };
};

// Format safety score for display
export const getSafetyColor = (score: number): string => {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 60) return '#84cc16'; // lime
  if (score >= 40) return '#eab308'; // yellow
  if (score >= 20) return '#f97316'; // orange
  return '#ef4444'; // red
};

export const getSafetyLabel = (riskLevel: TokenScanResult['riskLevel']): string => {
  const labels = {
    safe: '✓ Safe',
    low: '○ Low Risk',
    medium: '⚠ Medium Risk',
    high: '⚠ High Risk',
    critical: '✕ Critical Risk',
  };
  return labels[riskLevel];
};
