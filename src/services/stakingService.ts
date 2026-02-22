/**
 * Staking Service - Crypto staking via Lido and other protocols
 */

import { ethers } from 'ethers';

export interface StakingPool {
  id: string;
  name: string;
  protocol: string;
  asset: string;
  rewardAsset: string;
  apy: number;
  minStake: number;
  chainId: number;
  contractAddress: string;
  description: string;
  icon: string;
  isLiquid: boolean; // Can withdraw anytime
  lockPeriod?: number; // Days
  tvl?: number;
}

export interface StakedPosition {
  poolId: string;
  stakedAmount: number;
  rewardsEarned: number;
  stakedAt: number;
  lastClaimAt?: number;
}

// Lido stETH contract on Ethereum Mainnet
const LIDO_STETH_ADDRESS = '0xae7ab96520DE3A18E5e111B5EasB01cF77DD8e5';
const LIDO_STETH_ABI = [
  'function submit(address _referral) external payable returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function getPooledEthByShares(uint256 _sharesAmount) external view returns (uint256)',
];

// Available staking pools
export const STAKING_POOLS: StakingPool[] = [
  {
    id: 'lido-eth',
    name: 'Lido Staked ETH',
    protocol: 'Lido',
    asset: 'ETH',
    rewardAsset: 'stETH',
    apy: 3.8, // Dynamic, fetched from API
    minStake: 0.001,
    chainId: 1,
    contractAddress: LIDO_STETH_ADDRESS,
    description: 'Stake ETH and receive stETH. Earn staking rewards while keeping your assets liquid.',
    icon: '🔷',
    isLiquid: true,
  },
  {
    id: 'lido-eth-arb',
    name: 'Lido wstETH',
    protocol: 'Lido',
    asset: 'ETH',
    rewardAsset: 'wstETH',
    apy: 3.8,
    minStake: 0.001,
    chainId: 42161, // Arbitrum
    contractAddress: '0x5979D7b546E38E414F7E9822514be443A4800529',
    description: 'Wrapped stETH on Arbitrum. Lower gas fees for staking.',
    icon: '🔷',
    isLiquid: true,
  },
  {
    id: 'rocket-pool',
    name: 'Rocket Pool ETH',
    protocol: 'Rocket Pool',
    asset: 'ETH',
    rewardAsset: 'rETH',
    apy: 3.5,
    minStake: 0.01,
    chainId: 1,
    contractAddress: '0xae78736Cd615f374D3085123A210448E74Fc6393',
    description: 'Decentralized ETH staking. Receive rETH which appreciates in value.',
    icon: '🚀',
    isLiquid: true,
  },
];

/**
 * Get staking pools for a specific chain
 */
export function getPoolsForChain(chainId: number): StakingPool[] {
  return STAKING_POOLS.filter(pool => pool.chainId === chainId);
}

/**
 * Get pool by ID
 */
export function getPoolById(poolId: string): StakingPool | undefined {
  return STAKING_POOLS.find(pool => pool.id === poolId);
}

/**
 * Fetch current Lido APY
 */
export async function getLidoApy(): Promise<number> {
  try {
    const response = await fetch('https://eth-api.lido.fi/v1/protocol/steth/apr/sma');
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    return data.data.smaApr || 3.8;
  } catch (error) {
    console.error('Failed to fetch Lido APY:', error);
    return 3.8; // Fallback APY
  }
}

/**
 * Stake ETH via Lido
 */
export async function stakeWithLido(
  signer: ethers.Signer,
  amountEth: string,
  referral: string = ethers.ZeroAddress
): Promise<string> {
  const lidoContract = new ethers.Contract(LIDO_STETH_ADDRESS, LIDO_STETH_ABI, signer);
  
  const tx = await lidoContract.submit(referral, {
    value: ethers.parseEther(amountEth),
  });
  
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Get stETH balance
 */
export async function getStethBalance(
  provider: ethers.Provider,
  address: string
): Promise<string> {
  const lidoContract = new ethers.Contract(LIDO_STETH_ADDRESS, LIDO_STETH_ABI, provider);
  const balance = await lidoContract.balanceOf(address);
  return ethers.formatEther(balance);
}

/**
 * Calculate estimated rewards
 */
export function calculateEstimatedRewards(
  stakedAmount: number,
  apy: number,
  days: number
): number {
  const dailyRate = apy / 100 / 365;
  return stakedAmount * dailyRate * days;
}

/**
 * Get user's staked positions (from localStorage for now)
 */
export function getStakedPositions(): StakedPosition[] {
  try {
    const stored = localStorage.getItem('4ortinx_staked_positions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save staked position
 */
export function saveStakedPosition(position: StakedPosition): void {
  const positions = getStakedPositions();
  const existingIndex = positions.findIndex(p => p.poolId === position.poolId);
  
  if (existingIndex >= 0) {
    positions[existingIndex] = position;
  } else {
    positions.push(position);
  }
  
  localStorage.setItem('4ortinx_staked_positions', JSON.stringify(positions));
}

/**
 * Get total staked value across all positions
 */
export function getTotalStakedValue(
  positions: StakedPosition[],
  prices: Record<string, number>
): number {
  return positions.reduce((total, position) => {
    const pool = getPoolById(position.poolId);
    if (!pool) return total;
    
    const price = prices[pool.asset] || 0;
    return total + position.stakedAmount * price;
  }, 0);
}

/**
 * Get total rewards earned across all positions
 */
export function getTotalRewardsEarned(positions: StakedPosition[]): number {
  return positions.reduce((total, position) => total + position.rewardsEarned, 0);
}

/**
 * Format APY for display
 */
export function formatApy(apy: number): string {
  return `${apy.toFixed(2)}%`;
}

/**
 * Format staking duration
 */
export function formatStakingDuration(stakedAt: number): string {
  const now = Date.now();
  const diff = now - stakedAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

/**
 * Check if user can stake
 */
export function canStake(
  pool: StakingPool,
  amount: number,
  balance: number
): { canStake: boolean; reason?: string } {
  if (amount < pool.minStake) {
    return { canStake: false, reason: `Minimum stake is ${pool.minStake} ${pool.asset}` };
  }
  
  if (amount > balance) {
    return { canStake: false, reason: 'Insufficient balance' };
  }
  
  return { canStake: true };
}

/**
 * Get staking rewards rate (daily)
 */
export function getDailyRewardRate(apy: number): number {
  return apy / 365;
}

/**
 * Estimate gas for staking
 */
export async function estimateStakeGas(
  provider: ethers.Provider,
  amount: string
): Promise<bigint> {
  try {
    // Estimate gas for Lido submit
    const gasEstimate = await provider.estimateGas({
      to: LIDO_STETH_ADDRESS,
      value: ethers.parseEther(amount),
      data: ethers.id('submit(address)').slice(0, 10) + ethers.ZeroAddress.slice(2).padStart(64, '0'),
    });
    
    // Add 20% buffer
    return gasEstimate * 120n / 100n;
  } catch (error) {
    console.error('Failed to estimate gas:', error);
    return 100000n; // Fallback gas estimate
  }
}
