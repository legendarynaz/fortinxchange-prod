import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type FiatCurrency = 'USD' | 'EUR' | 'GBP' | 'NGN';

interface CurrencyContextType {
  currency: FiatCurrency;
  setCurrency: (currency: FiatCurrency) => void;
  convertFromUSD: (amount: number) => number;
  formatCurrency: (amount: number) => string;
  symbol: string;
  rates: Record<FiatCurrency, number>;
}

const CURRENCY_STORAGE_KEY = 'fortinx_fiat_currency';

// Exchange rates relative to USD (as of implementation)
// In production, these would be fetched from an API
const DEFAULT_RATES: Record<FiatCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1550,
};

const CURRENCY_SYMBOLS: Record<FiatCurrency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
};

const CURRENCY_LOCALES: Record<FiatCurrency, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  NGN: 'en-NG',
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<FiatCurrency>(() => {
    try {
      const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (stored && ['USD', 'EUR', 'GBP', 'NGN'].includes(stored)) {
        return stored as FiatCurrency;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'USD';
  });

  const [rates, setRates] = useState<Record<FiatCurrency, number>>(DEFAULT_RATES);

  useEffect(() => {
    // In production, fetch live rates here
    // For now, use default rates
    setRates(DEFAULT_RATES);
  }, []);

  const setCurrency = (newCurrency: FiatCurrency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    } catch {
      // Ignore localStorage errors
    }
  };

  const convertFromUSD = (amountInUSD: number): number => {
    return amountInUSD * rates[currency];
  };

  const formatCurrency = (amountInUSD: number): string => {
    const converted = convertFromUSD(amountInUSD);
    return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'NGN' ? 0 : 2,
      maximumFractionDigits: currency === 'NGN' ? 0 : 2,
    }).format(converted);
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    convertFromUSD,
    formatCurrency,
    symbol: CURRENCY_SYMBOLS[currency],
    rates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const AVAILABLE_CURRENCIES: { code: FiatCurrency; name: string; flag: string }[] = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
];
