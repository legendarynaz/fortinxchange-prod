import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import {
  hasWallet,
  loadWallet,
  createWallet,
  unlockWallet,
  lockWallet,
  isWalletLocked,
  getActiveAccount,
  setActiveAccount,
  generateMnemonic,
  markWalletBackedUp,
  deleteWallet,
  type WalletAccount,
  type StoredWallet,
} from '../services/walletService';
import { DEFAULT_CHAIN_ID, CHAINS, type ChainConfig } from '../config/chains';
import {
  deriveBitcoinAddress,
  getBitcoinBalance,
  getBitcoinPrice,
  type BitcoinBalance,
} from '../services/bitcoinService';
import {
  deriveTronAddress,
  getTronBalance,
  getTronPrice,
  type TronBalance,
} from '../services/tronService';
import {
  deriveAllAddresses,
  getMultiChainPrices,
  type MultiChainAddress,
} from '../services/multiChainService';

interface WalletContextType {
  // Wallet state
  isInitialized: boolean;
  hasExistingWallet: boolean;
  isLocked: boolean;
  wallet: StoredWallet | null;
  activeAccount: WalletAccount | null;
  mnemonic: string | null; // Only available when unlocked
  
  // Chain state
  chainId: number;
  chain: ChainConfig;
  provider: ethers.JsonRpcProvider | null;
  
  // Bitcoin state
  bitcoinAddress: string | null;
  bitcoinBalance: BitcoinBalance | null;
  bitcoinPrice: number;
  refreshBitcoinBalance: () => Promise<void>;
  
  // Tron state
  tronAddress: string | null;
  tronBalance: TronBalance | null;
  tronPrice: number;
  refreshTronBalance: () => Promise<void>;
  
  // Multi-chain state
  multiChainAddresses: MultiChainAddress[];
  multiChainPrices: Record<string, number>;
  refreshMultiChainPrices: () => Promise<void>;
  
  // Actions
  initializeWallet: (mnemonic: string, password: string, name?: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  switchAccount: (index: number) => void;
  switchChain: (chainId: number) => void;
  setBackedUp: () => void;
  resetWallet: () => void;
  generateNewMnemonic: (wordCount?: 12 | 24) => string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasExistingWallet, setHasExistingWallet] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [wallet, setWallet] = useState<StoredWallet | null>(null);
  const [activeAccount, setActiveAccountState] = useState<WalletAccount | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [chainId, setChainId] = useState(DEFAULT_CHAIN_ID);
  
  // Bitcoin state
  const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);
  const [bitcoinBalance, setBitcoinBalance] = useState<BitcoinBalance | null>(null);
  const [bitcoinPrice, setBitcoinPrice] = useState<number>(0);
  
  // Tron state
  const [tronAddress, setTronAddress] = useState<string | null>(null);
  const [tronBalance, setTronBalance] = useState<TronBalance | null>(null);
  const [tronPrice, setTronPrice] = useState<number>(0);
  
  // Multi-chain state
  const [multiChainAddresses, setMultiChainAddresses] = useState<MultiChainAddress[]>([]);
  const [multiChainPrices, setMultiChainPrices] = useState<Record<string, number>>({});

  // Initialize on mount
  useEffect(() => {
    const init = () => {
      const exists = hasWallet();
      setHasExistingWallet(exists);
      
      if (exists) {
        const storedWallet = loadWallet();
        setWallet(storedWallet);
        setActiveAccountState(getActiveAccount());
        setIsLocked(isWalletLocked());
      }
      
      // Load saved chain preference
      const savedChainId = localStorage.getItem('4ortinx_chainId');
      if (savedChainId && CHAINS[parseInt(savedChainId)]) {
        setChainId(parseInt(savedChainId));
      }
      
      setIsInitialized(true);
    };
    
    init();
  }, []);

  // Derive Bitcoin address when mnemonic is available (only when unlocked) - INSTANT
  useEffect(() => {
    if (mnemonic) {
      try {
        const { address } = deriveBitcoinAddress(mnemonic, 0);
        setBitcoinAddress(address);
      } catch (error) {
        console.error('[WalletContext] Failed to derive Bitcoin address:', error);
        setBitcoinAddress(null);
      }
    } else {
      // Clear Bitcoin address when wallet is locked
      setBitcoinAddress(null);
      setBitcoinBalance(null);
    }
  }, [mnemonic]);

  // Derive Tron address when mnemonic is available (only when unlocked) - INSTANT
  useEffect(() => {
    if (mnemonic) {
      try {
        const { address } = deriveTronAddress(mnemonic, 0);
        setTronAddress(address);
      } catch (error) {
        console.error('[WalletContext] Failed to derive Tron address:', error);
        setTronAddress(null);
      }
    } else {
      // Clear Tron address when wallet is locked
      setTronAddress(null);
      setTronBalance(null);
    }
  }, [mnemonic]);

  // Derive all multi-chain addresses when mnemonic is available
  useEffect(() => {
    if (mnemonic) {
      try {
        const addresses = deriveAllAddresses(mnemonic, 0);
        setMultiChainAddresses(addresses);
      } catch (error) {
        console.error('[WalletContext] Failed to derive multi-chain addresses:', error);
        setMultiChainAddresses([]);
      }
    } else {
      setMultiChainAddresses([]);
    }
  }, [mnemonic]);

  const refreshBitcoinBalance = useCallback(async () => {
    if (bitcoinAddress) {
      try {
        const balance = await getBitcoinBalance(bitcoinAddress);
        setBitcoinBalance(balance);
      } catch (error) {
        console.error('Failed to fetch Bitcoin balance:', error);
      }
    }
  }, [bitcoinAddress]);

  // Fetch Bitcoin balance when address is available
  useEffect(() => {
    if (bitcoinAddress) {
      refreshBitcoinBalance();
      const interval = setInterval(refreshBitcoinBalance, 60000);
      return () => clearInterval(interval);
    }
  }, [bitcoinAddress, refreshBitcoinBalance]);

  // Fetch Bitcoin price on mount and periodically
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await getBitcoinPrice();
        setBitcoinPrice(price);
      } catch (error) {
        console.error('Failed to fetch Bitcoin price:', error);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 300000);
    return () => clearInterval(interval);
  }, []);

  // Tron balance refresh
  const refreshTronBalance = useCallback(async () => {
    if (tronAddress) {
      try {
        const balance = await getTronBalance(tronAddress);
        setTronBalance(balance);
      } catch (error) {
        console.error('Failed to fetch Tron balance:', error);
      }
    }
  }, [tronAddress]);

  // Fetch Tron balance when address is available
  useEffect(() => {
    if (tronAddress) {
      refreshTronBalance();
      const interval = setInterval(refreshTronBalance, 60000);
      return () => clearInterval(interval);
    }
  }, [tronAddress, refreshTronBalance]);

  // Fetch Tron price on mount and periodically
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await getTronPrice();
        setTronPrice(price);
      } catch (error) {
        console.error('Failed to fetch Tron price:', error);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 300000);
    return () => clearInterval(interval);
  }, []);

  // Refresh multi-chain prices
  const refreshMultiChainPrices = useCallback(async () => {
    try {
      const symbols = ['SOL', 'XRP', 'LTC', 'DOGE', 'DASH', 'FIL', 'ATOM', 'BCH', 'ADA'];
      const prices = await getMultiChainPrices(symbols);
      setMultiChainPrices(prices);
    } catch (error) {
      console.error('Failed to fetch multi-chain prices:', error);
    }
  }, []);

  // Fetch multi-chain prices on mount and periodically
  useEffect(() => {
    refreshMultiChainPrices();
    const interval = setInterval(refreshMultiChainPrices, 300000);
    return () => clearInterval(interval);
  }, [refreshMultiChainPrices]);

  const initializeWallet = useCallback(async (
    mnemonicPhrase: string,
    password: string,
    name: string = 'Main Wallet'
  ) => {
    const newWallet = await createWallet(mnemonicPhrase, password, name);
    setWallet(newWallet);
    setActiveAccountState(newWallet.accounts[0]);
    setMnemonic(mnemonicPhrase);
    setHasExistingWallet(true);
    setIsLocked(false);
  }, []);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    try {
      const unlockedMnemonic = unlockWallet(password);
      setMnemonic(unlockedMnemonic);
      setIsLocked(false);
      setWallet(loadWallet());
      setActiveAccountState(getActiveAccount());
      return true;
    } catch {
      return false;
    }
  }, []);

  const lock = useCallback(() => {
    lockWallet();
    setMnemonic(null);
    setIsLocked(true);
  }, []);

  const switchAccount = useCallback((index: number) => {
    setActiveAccount(index);
    setActiveAccountState(getActiveAccount());
    setWallet(loadWallet());
  }, []);

  const switchChain = useCallback((newChainId: number) => {
    if (CHAINS[newChainId]) {
      setChainId(newChainId);
      localStorage.setItem('4ortinx_chainId', newChainId.toString());
    }
  }, []);

  const setBackedUp = useCallback(() => {
    markWalletBackedUp();
    setWallet(loadWallet());
  }, []);

  const resetWallet = useCallback(() => {
    deleteWallet();
    setWallet(null);
    setActiveAccountState(null);
    setMnemonic(null);
    setHasExistingWallet(false);
    setIsLocked(true);
  }, []);

  const generateNewMnemonic = useCallback((wordCount: 12 | 24 = 12): string => {
    return generateMnemonic(wordCount);
  }, []);

  const chain = CHAINS[chainId] || CHAINS[DEFAULT_CHAIN_ID];

  // Create provider for current chain
  const provider = useMemo(() => {
    if (chain?.rpcUrl) {
      return new ethers.JsonRpcProvider(chain.rpcUrl);
    }
    return null;
  }, [chain?.rpcUrl]);

  return (
    <WalletContext.Provider
      value={{
        isInitialized,
        hasExistingWallet,
        isLocked,
        wallet,
        activeAccount,
        mnemonic,
        chainId,
        chain,
        provider,
        bitcoinAddress,
        bitcoinBalance,
        bitcoinPrice,
        refreshBitcoinBalance,
        tronAddress,
        tronBalance,
        tronPrice,
        refreshTronBalance,
        multiChainAddresses,
        multiChainPrices,
        refreshMultiChainPrices,
        initializeWallet,
        unlock,
        lock,
        switchAccount,
        switchChain,
        setBackedUp,
        resetWallet,
        generateNewMnemonic,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
