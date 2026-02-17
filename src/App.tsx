
import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import TradingView from './components/dashboard/TradingView';
import WalletView from './components/wallet/WalletView';
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

type View = 'trade' | 'wallet';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminView, setIsAdminView] = useState(window.location.pathname.startsWith('/admin'));
  const [appConfig, setAppConfig] = useState<AppConfig>(getAppConfig());
  const [transactions, setTransactions] = useState<Transaction[]>(getTransactions());

  // Mock user state
  const [user, setUser] = useState<User | null>(null);
  
  const [selectedMarket, setSelectedMarket] = useState<Market>(MARKETS[0]);
  const [currentView, setCurrentView] = useState<View>('trade');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [isKycRequired, setIsKycRequired] = useState(false);
  const [isRegionLocked, setIsRegionLocked] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminView(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const refreshConfig = () => {
    setAppConfig(getAppConfig());
  };

  const handleLogin = (loggedInUser: User) => {
    const config = getAppConfig(); // Get latest config on login
    
    // Geo-restriction check
    if (config.allowedCountries[0] !== 'GLOBAL' && !config.allowedCountries.includes(loggedInUser.country)) {
        setIsRegionLocked(true);
    } else {
        setIsAuthenticated(true);
        setUser(loggedInUser);
        setCurrentView('trade');
        setIsRegionLocked(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsKycRequired(false);
    setIsRegionLocked(false);
    setUser(null);
    setIsChatOpen(false);
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
  

  const handleNavigate = (view: View) => setCurrentView(view);
  const handleToggleChat = () => setIsChatOpen(prev => !prev);
  const handleRequireKyc = () => setIsKycRequired(true);
  const handleKycComplete = () => { setIsKycVerified(true); setIsKycRequired(false); };
  
  // Render Admin View
  if (isAdminView) {
      return <AdminView onConfigChange={refreshConfig} />;
  }

  // Render User-facing App
  if (appConfig.maintenanceMode) {
      return <MaintenanceView />;
  }
  
  if (!isAuthenticated) {
    return <AuthView onLoginSuccess={handleLogin} />;
  }
  
  if (isRegionLocked) {
      return <RegionLockView onLogout={handleLogout} />;
  }
  
  if (isKycRequired) {
    return <KYCView onVerificationComplete={handleKycComplete} />;
  }

  return (
    <div className="flex flex-col h-screen antialiased bg-sky-50">
      <Header 
        selectedMarket={selectedMarket} 
        onMarketChange={setSelectedMarket}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        currentView={currentView}
        isKycVerified={isKycVerified}
      />
      {currentView === 'trade' && <TradingView market={selectedMarket} appConfig={appConfig} />}
      {currentView === 'wallet' && (
        <WalletView 
            isKycVerified={isKycVerified} 
            onRequireKyc={handleRequireKyc}
            appConfig={appConfig}
            user={user!}
            onAddTransaction={handleAddTransaction}
        />
      )}
      
      <div className="fixed bottom-6 right-6 z-50">
          {!isChatOpen && (
             <button
              onClick={handleToggleChat}
              className="bg-sky-600 hover:bg-sky-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              aria-label={"Open Chat"}
            >
              <ChatBubbleIcon className="w-6 h-6" />
            </button>
          )}
      </div>
       {isChatOpen && <Chatbot onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

export default App;
