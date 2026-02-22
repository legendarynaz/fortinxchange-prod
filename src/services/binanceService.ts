/**
 * Binance API Service
 * Handles live trading, account balances, order book, and market data
 */

const BINANCE_API_KEY = import.meta.env.VITE_BINANCE_API_KEY || '';
const BINANCE_API_SECRET = import.meta.env.VITE_BINANCE_API_SECRET || '';

const API_BASE = 'https://api.binance.com';

// Types
export interface BinanceAccount {
  asset: string;
  free: string;
  locked: string;
}

export interface BinanceOrder {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  type: string;
  side: 'BUY' | 'SELL';
  time: number;
}

export interface OrderBookEntry {
  price: string;
  size: string;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface Trade {
  id: number;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
}

export interface Ticker {
  symbol: string;
  price: string;
  priceChangePercent: string;
  volume: string;
  highPrice: string;
  lowPrice: string;
}

// Generate HMAC-SHA256 signature
async function generateSignature(queryString: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(BINANCE_API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(queryString));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Make authenticated request to Binance API
async function binanceRequest<T>(
  method: string,
  endpoint: string,
  params: Record<string, string> = {},
  signed: boolean = false
): Promise<T | null> {
  try {
    let url = `${API_BASE}${endpoint}`;
    let queryString = new URLSearchParams(params).toString();
    
    if (signed) {
      if (!BINANCE_API_KEY || !BINANCE_API_SECRET) {
        console.error('Binance API credentials not configured');
        return null;
      }
      params.timestamp = Date.now().toString();
      queryString = new URLSearchParams(params).toString();
      const signature = await generateSignature(queryString);
      queryString += `&signature=${signature}`;
    }
    
    if (queryString) {
      url += `?${queryString}`;
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (signed) {
      headers['X-MBX-APIKEY'] = BINANCE_API_KEY;
    }
    
    const response = await fetch(url, { method, headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Binance API error:', response.status, errorData);
      throw new Error(errorData.msg || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Binance request failed:', error);
    throw error;
  }
}

// ============ Account & Balance Functions ============

export async function getAccountInfo(): Promise<{ balances: BinanceAccount[] } | null> {
  return binanceRequest('GET', '/api/v3/account', {}, true);
}

export async function getBalances(): Promise<BinanceAccount[]> {
  const account = await getAccountInfo();
  if (!account) return [];
  // Filter to only show assets with balance
  return account.balances.filter(b => 
    parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
  );
}

// ============ Market Data Functions (Public - No Auth) ============

export async function getTicker(symbol: string): Promise<Ticker | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v3/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      symbol: data.symbol,
      price: data.lastPrice,
      priceChangePercent: data.priceChangePercent,
      volume: data.volume,
      highPrice: data.highPrice,
      lowPrice: data.lowPrice,
    };
  } catch {
    return null;
  }
}

export async function getPrice(symbol: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v3/ticker/price?symbol=${symbol}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.price;
  } catch {
    return null;
  }
}

export async function getOrderBook(symbol: string, limit: number = 20): Promise<OrderBookData | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v3/depth?symbol=${symbol}&limit=${limit}`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      bids: data.bids.map(([price, size]: [string, string]) => ({ price, size })),
      asks: data.asks.map(([price, size]: [string, string]) => ({ price, size })),
    };
  } catch {
    return null;
  }
}

export async function getRecentTrades(symbol: string, limit: number = 50): Promise<Trade[]> {
  try {
    const response = await fetch(`${API_BASE}/api/v3/trades?symbol=${symbol}&limit=${limit}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function getKlines(
  symbol: string,
  interval: string = '1h',
  limit: number = 100
): Promise<Array<{ time: number; open: string; high: string; low: string; close: string; volume: string }>> {
  try {
    const response = await fetch(
      `${API_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((k: any[]) => ({
      time: k[0],
      open: k[1],
      high: k[2],
      low: k[3],
      close: k[4],
      volume: k[5],
    }));
  } catch {
    return [];
  }
}

// ============ Trading Functions ============

export interface CreateOrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_LOSS_LIMIT';
  quantity?: string;
  quoteOrderQty?: string;  // For market orders - amount in quote currency
  price?: string;          // For limit orders
  stopPrice?: string;      // For stop orders
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export async function createOrder(params: CreateOrderParams): Promise<BinanceOrder | null> {
  const orderParams: Record<string, string> = {
    symbol: params.symbol,
    side: params.side,
    type: params.type,
  };
  
  if (params.quantity) orderParams.quantity = params.quantity;
  if (params.quoteOrderQty) orderParams.quoteOrderQty = params.quoteOrderQty;
  if (params.price) orderParams.price = params.price;
  if (params.stopPrice) orderParams.stopPrice = params.stopPrice;
  if (params.timeInForce) orderParams.timeInForce = params.timeInForce;
  
  // Limit orders require timeInForce
  if (params.type === 'LIMIT' && !params.timeInForce) {
    orderParams.timeInForce = 'GTC';
  }
  
  return binanceRequest('POST', '/api/v3/order', orderParams, true);
}

export async function cancelOrder(symbol: string, orderId: number): Promise<boolean> {
  try {
    await binanceRequest('DELETE', '/api/v3/order', {
      symbol,
      orderId: orderId.toString(),
    }, true);
    return true;
  } catch {
    return false;
  }
}

export async function getOpenOrders(symbol?: string): Promise<BinanceOrder[]> {
  const params: Record<string, string> = {};
  if (symbol) params.symbol = symbol;
  const orders = await binanceRequest<BinanceOrder[]>('GET', '/api/v3/openOrders', params, true);
  return orders || [];
}

export async function getOrder(symbol: string, orderId: number): Promise<BinanceOrder | null> {
  return binanceRequest('GET', '/api/v3/order', {
    symbol,
    orderId: orderId.toString(),
  }, true);
}

export async function getAllOrders(symbol: string, limit: number = 50): Promise<BinanceOrder[]> {
  const orders = await binanceRequest<BinanceOrder[]>('GET', '/api/v3/allOrders', {
    symbol,
    limit: limit.toString(),
  }, true);
  return orders || [];
}

// ============ Exchange Info ============

export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  filters: Array<{ filterType: string; [key: string]: any }>;
}

export async function getExchangeInfo(): Promise<{ symbols: SymbolInfo[] } | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v3/exchangeInfo`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getSymbolInfo(symbol: string): Promise<SymbolInfo | null> {
  const info = await getExchangeInfo();
  return info?.symbols.find(s => s.symbol === symbol) || null;
}

// ============ Helper Functions ============

export function isConfigured(): boolean {
  return Boolean(BINANCE_API_KEY && BINANCE_API_SECRET);
}

export function toSymbol(base: string, quote: string = 'USDT'): string {
  return `${base}${quote}`;
}

export function fromSymbol(symbol: string): { base: string; quote: string } {
  // Common quote currencies
  const quotes = ['USDT', 'BUSD', 'USD', 'BTC', 'ETH', 'BNB'];
  for (const quote of quotes) {
    if (symbol.endsWith(quote)) {
      return { base: symbol.slice(0, -quote.length), quote };
    }
  }
  return { base: symbol, quote: 'USDT' };
}

export const POPULAR_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'DOTUSDT',
  'MATICUSDT',
];
