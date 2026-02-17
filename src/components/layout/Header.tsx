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

type View = 'trade' | 'wallet' | 'history' | 'settings' | 'referral' | 'portfolio';

interface HeaderProps {
  selectedMarket: Market;
  onMarketChange: (market: Market) => void;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  currentView: View;
  isKycVerified: boolean;
  userEmail?: string;
}

const NAV_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: 'trade', label: 'Trade', icon: '📈' },
  { id: 'portfolio', label: 'Portfolio', icon: '💼' },
  { id: 'wallet', label: 'Wallet', icon: '👛' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'referral', label: 'Referral', icon: '🎁' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const Header: React.FC<HeaderProps> = ({ selectedMarket, onMarketChange, onNavigate, onLogout, currentView, isKycVerified, userEmail }) => {
  const displayEmail = userEmail || 'user@email.com';
  const userInitial = displayEmail.charAt(0).toUpperCase();
  const [isMarketOpen, setMarketOpen] = useState(false);
  const [isUserOpen, setUserOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const handleMobileNav = (view: View) => {
    onNavigate(view);
    setMobileMenuOpen(false);
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
    <>
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 h-16 flex items-center px-4 md:px-6 sticky top-0 z-40">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 -ml-2 mr-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <LogoIcon />
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tighter">FortinXchange</h1>
        </div>
        
        {currentView === 'trade' && (
          <div className="ml-2 sm:ml-6 border-l border-slate-200 dark:border-slate-700 pl-2 sm:pl-6">
            <div className="relative" ref={marketDropdownRef}>
              <button 
                onClick={() => setMarketOpen(!isMarketOpen)}
                className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="font-mono text-slate-900 dark:text-white font-bold text-sm sm:text-lg">{selectedMarket.name}</span>
                <ChevronDownIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-500 transition-transform ${isMarketOpen ? 'rotate-180' : ''}`} />
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

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          <NavButton onClick={() => onNavigate('trade')} isActive={currentView === 'trade'}>Trade</NavButton>
          <NavButton onClick={() => onNavigate('portfolio')} isActive={currentView === 'portfolio'}>Portfolio</NavButton>
          <NavButton onClick={() => onNavigate('wallet')} isActive={currentView === 'wallet'}>Wallet</NavButton>
          <NavButton onClick={() => onNavigate('history')} isActive={currentView === 'history'}>History</NavButton>
          <NavButton onClick={() => onNavigate('referral')} isActive={currentView === 'referral'}>Referral</NavButton>
          <NavButton onClick={() => onNavigate('settings')} isActive={currentView === 'settings'}>Settings</NavButton>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 ml-2 sm:ml-6">
          <div className="hidden sm:block">
            <CurrencySelector />
          </div>
          
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
                  {userInitial}
              </button>
              {isUserOpen && (
                   <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{displayEmail}</p>
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

      {/* Mobile Side Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Side Menu */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Menu Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <LogoIcon />
            <span className="font-bold text-slate-900 dark:text-white">FortinXchange</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-sky-200 dark:bg-sky-700 flex items-center justify-center text-sky-700 dark:text-sky-200 font-bold">
              {userInitial}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{displayEmail}</p>
              {isKycVerified ? (
                <div className="flex items-center text-xs text-green-600 font-semibold">
                  <CheckCircleIcon className="w-3 h-3 mr-1"/>
                  Verified
                </div>
              ) : (
                <p className="text-xs text-yellow-600 font-semibold">Unverified</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleMobileNav(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === item.id
                  ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Currency Selector for Mobile */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Currency</p>
          <CurrencySelector />
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { onLogout(); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;