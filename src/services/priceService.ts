// Price Service - Fetch token prices from CoinGecko
import type { TokenBalance } from './balanceService';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map chain symbols to CoinGecko IDs
const NATIVE_TOKEN_IDS: Record<string, string> = {
  ETH: 'ethereum',
  BNB: 'binancecoin',
  MATIC: 'matic-network',
  AVAX: 'avalanche-2',
  FTM: 'fantom',
  OP: 'optimism',
  BTC: 'bitcoin',
  TRX: 'tron',
};

// Comprehensive token mappings to CoinGecko IDs
const TOKEN_IDS: Record<string, string> = {
  // Stablecoins
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  BUSD: 'binance-usd',
  TUSD: 'true-usd',
  FRAX: 'frax',
  // Major tokens
  WBTC: 'wrapped-bitcoin',
  BTCB: 'bitcoin-bep2',
  WETH: 'weth',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  MKR: 'maker',
  CRV: 'curve-dao-token',
  LDO: 'lido-dao',
  // Meme coins
  SHIB: 'shiba-inu',
  DOGE: 'dogecoin',
  PEPE: 'pepe',
  FLOKI: 'floki',
  BONK: 'bonk',
  WIF: 'dogwifcoin',
  ELON: 'dogelon-mars',
  // DEX tokens
  CAKE: 'pancakeswap-token',
  SUSHI: 'sushi',
  '1INCH': '1inch',
  GMX: 'gmx',
  // Layer 2
  ARB: 'arbitrum',
  IMX: 'immutable-x',
  LRC: 'loopring',
  // Gaming
  AXS: 'axie-infinity',
  SAND: 'the-sandbox',
  MANA: 'decentraland',
  APE: 'apecoin',
  GALA: 'gala',
  // Infrastructure
  GRT: 'the-graph',
  FIL: 'filecoin',
  RNDR: 'render-token',
  FET: 'fetch-ai',
  // Others
  BLUR: 'blur',
  WLD: 'worldcoin-wld',
  STG: 'stargate-finance',
  PENDLE: 'pendle',
  // Tron ecosystem
  TRX: 'tron',
  JST: 'just',
  SUN: 'sun-token',
  BTT: 'bittorrent',
  WIN: 'wink',
};

interface PriceData {
  usd: number;
  usd_24h_change?: number;
}

// Cache for prices
let priceCache: Record<string, { data: PriceData; timestamp: number }> = {};
const CACHE_DURATION = 60000; // 1 minute

// Get price for a single token
export const getTokenPrice = async (symbol: string): Promise<PriceData | null> => {
  const id = TOKEN_IDS[symbol] || NATIVE_TOKEN_IDS[symbol];
  if (!id) return null;
  
  // Check cache
  const cached = priceCache[id];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch price');
    }
    
    const data = await response.json();
    const priceData = data[id];
    
    if (priceData) {
      const result: PriceData = {
        usd: priceData.usd,
        usd_24h_change: priceData.usd_24h_change,
      };
      
      // Update cache
      priceCache[id] = { data: result, timestamp: Date.now() };
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    return null;
  }
};

// Get prices for multiple tokens
export const getTokenPrices = async (symbols: string[]): Promise<Record<string, PriceData>> => {
  const ids = symbols
    .map(s => TOKEN_IDS[s] || NATIVE_TOKEN_IDS[s])
    .filter(Boolean);
  
  if (ids.length === 0) return {};
  
  // Check which ones need fetching
  const now = Date.now();
  const needsFetch: string[] = [];
  const results: Record<string, PriceData> = {};
  
  ids.forEach((id, i) => {
    const cached = priceCache[id];
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      results[symbols[i]] = cached.data;
    } else {
      needsFetch.push(id);
    }
  });
  
  if (needsFetch.length === 0) return results;
  
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${needsFetch.join(',')}&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch prices');
    }
    
    const data = await response.json();
    
    // Map back to symbols
    symbols.forEach((symbol) => {
      const id = TOKEN_IDS[symbol] || NATIVE_TOKEN_IDS[symbol];
      if (id && data[id]) {
        const priceData: PriceData = {
          usd: data[id].usd,
          usd_24h_change: data[id].usd_24h_change,
        };
        results[symbol] = priceData;
        priceCache[id] = { data: priceData, timestamp: now };
      }
    });
    
    return results;
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    return results;
  }
};

// Enrich balances with price data
export const enrichBalancesWithPrices = async (
  balances: TokenBalance[]
): Promise<TokenBalance[]> => {
  const symbols = balances.map(b => b.symbol);
  const prices = await getTokenPrices(symbols);
  
  return balances.map(balance => {
    const priceData = prices[balance.symbol];
    if (priceData) {
      const balanceNum = parseFloat(balance.balanceFormatted);
      return {
        ...balance,
        price: priceData.usd,
        priceChange24h: priceData.usd_24h_change,
        balanceUSD: balanceNum * priceData.usd,
      };
    }
    return balance;
  });
};

// Format USD value
export const formatUSD = (value: number): string => {
  if (value === 0) return '$0.00';
  if (value < 0.01) return '<$0.01';
  if (value < 1000) return `$${value.toFixed(2)}`;
  if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${(value / 1000000).toFixed(2)}M`;
};

// Format price change
export const formatPriceChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};
