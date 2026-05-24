// 4ortin-X Main App
// Self-custody wallet with router-based navigation

import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import CryptoBackground from './components/ui/CryptoBackground';
import SettingsView from './components/settings/SettingsView';
import Chatbot from './components/chatbot/Chatbot';
import AdminView from './components/admin/AdminView';
import MaintenanceView from './components/views/MaintenanceView';
import type { AppConfig, Transaction } from './types';
import ChatBubbleIcon from './components/icons/ChatBubbleIcon';
import { getAppConfig, getTransactions, saveTransactions } from './services/configService';
import { initWalletService } from './services/walletService';
import { WalletProvider, useWallet } from './context/WalletContext';

// Mobile-first navigation + screens
import TopBar from './components/navigation/TopBar';
import BottomNav from './components/navigation/BottomNav';
import WalletHome from './components/wallet/WalletHome';
import SwapScreen from './components/swap/SwapScreen';
import DiscoverScreen from './components/discover/DiscoverScreen';
import ReceiveScreen from './components/receive/ReceiveScreen';
import SendScreen from './components/send/SendScreen';
import EarnScreen from './components/earn/EarnScreen';
import PriceAlertsScreen from './components/alerts/PriceAlertsScreen';
// Future upgrade: Buy/Withdraw crypto with fiat
// import BuyCryptoScreen from './components/buy/BuyCryptoScreen';

// Onboarding components
import WelcomeScreen from './components/onboarding/WelcomeScreen';
import CreateWalletFlow from './components/onboarding/CreateWalletFlow';
import ImportWalletFlow from './components/onboarding/ImportWalletFlow';
import UnlockScreen from './components/onboarding/UnlockScreen';

// Legal pages
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsOfService from './components/legal/TermsOfService';
import Footer from './components/common/Footer';

// (optional) lazy modules can be added here later

type View = 'wallet' | 'swap' | 'discover' | 'settings' | 'send' | 'receive' | 'earn' | 'alerts';
type OnboardingView = 'welcome' | 'create' | 'import';

// Loading fallback
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-app-bg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto mb-4" />
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

// Main authenticated app content
const AppContent: React.FC<{
  appConfig: AppConfig;
  transactions: Transaction[];
  onLock: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'status'>) => void;
}> = ({ appConfig, transactions, onLock: _onLock, onAddTransaction }) => {
  // keep references to avoid TS noUnusedParameters errors
  void appConfig; void transactions; void onAddTransaction;
  const navigate = useNavigate();
  const location = useLocation();
  const { activeAccount } = useWallet();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const pathToView: Record<string, View> = {
    '/': 'wallet',
    '/wallet': 'wallet',
    '/swap': 'swap',
    '/discover': 'discover',
    '/settings': 'settings',
    '/send': 'send',
    '/receive': 'receive',
    '/earn': 'earn',
    '/alerts': 'alerts',
  };
  const currentView: View = pathToView[location.pathname] || 'wallet';

  const handleNavigate = (view: View | string) => {
    const viewToPath: Record<string, string> = {
      wallet: '/wallet',
      swap: '/swap',
      discover: '/discover',
      settings: '/settings',
      send: '/send',
      receive: '/receive',
      earn: '/earn',
      alerts: '/alerts',
    };
    const path = viewToPath[view] || '/wallet';
    navigate(path);
  };

  // Listen for custom navigation events from child components
  useEffect(() => {
    const handleCustomNavigate = (event: CustomEvent<{ view: string; scannedAddress?: string; addressType?: string }>) => {
      const { view, scannedAddress, addressType } = event.detail;
      if (scannedAddress) {
        // Navigate to send with pre-filled address
        navigate('/send', { state: { scannedAddress, addressType } });
      } else {
        handleNavigate(view);
      }
    };

    window.addEventListener('navigate', handleCustomNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate', handleCustomNavigate as EventListener);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen text-white bg-app-bg">
      <CryptoBackground />
      <TopBar />

      <div className="flex-1 overflow-auto">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/wallet" replace />} />
            <Route path="/wallet" element={<WalletHome onSend={() => handleNavigate('send')} onReceive={() => handleNavigate('receive')} />} />
            <Route path="/swap" element={<SwapScreen />} />
            <Route path="/discover" element={<DiscoverScreen />} />
            <Route path="/settings" element={<SettingsView walletAddress={activeAccount?.address || ''} />} />
            <Route path="/receive" element={<ReceiveScreen onBack={() => handleNavigate('wallet')} />} />
            <Route path="/send" element={<SendScreen onBack={() => handleNavigate('wallet')} />} />
            <Route path="/earn" element={<EarnScreen />} />
            <Route path="/alerts" element={<PriceAlertsScreen />} />
            {/* Future upgrade: Buy/Withdraw crypto with fiat */}
            {/* <Route path="/buy" element={<BuyCryptoScreen onBack={() => handleNavigate('wallet')} />} />*/}
            <Route path="*" element={<Navigate to="/wallet" replace />} />
          </Routes>
        </Suspense>
        
        <Footer
          className="pb-20"
          showVersion={location.pathname === '/settings' || location.pathname.startsWith('/settings/')}
        />
      </div>

      <BottomNav
        activeTab={currentView === 'send' || currentView === 'receive' ? 'wallet' : (currentView as any)}
        onTabChange={(tab) => handleNavigate(tab as View)}
      />

      {/* Support Chat Button */}
      <div className="fixed bottom-20 right-4 z-50">
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 focus:outline-none bg-accent hover:bg-accent/90"
            aria-label="Open Support Chat"
          >
            <ChatBubbleIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      {isChatOpen && <Chatbot onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

// Wallet-based app with onboarding flow
const WalletApp: React.FC = () => {
  const { isInitialized, hasExistingWallet, isLocked, lock } = useWallet();
  const [appConfig, setAppConfig] = useState<AppConfig>(getAppConfig());
  const [transactions, setTransactions] = useState<Transaction[]>(getTransactions());
  const [onboardingView, setOnboardingView] = useState<OnboardingView>('welcome');

  const refreshConfig = () => {
    setAppConfig(getAppConfig());
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

  const handleLock = () => {
    lock();
  };

  const handleWalletCreated = () => {
    setOnboardingView('welcome');
  };

  const handleReset = () => {
    setOnboardingView('welcome');
  };

  // Show loading while wallet context initializes
  if (!isInitialized) {
    return <LoadingFallback />;
  }

  // Maintenance mode check
  if (appConfig.maintenanceMode) {
    return <MaintenanceView />;
  }

  // No wallet exists - show onboarding
  if (!hasExistingWallet) {
    if (onboardingView === 'create') {
      return (
        <div className="min-h-screen bg-[#0D1117] flex flex-col">
          <div className="flex-1">
            <CreateWalletFlow 
              onBack={() => setOnboardingView('welcome')} 
              onComplete={handleWalletCreated}
            />
          </div>
          <Footer />
        </div>
      );
    }
    if (onboardingView === 'import') {
      return (
        <div className="min-h-screen bg-[#0D1117] flex flex-col">
          <div className="flex-1">
            <ImportWalletFlow 
              onBack={() => setOnboardingView('welcome')} 
              onComplete={handleWalletCreated}
            />
          </div>
          <Footer />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col">
        <div className="flex-1">
          <WelcomeScreen 
            onCreateWallet={() => setOnboardingView('create')}
            onImportWallet={() => setOnboardingView('import')}
          />
        </div>
        <Footer />
      </div>
    );
  }

  // Wallet exists but is locked - show unlock screen
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col">
        <div className="flex-1">
          <UnlockScreen 
            onUnlock={() => {}} 
            onReset={handleReset}
          />
        </div>
        <Footer />
      </div>
    );
  }

  // Wallet is unlocked - show main app
  return (
    <Routes>
      {/* Admin routes */}
      <Route path="/admin/*" element={<AdminView onConfigChange={refreshConfig} />} />
      
      {/* Main app routes */}
      <Route path="/*" element={
        <AppContent
          appConfig={appConfig}
          transactions={transactions}
          onLock={handleLock}
          onAddTransaction={handleAddTransaction}
        />
      } />
    </Routes>
  );
};

// Root App component with providers
const App: React.FC = () => {
  useEffect(() => {
    // Initialize wallet service (migrations, etc.)
    initWalletService();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public legal pages - accessible without authentication */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        
        {/* All other routes go through WalletProvider */}
        <Route path="/*" element={
          <WalletProvider>
            <WalletApp />
          </WalletProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
