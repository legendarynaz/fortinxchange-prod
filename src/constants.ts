
import { Market } from './types';

export const MARKETS: Market[] = [
  { id: 'BTC-USDT', base: 'BTC', quote: 'USDT', name: 'BTC/USDT' },
  { id: 'ETH-USDT', base: 'ETH', quote: 'USDT', name: 'ETH/USDT' },
  { id: 'SOL-USDT', base: 'SOL', quote: 'USDT', name: 'SOL/USDT' },
  { id: 'DOGE-USDT', base: 'DOGE', quote: 'USDT', name: 'DOGE/USDT' },
  { id: 'XRP-USDT', base: 'XRP', quote: 'USDT', name: 'XRP/USDT' },
];

export const MOCK_BANK_NAMES: string[] = [
    'Chase Bank',
    'Bank of America',
    'Wells Fargo',
    'Citibank',
    'U.S. Bank',
    'PNC Bank',
    'TD Bank',
    'Capital One',
    'HSBC',
];
