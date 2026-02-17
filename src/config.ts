
import { AppConfig } from './types';

// This file now exports the default configuration for the application.
// Live settings are managed by the `configService` and stored in localStorage.
// These values are used as a fallback if no settings are found in localStorage.

export const DEFAULT_CONFIG: AppConfig = {
  // Puts the app in maintenance mode for all users except admin.
  maintenanceMode: false,

  // Controls which countries can access the app. Use 'GLOBAL' for no restrictions.
  // Uses 2-letter ISO country codes. e.g., ['US', 'CA', 'GB', 'NG']
  allowedCountries: ['GLOBAL'],

  // The transaction amount (in USD) that triggers the mandatory KYC verification process.
  kycThreshold: 1000,
  
  // The transaction amount (in USD) above which transactions require manual admin approval.
  manualApprovalThreshold: 5000,
  
  // Determines if asset prices are fetched from the live API or set manually.
  rateMode: 'live', // 'live' or 'manual'
  
  // Manually set prices for assets when rateMode is 'manual'.
  manualRates: {
    'BTC': 69000,
    'ETH': 3900,
    'SOL': 170,
    'DOGE': 0.15,
    'XRP': 0.50,
  }
};
