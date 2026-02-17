
import React, { useState, useRef, useEffect } from 'react';
import type { Market } from '../../types';
import { MARKETS } from '../../constants';
import LogoIcon from '../icons/LogoIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import SunIcon from '../icons/SunIcon';
import MoonIcon from '../icons/MoonIcon';
import { useTheme } from '../../context/ThemeContext';
import CurrencySelector from '../ui/CurrencySelector';


interface HeaderProps {
  selectedMarket: Market;
  onMarketChange: (market: Market) => void;
  onNavigate: (view: 'trade' | 'wallet' | 'history' | 'settings' | 'referral') => void;
  onLogout: () => void;
  currentView: 'trade' | 'wallet' | 'history' | 'settings' | 'referral';
  isKycVerified: boolean;
}

const Header: React.FC<HeaderProps> = ({ selectedMarket, onMarketChange, onNavigate, onLogout, currentView, isKycVerified }) => {
  const [isMarketOpen, setMarketOpen] = useState(false);
  const [isUserOpen, setUserOpen] = useState(false);
  const marketDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (marketDropdownRef.current && !marketDropdownRef.current.contains(event.target as Node)) {
        setMarketOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMarket = (market: Market) => {
    onMarketChange(market);
    setMarketOpen(false);
  };

  const NavButton: React.FC<{
      onClick: () => void;
      isActive: boolean;
      children: React.ReactNode;
  }> = ({ onClick, isActive, children }) => (
      <button 
          onClick={onClick} 
          className={`text-sm font-medium transition-colors ${
              isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
      >
          {children}
      </button>
  );

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 h-16 flex items-center px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <LogoIcon />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">FortinXchange</h1>
      </div>
      
      {currentView === 'trade' && (
        <div className="ml-6 border-l border-slate-200 dark:border-slate-700 pl-6">
          <div className="relative" ref={marketDropdownRef}>
            <button 
              onClick={() => setMarketOpen(!isMarketOpen)}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="font-mono text-slate-900 dark:text-white font-bold text-lg">{selectedMarket.name}</span>
              <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${isMarketOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMarketOpen && (
              <div className="absolute top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg py-1 z-50">
                {MARKETS.map(market => (
                  <button
                    key={market.id}
                    onClick={() => handleSelectMarket(market)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-100 dark:hover:bg-slate-700"
                  >
                    {market.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-grow"></div>

      <div className="flex items-center space-x-6">
        <NavButton onClick={() => onNavigate('trade')} isActive={currentView === 'trade'}>Trade</NavButton>
        <NavButton onClick={() => onNavigate('wallet')} isActive={currentView === 'wallet'}>Wallet</NavButton>
        <NavButton onClick={() => onNavigate('history')} isActive={currentView === 'history'}>History</NavButton>
        <NavButton onClick={() => onNavigate('referral')} isActive={currentView === 'referral'}>Referral</NavButton>
        <NavButton onClick={() => onNavigate('settings')} isActive={currentView === 'settings'}>Settings</NavButton>
        
        <CurrencySelector />
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <MoonIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          ) : (
            <SunIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          )}
        </button>
        
        <div className="relative" ref={userDropdownRef}>
            <button onClick={() => setUserOpen(!isUserOpen)} className="w-8 h-8 rounded-full bg-sky-200 dark:bg-sky-700 flex items-center justify-center text-sky-700 dark:text-sky-200 font-bold hover:bg-sky-300 dark:hover:bg-sky-600">
                U
            </button>
            {isUserOpen && (
                 <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">user@email.com</p>
                        {isKycVerified ? (
                           <div className="flex items-center text-xs text-green-600 font-semibold">
                               <CheckCircleIcon className="w-4 h-4 mr-1"/>
                               Verified
                           </div>
                        ) : (
                           <p className="text-xs text-yellow-600 font-semibold">Unverified</p>
                        )}
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        Logout
                    </button>
                 </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;