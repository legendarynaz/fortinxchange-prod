// 4ortin-X Earn Screen
// Unified staking interface for ETH (Lido) and TRON

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Lock, Unlock, Info, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useCurrency } from '../../context/CurrencyContext';
import { STAKE_OPTIONS } from '../../domain/registry';
import type { StakeOption, StakePosition } from '../../domain/types';

// LocalStorage key for persisting positions
const POSITIONS_KEY = '4ortinx_stake_positions';

interface EarnScreenProps {}

const EarnScreen: React.FC<EarnScreenProps> = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [selectedOption, setSelectedOption] = useState<StakeOption | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [positions, setPositions] = useState<StakePosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load positions from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(POSITIONS_KEY);
      if (saved) {
        setPositions(JSON.parse(saved));
      }
    } catch {
      // Start with empty positions if localStorage fails
      setPositions([]);
    }
  }, []);

  // Save positions to localStorage whenever they change
  useEffect(() => {
    if (positions.length > 0) {
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
    }
  }, [positions]);

  const handleStake = async () => {
    if (!selectedOption || !stakeAmount) return;
    
    setIsStaking(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate staking delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to positions
      const newPosition: StakePosition = {
        id: crypto.randomUUID(),
        chainId: selectedOption.chainId,
        provider: selectedOption.provider,
        stakedAmount: stakeAmount,
        stakedAmountUsd: parseFloat(stakeAmount) * 3300, // Mock price
        rewardsEarned: '0',
        rewardsEarnedUsd: 0,
        apy: selectedOption.apy,
        status: 'pending',
        stakedAt: Date.now(),
        unlockAt: selectedOption.lockPeriod 
          ? Date.now() + selectedOption.lockPeriod * 1000 
          : undefined,
      };
      
      setPositions(prev => [...prev, newPosition]);
      setSuccess(`Successfully staked ${stakeAmount} ${selectedOption.chainId === 'ethereum' ? 'ETH' : 'TRX'}`);
      setStakeAmount('');
      setSelectedOption(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Staking failed');
    } finally {
      setIsStaking(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalStakedUsd = positions.reduce((sum, p) => sum + (p.stakedAmountUsd || 0), 0);
  const totalRewardsUsd = positions.reduce((sum, p) => sum + (p.rewardsEarnedUsd || 0), 0);
  const activePositionsCount = positions.filter(p => p.status === 'active').length;

  return (
    <div className="flex flex-col min-h-screen bg-app-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-app-bg/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-card-bg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Earn</h1>
            <p className="text-xs text-gray-400">Stake & Earn Rewards</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-card-bg border-gray-800">
              <div className="text-center p-2">
                <p className="text-gray-400 text-xs mb-1">Total Staked</p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(totalStakedUsd)}
                </p>
              </div>
            </Card>
            <Card className="bg-card-bg border-gray-800">
              <div className="text-center p-2">
                <p className="text-gray-400 text-xs mb-1">Rewards</p>
                <p className={`text-lg font-bold ${totalRewardsUsd > 0 ? 'text-green-400' : 'text-white'}`}>
                  {totalRewardsUsd > 0 ? '+' : ''}{formatCurrency(totalRewardsUsd)}
                </p>
              </div>
            </Card>
            <Card className="bg-card-bg border-gray-800">
              <div className="text-center p-2">
                <p className="text-gray-400 text-xs mb-1">Positions</p>
                <p className="text-lg font-bold text-white">
                  {activePositionsCount}
                </p>
              </div>
            </Card>
          </div>

          {/* Staking Options */}
          <Card className="bg-card-bg border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Staking Options</h3>
            
            <div className="space-y-3">
              {STAKE_OPTIONS.filter(o => o.enabled).map((option) => (
                <div
                  key={`${option.provider}-${option.chainId}`}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedOption?.provider === option.provider
                      ? 'border-accent bg-accent/10'
                      : 'border-gray-700 hover:border-gray-600 bg-card-hover'
                  }`}
                  onClick={() => setSelectedOption(option)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        option.chainId === 'ethereum' ? 'bg-eth' : 'bg-trx'
                      }`}>
                        <span className="text-white font-bold">
                          {option.chainId === 'ethereum' ? 'Ξ' : 'T'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{option.name}</h4>
                        <p className="text-xs text-gray-400">{option.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-accent">{option.apy}%</p>
                      <p className="text-xs text-gray-400">APY</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs">
                    {option.lockPeriod ? (
                      <div className="flex items-center gap-1 text-amber-400">
                        <Lock className="w-3 h-3" />
                        <span>{Math.floor(option.lockPeriod / (24 * 60 * 60))}d lock</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-400">
                        <Unlock className="w-3 h-3" />
                        <span>Liquid</span>
                      </div>
                    )}
                    {option.minStake !== '0' && (
                      <div className="text-gray-400">
                        Min: {option.minStake} {option.chainId === 'ethereum' ? 'ETH' : 'TRX'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Stake Form */}
            {selectedOption && (
              <div className="mt-4 p-4 bg-app-bg rounded-xl border border-gray-700">
                <h4 className="text-white font-medium mb-3">
                  Stake {selectedOption.chainId === 'ethereum' ? 'ETH' : 'TRX'}
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-card-bg border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {selectedOption.chainId === 'ethereum' ? 'ETH' : 'TRX'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Estimated Rewards */}
                  {stakeAmount && parseFloat(stakeAmount) > 0 && (
                    <div className="p-3 bg-card-bg rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Estimated yearly rewards</span>
                        <span className="text-green-400 font-medium">
                          +{(parseFloat(stakeAmount) * selectedOption.apy / 100).toFixed(4)} {selectedOption.chainId === 'ethereum' ? 'ETH' : 'TRX'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleStake}
                    disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
                    variant="primary"
                    className="w-full bg-accent hover:bg-accent/90 text-black font-semibold"
                  >
                    {isStaking ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Staking...
                      </span>
                    ) : (
                      `Stake ${selectedOption.chainId === 'ethereum' ? 'ETH' : 'TRX'}`
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Success/Error Messages */}
            {success && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 text-sm">{success}</span>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}
          </Card>

          {/* Active Positions */}
          <Card className="bg-card-bg border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Your Positions</h3>
            
            {positions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active positions</p>
                <p className="text-sm mt-1">Select a staking option above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className="p-3 bg-app-bg rounded-xl border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          position.chainId === 'ethereum' ? 'bg-eth' : 'bg-trx'
                        }`}>
                          <span className="text-white font-bold text-sm">
                            {position.chainId === 'ethereum' ? 'Ξ' : 'T'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-white text-sm capitalize">
                            {position.provider} Staking
                          </h4>
                          <p className="text-xs text-gray-400">
                            Since {formatDate(position.stakedAt)}
                          </p>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                        position.status === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : position.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {position.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-400">Staked</p>
                        <p className="text-white text-sm font-medium">
                          {position.stakedAmount}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(position.stakedAmountUsd || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Rewards</p>
                        <p className="text-green-400 text-sm font-medium">
                          +{position.rewardsEarned}
                        </p>
                        <p className="text-xs text-green-500/70">
                          +{formatCurrency(position.rewardsEarnedUsd || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">APY</p>
                        <p className="text-accent text-sm font-medium">{position.apy}%</p>
                      </div>
                    </div>
                    
                    {position.unlockAt && (
                      <div className="mt-2 pt-2 border-t border-gray-700 flex items-center gap-2 text-xs">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span className="text-gray-400">
                          Unlocks {formatDate(position.unlockAt)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Info Card */}
          <Card className="bg-card-bg border-gray-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-400">
                <p className="font-medium text-gray-300 mb-1">About Staking</p>
                <p className="text-xs">
                  Stake your crypto to earn rewards. Liquid staking lets you maintain liquidity through derivative tokens.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EarnScreen;
