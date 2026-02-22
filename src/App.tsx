// 4ortin-X Main App
// Router-based navigation with backward compatibility

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import TradingView from './components/dashboard/TradingView';
import CryptoBackground from './components/ui/CryptoBackground';
import WalletView from './components/wallet/WalletView';
import TransactionHistory from './components/history/TransactionHistory';
import SettingsView from './components/settings/SettingsView';
import ReferralSystem from './components/referral/ReferralSystem';
import PortfolioDashboard from './components/portfolio/PortfolioDashboard';
import AuthView from './components/auth/AuthView';
import Chatbot from './components/chatbot/Chatbot';
import KYCView from './components/kyc/KYCView';
import AdminView from './components/admin/AdminView';
import MaintenanceView from './components/views/MaintenanceView';
import RegionLockView from './components/views/RegionLockView';
import type { Market, AppConfig, Transaction, User } from './types';
import { MARKETS } from './constants';
import ChatBubbleIcon from './components/icons/ChatBubbleIcon';
import { getAppConfig, getTransactions, saveTransactions } from './services/configService';
import { initWalletService } from './services/walletService';

// Lazy load new components
const EarnScreen = lazy(() => import('./components/earn/EarnScreen'));

type View = 'trade' | 'wallet' | 'history' | 'settings' | 'referral' | 'portfolio';

// Loading fallback
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mx-auto mb-4" />
      <p className="text-slate-400">Loading...</p>
    </div>
  </div>
);

// Main authenticated app content
const AppContent: React.FC<{
  user: User;
  appConfig: AppConfig;
  isKycVerified: boolean;
  transactions: Transaction[];
  onLogout: () => void;
  onRequireKyc: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'status'>) => void;
}> = ({ user, appConfig, isKycVerified, transactions, onLogout, onRequireKyc, onAddTransaction }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMarket, setSelectedMarket] = useState<Market>(MARKETS[0]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Map path to view for Header
  const pathToView: Record<string, View> = {
    '/': 'portfolio',
    '/portfolio': 'portfolio',
    '/trade': 'trade',
    '/wallet': 'wallet',
    '/history': 'history',
    '/settings': 'settings',
    '/referral': 'referral',
    '/swap': 'wallet',
    '/earn': 'portfolio',
  };
  const currentView = pathToView[location.pathname] || 'portfolio';

  const handleNavigate = (view: View) => {
    const viewToPath: Record<View, string> = {
      portfolio: '/portfolio',
      trade: '/trade',
      wallet: '/wallet',
      history: '/history',
      settings: '/settings',
      referral: '/referral',
    };
    navigate(viewToPath[view]);
  };

  return (
    <div className="flex flex-col h-screen antialiased bg-sky-50 dark:bg-transparent relative">
      <CryptoBackground />
      <Header 
        selectedMarket={selectedMarket} 
        onMarketChange={setSelectedMarket}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        currentView={currentView}
        isKycVerified={isKycVerified}
        userEmail={user?.email}
      />
      
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Portfolio/Home */}
          <Route path="/" element={<Navigate to="/portfolio" replace />} />
          <Route path="/portfolio" element={
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Portfolio Dashboard</h1>
                <PortfolioDashboard />
              </div>
            </main>
          } />
          
          {/* Trade */}
          <Route path="/trade" element={<TradingView market={selectedMarket} appConfig={appConfig} />} />
          
          {/* Wallet */}
          <Route path="/wallet" element={
            <WalletView 
              isKycVerified={isKycVerified} 
              onRequireKyc={onRequireKyc}
              appConfig={appConfig}
              user={user}
              onAddTransaction={onAddTransaction}
            />
          } />
          
          {/* Swap - Redirect to wallet for now */}
          <Route path="/swap" element={<Navigate to="/wallet" replace />} />
          
          {/* Earn */}
          <Route path="/earn" element={<EarnScreen />} />
          
          {/* History */}
          <Route path="/history" element={
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Transaction History</h1>
                <TransactionHistory transactions={transactions} />
              </div>
            </main>
          } />
          
          {/* Settings */}
          <Route path="/settings" element={<SettingsView userEmail={user?.email || ''} />} />
          
          {/* Referral */}
          <Route path="/referral" element={
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Referral Program</h1>
                <ReferralSystem />
              </div>
            </main>
          } />
          
          {/* Catch all - redirect to portfolio */}
          <Route path="*" element={<Navigate to="/portfolio" replace />} />
        </Routes>
      </Suspense>
      
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:ring-offset-slate-900"
            aria-label="Open Chat"
          >
            <ChatBubbleIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      {isChatOpen && <Chatbot onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig>(getAppConfig());
  const [transactions, setTransactions] = useState<Transaction[]>(getTransactions());
  const [user, setUser] = useState<User | null>(null);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [isKycRequired, setIsKycRequired] = useState(false);
  const [isRegionLocked, setIsRegionLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize services and check for stored session
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize wallet service (migrations, etc.)
        initWalletService();
        
        // Check for stored user session
        const storedUser = localStorage.getItem('x4ortinx_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser) as User;
            setUser(parsedUser);
            setIsAuthenticated(true);
            
            const kycStatus = localStorage.getItem('x4ortinx_kyc_verified');
            setIsKycVerified(kycStatus === 'true');
          } catch {
            localStorage.removeItem('x4ortinx_user');
          }
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const refreshConfig = () => {
    setAppConfig(getAppConfig());
  };

  const handleLogin = (loggedInUser: User) => {
    const config = getAppConfig();
    
    if (config.allowedCountries[0] !== 'GLOBAL' && !config.allowedCountries.includes(loggedInUser.country)) {
      setIsRegionLocked(true);
    } else {
      setIsAuthenticated(true);
      setUser(loggedInUser);
      setIsRegionLocked(false);
      localStorage.setItem('x4ortinx_user', JSON.stringify(loggedInUser));
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsKycRequired(false);
    setIsRegionLocked(false);
    setUser(null);
    localStorage.removeItem('x4ortinx_user');
    localStorage.removeItem('x4ortinx_kyc_verified');
  };
  
  const handleAddTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp' | 'status'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
  };

  const handleRequireKyc = () => setIsKycRequired(true);
  
  const handleKycComplete = () => {
    setIsKycVerified(true);
    setIsKycRequired(false);
    localStorage.setItem('x4ortinx_kyc_verified', 'true');
  };

  // Loading state
  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes */}
        <Route path="/admin/*" element={<AdminView onConfigChange={refreshConfig} />} />
        
        {/* Main app routes */}
        <Route path="/*" element={
          // Maintenance mode
          appConfig.maintenanceMode ? (
            <MaintenanceView />
          ) : !isAuthenticated ? (
            <AuthView onLoginSuccess={handleLogin} />
          ) : isRegionLocked ? (
            <RegionLockView onLogout={handleLogout} />
          ) : isKycRequired ? (
            <KYCView onVerificationComplete={handleKycComplete} />
          ) : (
            <AppContent
              user={user!}
              appConfig={appConfig}
              isKycVerified={isKycVerified}
              transactions={transactions}
              onLogout={handleLogout}
              onRequireKyc={handleRequireKyc}
              onAddTransaction={handleAddTransaction}
            />
          )
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
