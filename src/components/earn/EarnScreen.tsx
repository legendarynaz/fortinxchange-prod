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

  // Mock positions for demo
  useEffect(() => {
    const mockPositions: StakePosition[] = [
      {
        id: '1',
        chainId: 'ethereum',
        provider: 'lido',
        stakedAmount: '2.5',
        stakedAmountUsd: 8250,
        rewardsEarned: '0.095',
        rewardsEarnedUsd: 313.50,
        apy: 3.8,
        status: 'active',
        stakedAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      },
    ];
    setPositions(mockPositions);
  }, []);

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Earn</h1>
            <p className="text-xs text-slate-400">Stake & Earn Rewards</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-sky-900/50 to-slate-800 border-slate-700">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Total Staked</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(totalStakedUsd)}
                </p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-900/50 to-slate-800 border-slate-700">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Total Rewards</p>
                <p className="text-2xl font-bold text-green-400">
                  +{formatCurrency(totalRewardsUsd)}
                </p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-900/50 to-slate-800 border-slate-700">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Active Positions</p>
                <p className="text-2xl font-bold text-white">
                  {positions.filter(p => p.status === 'active').length}
                </p>
              </div>
            </Card>
          </div>

          {/* Staking Options */}
          <Card className="bg-slate-800/50 border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Staking Options</h3>
            
            <div className="space-y-4">
              {STAKE_OPTIONS.filter(o => o.enabled).map((option) => (
                <div
                  key={`${option.provider}-${option.chainId}`}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedOption?.provider === option.provider
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                  }`}
                  onClick={() => setSelectedOption(option)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        option.chainId === 'ethereum' ? 'bg-blue-600' : 'bg-red-600'
                      }`}>
                        <span className="text-white font-bold text-lg">
                          {option.chainId === 'ethereum' ? 'Ξ' : 'T'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{option.name}</h4>
                        <p className="text-sm text-slate-400">{option.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">{option.apy}%</p>
                      <p className="text-xs text-slate-400">APY</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    {option.lockPeriod ? (
                      <div className="flex items-center gap-1 text-amber-400">
                        <Lock className="w-4 h-4" />
                        <span>{Math.floor(option.lockPeriod / (24 * 60 * 60))} day lock</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-400">
                        <Unlock className="w-4 h-4" />
                        <span>Liquid (no lock)</span>
                      </div>
                    )}
                    {option.minStake !== '0' && (
                      <div className="text-slate-400">
                        Min: {option.minStake} {option.chainId === 'ethereum' ? 'ETH' : 'TRX'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Stake Form */}
            {selectedOption && (
              <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <h4 className="text-white font-medium mb-3">
                  Stake {selectedOption.chainId === 'ethereum' ? 'ETH' : 'TRX'}
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {selectedOption.chainId === 'ethereum' ? 'ETH' : 'TRX'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Estimated Rewards */}
                  {stakeAmount && parseFloat(stakeAmount) > 0 && (
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Estimated yearly rewards</span>
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
                    className="w-full"
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
                <span className="text-green-400">{success}</span>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            )}
          </Card>

          {/* Active Positions */}
          <Card className="bg-slate-800/50 border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Your Positions</h3>
            
            {positions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active positions</p>
                <p className="text-sm mt-1">Select a staking option above to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className="p-4 bg-slate-900/50 rounded-xl border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          position.chainId === 'ethereum' ? 'bg-blue-600' : 'bg-red-600'
                        }`}>
                          <span className="text-white font-bold">
                            {position.chainId === 'ethereum' ? 'Ξ' : 'T'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-white capitalize">
                            {position.provider} Staking
                          </h4>
                          <p className="text-xs text-slate-400">
                            Since {formatDate(position.stakedAt)}
                          </p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        position.status === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : position.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {position.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Staked</p>
                        <p className="text-white font-medium">
                          {position.stakedAmount} {position.chainId === 'ethereum' ? 'ETH' : 'TRX'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(position.stakedAmountUsd || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Rewards</p>
                        <p className="text-green-400 font-medium">
                          +{position.rewardsEarned} {position.chainId === 'ethereum' ? 'ETH' : 'TRX'}
                        </p>
                        <p className="text-xs text-green-500/70">
                          +{formatCurrency(position.rewardsEarnedUsd || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">APY</p>
                        <p className="text-white font-medium">{position.apy}%</p>
                      </div>
                    </div>
                    
                    {position.unlockAt && (
                      <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2 text-sm">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span className="text-slate-400">
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
          <Card className="bg-slate-800/50 border-slate-700">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-1">About Staking</p>
                <p>
                  Staking allows you to earn rewards by locking your crypto assets. 
                  Liquid staking (like Lido) lets you stake while maintaining liquidity through derivative tokens. 
                  Always understand the risks before staking.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 z-20 bg-slate-900/95 backdrop-blur border-t border-slate-800">
        <div className="max-w-md mx-auto flex justify-around py-3">
          {[
            { path: '/portfolio', label: 'Portfolio', icon: '📊' },
            { path: '/wallet', label: 'Wallet', icon: '💰' },
            { path: '/swap', label: 'Swap', icon: '🔄' },
            { path: '/earn', label: 'Earn', icon: '📈', active: true },
            { path: '/settings', label: 'Settings', icon: '⚙️' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-colors ${
                item.active
                  ? 'text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default EarnScreen;
