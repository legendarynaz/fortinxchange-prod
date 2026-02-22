// 4ortin-X App Router
// Router-based navigation for the multi-chain wallet

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Lazy load views for code splitting
const AuthView = lazy(() => import('../components/auth/AuthView'));
const PortfolioHome = lazy(() => import('../components/portfolio/PortfolioHome'));
const WalletView = lazy(() => import('../components/wallet/WalletView'));
const SwapScreen = lazy(() => import('../components/swap/SwapScreen'));
const EarnScreen = lazy(() => import('../components/earn/EarnScreen'));
const SettingsView = lazy(() => import('../components/settings/SettingsView'));
const TransactionHistory = lazy(() => import('../components/history/TransactionHistory'));
const AdminView = lazy(() => import('../components/admin/AdminView'));
const MaintenanceView = lazy(() => import('../components/views/MaintenanceView'));
const RegionLockView = lazy(() => import('../components/views/RegionLockView'));

// Loading fallback
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mx-auto mb-4" />
      <p className="text-slate-400">Loading...</p>
    </div>
  </div>
);

// Protected route wrapper
interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return children ? <>{children}</> : <Outlet />;
};

// Public route (redirect if authenticated)
const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/portfolio" replace />;
  }
  
  return children ? <>{children}</> : <Outlet />;
};

// Main app layout wrapper
const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
};

// Router component
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/auth" element={<AuthView onLoginSuccess={() => {}} />} />
          </Route>
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/portfolio" element={<PortfolioHome />} />
              <Route path="/wallet" element={<WalletView isKycVerified={false} onRequireKyc={() => {}} appConfig={{} as any} user={{} as any} onAddTransaction={() => {}} />} />
              <Route path="/swap" element={<SwapScreen />} />
              <Route path="/earn" element={<EarnScreen />} />
              <Route path="/history" element={<TransactionHistory transactions={[]} />} />
              <Route path="/settings" element={<SettingsView userEmail="" />} />
            </Route>
          </Route>
          
          {/* Admin route */}
          <Route path="/admin/*" element={<AdminView onConfigChange={() => {}} />} />
          
          {/* Utility routes */}
          <Route path="/maintenance" element={<MaintenanceView />} />
          <Route path="/region-locked" element={<RegionLockView onLogout={() => {}} />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/portfolio" replace />} />
          <Route path="*" element={<Navigate to="/portfolio" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
