// 4ortin-X Auth Context
// Manages authentication state across the app

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { initWalletService } from '../services/walletService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isKycVerified: boolean;
  setKycVerified: (verified: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isKycVerified, setIsKycVerified] = useState(false);

  // Initialize and check auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize wallet service (migrations, etc.)
        initWalletService();
        
        // Check for existing session
        const storedUser = localStorage.getItem('x4ortinx_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser) as User;
            setUser(parsedUser);
            setIsAuthenticated(true);
            
            // Check KYC status
            const kycStatus = localStorage.getItem('x4ortinx_kyc_verified');
            setIsKycVerified(kycStatus === 'true');
          } catch {
            // Invalid stored user, clear it
            localStorage.removeItem('x4ortinx_user');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    localStorage.setItem('x4ortinx_user', JSON.stringify(loggedInUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setIsKycVerified(false);
    localStorage.removeItem('x4ortinx_user');
    localStorage.removeItem('x4ortinx_kyc_verified');
  }, []);

  const handleSetKycVerified = useCallback((verified: boolean) => {
    setIsKycVerified(verified);
    localStorage.setItem('x4ortinx_kyc_verified', String(verified));
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    isKycVerified,
    setKycVerified: handleSetKycVerified,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
