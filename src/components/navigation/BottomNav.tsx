import React from 'react';
import { Wallet, ArrowLeftRight, Coins, Compass, Settings } from 'lucide-react';

export type TabType = 'wallet' | 'earn' | 'swap' | 'discover' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'earn', label: 'Earn', icon: Coins },
  { id: 'swap', label: 'Swap', icon: ArrowLeftRight },
  { id: 'discover', label: 'Browser', icon: Compass },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-black/30 border-t border-white/10 safe-area-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 rounded-xl mx-0.5 ${
                isActive 
                  ? 'text-[#F0B90B]' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {/* Glow effect for active tab */}
              {isActive && (
                <div className="absolute inset-0 bg-[#F0B90B]/10 rounded-xl blur-sm" />
              )}
              
              <div className="relative">
                {isActive && (
                  <div className="absolute inset-0 bg-[#F0B90B]/40 blur-md rounded-full" />
                )}
                <Icon className={`relative w-6 h-6 transition-all duration-300 ${isActive ? 'scale-110' : ''}`} />
              </div>
              
              <span className={`relative text-xs mt-1 font-medium transition-all duration-300`}>
                {tab.label}
              </span>
              
              {/* Bottom indicator */}
              {isActive && (
                <div className="absolute bottom-1 w-8 h-1 bg-gradient-to-r from-[#F0B90B]/50 via-[#F0B90B] to-[#F0B90B]/50 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
