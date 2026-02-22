import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, Info, Loader2, ChevronRight } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { 
  STAKING_POOLS, 
  getPoolsForChain, 
  getLidoApy,
  formatApy,
  getStakedPositions,
  type StakingPool,
  type StakedPosition,
} from '../../services/stakingService';
import { ethers } from 'ethers';

const StakingScreen: React.FC = () => {
  const { chainId, chain, activeAccount, provider } = useWallet();
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [positions, setPositions] = useState<StakedPosition[]>([]);
  const [lidoApy, setLidoApy] = useState(3.8);
  const [balance, setBalance] = useState('0');
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const chainPools = getPoolsForChain(chainId);
    setPools(chainPools);
    setPositions(getStakedPositions());
    fetchLidoApy();
    fetchBalance();
  }, [chainId, activeAccount?.address]);

  const fetchLidoApy = async () => {
    const apy = await getLidoApy();
    setLidoApy(apy);
  };

  const fetchBalance = async () => {
    if (!activeAccount?.address || !provider) return;
    try {
      const bal = await provider.getBalance(activeAccount.address);
      setBalance(ethers.formatEther(bal));
    } catch (e) {
      console.error('Failed to fetch balance:', e);
    }
  };

  const handleStake = async () => {
    if (!selectedPool || !stakeAmount || !activeAccount) return;
    setIsStaking(true);
    setError(null);
    
    try {
      // In production, this would call the actual staking contract
      // For now, we'll simulate the transaction
      console.log(`Staking ${stakeAmount} ${selectedPool.asset} via ${selectedPool.protocol}`);
      
      // Simulate delay
      await new Promise(r => setTimeout(r, 2000));
      
      // Reset state
      setStakeAmount('');
      setSelectedPool(null);
      fetchBalance();
    } catch (e: any) {
      setError(e.message || 'Staking failed');
    }
    setIsStaking(false);
  };

  // Format price helper
  const _formatPrice = (val: number) => val >= 1 ? val.toFixed(2) : val.toFixed(6);
  void _formatPrice; // Suppress unused warning

  return (
    <div className="flex-1 bg-[#0D1117] overflow-auto pb-20">
      {/* Header */}
      <div className="p-4 pt-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#F0B90B]/10 rounded-full flex items-center justify-center">
            <Coins className="w-5 h-5 text-[#F0B90B]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Earn</h1>
            <p className="text-gray-500 text-sm">Stake crypto & earn rewards</p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-br from-[#F0B90B]/20 to-[#F0B90B]/5 rounded-2xl p-4 border border-[#F0B90B]/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Total Staked Value</span>
            <span className="text-[#F0B90B] text-sm flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Earning
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">$0.00</p>
          <p className="text-gray-500 text-sm">
            {positions.length} active position{positions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Available Pools */}
      <div className="px-4 mb-6">
        <h2 className="text-white font-semibold mb-3">Available on {chain.name}</h2>
        
        {pools.length === 0 ? (
          <div className="bg-[#1A1A2E] rounded-2xl p-6 text-center">
            <p className="text-gray-400">No staking pools available on this network</p>
            <p className="text-gray-600 text-sm mt-1">Switch to Ethereum for more options</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pools.map(pool => (
              <button
                key={pool.id}
                onClick={() => setSelectedPool(pool)}
                className="w-full bg-[#1A1A2E] rounded-2xl p-4 hover:bg-[#252542] transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-2xl">
                      {pool.icon}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{pool.name}</p>
                      <p className="text-gray-500 text-sm">{pool.protocol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-500 font-bold">
                      {pool.id.includes('lido') ? formatApy(lidoApy) : formatApy(pool.apy)}
                    </p>
                    <p className="text-gray-500 text-sm">APY</p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">
                      Min: {pool.minStake} {pool.asset}
                    </span>
                    {pool.isLiquid && (
                      <span className="text-green-500 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Liquid
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* All Staking Options */}
      <div className="px-4 mb-6">
        <h2 className="text-white font-semibold mb-3">All Networks</h2>
        <div className="space-y-3">
          {STAKING_POOLS.filter(p => !pools.includes(p)).map(pool => (
            <div
              key={pool.id}
              className="bg-[#1A1A2E] rounded-2xl p-4 opacity-60"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center text-2xl grayscale">
                    {pool.icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{pool.name}</p>
                    <p className="text-gray-500 text-sm">Switch network to stake</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 font-bold">{formatApy(pool.apy)}</p>
                  <p className="text-gray-600 text-sm">APY</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stake Modal */}
      {selectedPool && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="w-full bg-[#1A1A2E] rounded-t-3xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Stake {selectedPool.asset}</h3>
              <button onClick={() => setSelectedPool(null)} className="text-gray-400">✕</button>
            </div>

            <div className="bg-[#0D1117] rounded-xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-sm">Amount</span>
                <span className="text-gray-400 text-sm">Balance: {parseFloat(balance).toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-2xl text-white outline-none"
                />
                <button
                  onClick={() => setStakeAmount((parseFloat(balance) * 0.95).toFixed(6))}
                  className="text-[#F0B90B] text-sm font-medium"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="bg-[#0D1117] rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">You will receive</span>
                <span className="text-white">{stakeAmount || '0'} {selectedPool.rewardAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">APY</span>
                <span className="text-green-500">{formatApy(lidoApy)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-500 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleStake}
              disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
              className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 text-black font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              {isStaking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Staking...
                </>
              ) : (
                'Stake'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StakingScreen;
