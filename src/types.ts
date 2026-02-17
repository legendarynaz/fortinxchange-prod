
export interface Market {
  id: string;
  base: string;
  quote: string;
  name: string;
}

export interface Order {
  price: number;
  size: number;
  total: number;
}

export interface Trade {
  id: string;

  time: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
}

export interface ChartDataPoint {
  time: string;
  price: number;
}

export interface GeminiAnalysis {
    summary: string;
    sentiment: 'Positive' | 'Negative' | 'Neutral';
}

export interface GroundingSource {
    web: {
        uri: string;
        title: string;
    };
}

export interface BankAccount {
    id: string;
    bankName: string;
    accountHolderName: string;
    accountNumberLast4: string;
}

export interface User {
    userId: string;
    email: string;
    // In a real app, this would be determined via IP geo-location on the backend.
    country: 'US' | 'CA' | 'GB' | 'NG' | 'DE';
}

export interface Transaction {
    id: string;
    userId: string;
    type: 'Deposit' | 'Withdrawal';
    amount: number;
    asset: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'declined';
}

export interface AppConfig {
    maintenanceMode: boolean;
    allowedCountries: string[]; // ['GLOBAL'] for all
    kycThreshold: number;
    manualApprovalThreshold: number;
    rateMode: 'live' | 'manual';
    manualRates: {
        [key: string]: number;
    };
}

export interface LoginAttemptInfo {
  count: number;
  firstAttemptTimestamp: number;
}
