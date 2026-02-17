
import { AppConfig, Transaction } from '../types';
import { DEFAULT_CONFIG } from '../config';

const CONFIG_KEY = 'fortinXchange_appConfig';
const TRANSACTIONS_KEY = 'fortinXchange_transactions';

// --- Configuration Management ---

export const getAppConfig = (): AppConfig => {
  try {
    const storedConfig = localStorage.getItem(CONFIG_KEY);
    if (storedConfig) {
      // Merge stored config with defaults to ensure all keys are present
      const parsedConfig = JSON.parse(storedConfig);
      return { ...DEFAULT_CONFIG, ...parsedConfig };
    }
  } catch (error) {
    console.error("Failed to parse config from localStorage", error);
  }
  return DEFAULT_CONFIG;
};

export const saveAppConfig = (config: AppConfig): void => {
  try {
    const configString = JSON.stringify(config);
    localStorage.setItem(CONFIG_KEY, configString);
  } catch (error) {
    console.error("Failed to save config to localStorage", error);
  }
};

export const resetAppConfig = (): void => {
    localStorage.removeItem(CONFIG_KEY);
}


// --- Transaction Management ---

export const getTransactions = (): Transaction[] => {
    try {
        const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
        return storedTransactions ? JSON.parse(storedTransactions) : [];
    } catch (error) {
        console.error("Failed to parse transactions from localStorage", error);
        return [];
    }
};

export const saveTransactions = (transactions: Transaction[]): void => {
    try {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
        console.error("Failed to save transactions to localStorage", error);
    }
};
