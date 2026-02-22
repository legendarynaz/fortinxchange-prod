/**
 * Portfolio Service - Historical price data and portfolio tracking
 */

export interface PriceHistoryPoint {
  timestamp: number;
  price: number;
}

export interface PortfolioHistoryPoint {
  timestamp: number;
  totalValue: number;
}

export type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map common symbols to CoinGecko IDs
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  DOT: 'polkadot',
  TRX: 'tron',
  SHIB: 'shiba-inu',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  WBTC: 'wrapped-bitcoin',
};

/**
 * Get time range parameters for API calls
 */
function getTimeRangeParams(range: TimeRange): { days: string; interval?: string } {
  switch (range) {
    case '24h':
      return { days: '1', interval: 'hourly' };
    case '7d':
      return { days: '7', interval: 'hourly' };
    case '30d':
      return { days: '30', interval: 'daily' };
    case '90d':
      return { days: '90', interval: 'daily' };
    case '1y':
      return { days: '365', interval: 'daily' };
    case 'all':
      return { days: 'max', interval: 'daily' };
    default:
      return { days: '7', interval: 'hourly' };
  }
}

/**
 * Get CoinGecko ID for a symbol
 */
export function getCoinGeckoId(symbol: string): string | null {
  return SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()] || null;
}

/**
 * Fetch historical price data for a token
 */
export async function getTokenPriceHistory(
  symbol: string,
  range: TimeRange = '7d'
): Promise<PriceHistoryPoint[]> {
  const coinId = getCoinGeckoId(symbol);
  if (!coinId) {
    console.warn(`Unknown symbol: ${symbol}`);
    return [];
  }

  const { days } = getTimeRangeParams(range);

  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.prices.map(([timestamp, price]: [number, number]) => ({
      timestamp,
      price,
    }));
  } catch (error) {
    console.error(`Failed to fetch price history for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch current prices for multiple tokens
 */
export async function getMultipleTokenPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  const coinIds = symbols
    .map(s => getCoinGeckoId(s))
    .filter((id): id is string => id !== null);

  if (coinIds.length === 0) return {};

  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    const prices: Record<string, number> = {};
    for (const symbol of symbols) {
      const coinId = getCoinGeckoId(symbol);
      if (coinId && data[coinId]) {
        prices[symbol.toUpperCase()] = data[coinId].usd;
      }
    }
    
    return prices;
  } catch (error) {
    console.error('Failed to fetch token prices:', error);
    return {};
  }
}

/**
 * Calculate portfolio value history from holdings and price history
 */
export function calculatePortfolioHistory(
  holdings: Array<{ symbol: string; balance: number }>,
  priceHistories: Record<string, PriceHistoryPoint[]>
): PortfolioHistoryPoint[] {
  // Find the common timestamps across all assets
  const allTimestamps = new Set<number>();
  
  for (const history of Object.values(priceHistories)) {
    for (const point of history) {
      allTimestamps.add(point.timestamp);
    }
  }

  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  // Calculate portfolio value at each timestamp
  const portfolioHistory: PortfolioHistoryPoint[] = [];
  
  for (const timestamp of sortedTimestamps) {
    let totalValue = 0;
    
    for (const holding of holdings) {
      const history = priceHistories[holding.symbol.toUpperCase()];
      if (!history) continue;
      
      // Find the closest price point
      const pricePoint = history.reduce((closest, point) => {
        return Math.abs(point.timestamp - timestamp) < Math.abs(closest.timestamp - timestamp)
          ? point
          : closest;
      });
      
      if (pricePoint) {
        totalValue += holding.balance * pricePoint.price;
      }
    }
    
    portfolioHistory.push({ timestamp, totalValue });
  }

  return portfolioHistory;
}

/**
 * Calculate price change statistics
 */
export function calculatePriceChange(
  history: PriceHistoryPoint[]
): { change: number; changePercent: number; isPositive: boolean } {
  if (history.length < 2) {
    return { change: 0, changePercent: 0, isPositive: true };
  }

  const firstPrice = history[0].price;
  const lastPrice = history[history.length - 1].price;
  const change = lastPrice - firstPrice;
  const changePercent = (change / firstPrice) * 100;
  const isPositive = change >= 0;

  return { change, changePercent, isPositive };
}

/**
 * Get price statistics for display
 */
export function getPriceStats(history: PriceHistoryPoint[]): {
  high: number;
  low: number;
  avg: number;
  current: number;
} {
  if (history.length === 0) {
    return { high: 0, low: 0, avg: 0, current: 0 };
  }

  const prices = history.map(p => p.price);
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const current = prices[prices.length - 1];

  return { high, low, avg, current };
}

/**
 * Format chart data for Recharts
 */
export function formatChartData(
  history: PriceHistoryPoint[],
  range: TimeRange
): Array<{ time: string; price: number; timestamp: number }> {
  return history.map(point => ({
    time: formatTimestamp(point.timestamp, range),
    price: point.price,
    timestamp: point.timestamp,
  }));
}

/**
 * Format timestamp based on time range
 */
function formatTimestamp(timestamp: number, range: TimeRange): string {
  const date = new Date(timestamp);
  
  switch (range) {
    case '24h':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case '7d':
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
    case '30d':
    case '90d':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    case '1y':
    case 'all':
      return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
    default:
      return date.toLocaleDateString();
  }
}

/**
 * Downsample data for performance (limit points for charts)
 */
export function downsampleData<T>(
  data: T[],
  maxPoints: number = 100
): T[] {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  const result: T[] = [];
  
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }
  
  // Always include the last point
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }
  
  return result;
}

/**
 * Calculate portfolio allocation percentages
 */
export function calculateAllocation(
  holdings: Array<{ symbol: string; balance: number; price: number }>
): Array<{ symbol: string; value: number; percentage: number }> {
  const totalValue = holdings.reduce((sum, h) => sum + h.balance * h.price, 0);
  
  if (totalValue === 0) return [];
  
  return holdings
    .map(h => ({
      symbol: h.symbol,
      value: h.balance * h.price,
      percentage: ((h.balance * h.price) / totalValue) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Get sparkline data (simplified price history for mini charts)
 */
export async function getSparklineData(
  symbol: string
): Promise<number[]> {
  const coinId = getCoinGeckoId(symbol);
  if (!coinId) return [];

  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.market_data?.sparkline_7d?.price || [];
  } catch {
    return [];
  }
}
