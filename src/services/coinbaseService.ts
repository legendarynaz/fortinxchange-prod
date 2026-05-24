/**
 * Coinbase Advanced Trade API Service
 * Handles live trading, account balances, order book, and market data
 *
 * SECURITY WARNING: This service currently uses client-side API credentials.
 * In production, authenticated endpoints (trading, balances) should be proxied
 * through server-side API routes to protect API secrets.
 * Public market data endpoints are safe to call directly from the client.
 */

// API Configuration
// WARNING: These credentials are exposed in the browser if set with VITE_ prefix.
// For production, remove VITE_ prefix and proxy through backend API routes.
const COINBASE_API_KEY = import.meta.env.VITE_COINBASE_API_KEY || '';
const COINBASE_API_SECRET = import.meta.env.VITE_COINBASE_API_SECRET || '';

const API_BASE = 'https://api.coinbase.com/api/v3/brokerage';

// Types
export interface CoinbaseAccount {
  uuid: string;
  name: string;
  currency: string;
  available_balance: {
    value: string;
    currency: string;
  };
  hold: {
    value: string;
    currency: string;
  };
}

export interface CoinbaseOrder {
  order_id: string;
  product_id: string;
  side: 'BUY' | 'SELL';
  status: string;
  order_type: string;
  created_time: string;
  filled_size: string;
  average_filled_price: string;
  total_fees: string;
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
  trade_id: string;
  product_id: string;
  price: string;
  size: string;
  time: string;
  side: 'BUY' | 'SELL';
}

export interface Ticker {
  price: string;
  volume_24h: string;
  price_percent_chg_24h: string;
  best_bid: string;
  best_ask: string;
}

// Generate signature for Coinbase API
async function generateSignature(
  timestamp: string,
  method: string,
  path: string,
  body: string = ''
): Promise<string> {
  const message = timestamp + method + path + body;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(COINBASE_API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Make authenticated request to Coinbase API
async function coinbaseRequest<T>(
  method: string,
  endpoint: string,
  body?: object
): Promise<T | null> {
  if (!COINBASE_API_KEY || !COINBASE_API_SECRET) {
    console.error('Coinbase API credentials not configured');
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const path = `/api/v3/brokerage${endpoint}`;
  const bodyStr = body ? JSON.stringify(body) : '';
  
  try {
    const signature = await generateSignature(timestamp, method, path, bodyStr);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'CB-ACCESS-KEY': COINBASE_API_KEY,
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp,
      },
      body: body ? bodyStr : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Coinbase API error:', response.status, errorData);
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Coinbase request failed:', error);
    throw error;
  }
}

// ============ Account & Balance Functions ============

export async function getAccounts(): Promise<CoinbaseAccount[]> {
  const response = await coinbaseRequest<{ accounts: CoinbaseAccount[] }>('GET', '/accounts');
  return response?.accounts || [];
}

export async function getAccount(uuid: string): Promise<CoinbaseAccount | null> {
  const response = await coinbaseRequest<{ account: CoinbaseAccount }>('GET', `/accounts/${uuid}`);
  return response?.account || null;
}

// ============ Market Data Functions ============

export async function getTicker(productId: string): Promise<Ticker | null> {
  try {
    // Public endpoint - no auth required
    const response = await fetch(
      `https://api.coinbase.com/api/v3/brokerage/market/products/${productId}/ticker`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.trades?.[0] ? {
      price: data.trades[0].price,
      volume_24h: data.volume_24h || '0',
      price_percent_chg_24h: data.price_percent_chg_24h || '0',
      best_bid: data.best_bid || data.trades[0].price,
      best_ask: data.best_ask || data.trades[0].price,
    } : null;
  } catch {
    return null;
  }
}

export async function getOrderBook(productId: string, limit: number = 25): Promise<OrderBookData | null> {
  try {
    const response = await fetch(
      `https://api.coinbase.com/api/v3/brokerage/market/products/${productId}/book?limit=${limit}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
      bids: data.pricebook?.bids || [],
      asks: data.pricebook?.asks || [],
    };
  } catch {
    return null;
  }
}

export async function getRecentTrades(productId: string, limit: number = 50): Promise<Trade[]> {
  try {
    const response = await fetch(
      `https://api.coinbase.com/api/v3/brokerage/market/products/${productId}/ticker?limit=${limit}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.trades || [];
  } catch {
    return [];
  }
}

export async function getProductCandles(
  productId: string,
  granularity: string = 'ONE_HOUR',
  start?: string,
  end?: string
): Promise<{ candles: Array<{ start: string; low: string; high: string; open: string; close: string; volume: string }> }> {
  try {
    const params = new URLSearchParams({ granularity });
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    
    const response = await fetch(
      `https://api.coinbase.com/api/v3/brokerage/market/products/${productId}/candles?${params}`
    );
    if (!response.ok) return { candles: [] };
    return await response.json();
  } catch {
    return { candles: [] };
  }
}

// ============ Trading Functions ============

export interface CreateOrderParams {
  product_id: string;
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT' | 'STOP_LIMIT';
  size?: string;           // For market sells & limit orders
  quote_size?: string;     // For market buys (amount in quote currency)
  limit_price?: string;    // For limit orders
  stop_price?: string;     // For stop orders
  time_in_force?: 'GTC' | 'IOC' | 'FOK';
}

export async function createOrder(params: CreateOrderParams): Promise<CoinbaseOrder | null> {
  const orderConfig: Record<string, unknown> = {};
  
  if (params.order_type === 'MARKET') {
    orderConfig.market_market_ioc = params.side === 'BUY' 
      ? { quote_size: params.quote_size }
      : { base_size: params.size };
  } else if (params.order_type === 'LIMIT') {
    orderConfig.limit_limit_gtc = {
      base_size: params.size,
      limit_price: params.limit_price,
    };
  } else if (params.order_type === 'STOP_LIMIT') {
    orderConfig.stop_limit_stop_limit_gtc = {
      base_size: params.size,
      limit_price: params.limit_price,
      stop_price: params.stop_price,
      stop_direction: params.side === 'BUY' ? 'STOP_DIRECTION_STOP_UP' : 'STOP_DIRECTION_STOP_DOWN',
    };
  }

  const body = {
    client_order_id: crypto.randomUUID(),
    product_id: params.product_id,
    side: params.side,
    order_configuration: orderConfig,
  };

  const response = await coinbaseRequest<{ order: CoinbaseOrder }>('POST', '/orders', body);
  return response?.order || null;
}

export async function cancelOrder(orderId: string): Promise<boolean> {
  try {
    await coinbaseRequest('POST', '/orders/batch_cancel', { order_ids: [orderId] });
    return true;
  } catch {
    return false;
  }
}

export async function getOrders(status?: string): Promise<CoinbaseOrder[]> {
  const endpoint = status ? `/orders/historical/batch?order_status=${status}` : '/orders/historical/batch';
  const response = await coinbaseRequest<{ orders: CoinbaseOrder[] }>('GET', endpoint);
  return response?.orders || [];
}

export async function getOrder(orderId: string): Promise<CoinbaseOrder | null> {
  const response = await coinbaseRequest<{ order: CoinbaseOrder }>('GET', `/orders/historical/${orderId}`);
  return response?.order || null;
}

// ============ Product Info ============

export interface Product {
  product_id: string;
  base_currency_id: string;
  quote_currency_id: string;
  base_min_size: string;
  base_max_size: string;
  quote_min_size: string;
  price: string;
  status: string;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch('https://api.coinbase.com/api/v3/brokerage/market/products');
    if (!response.ok) return [];
    const data = await response.json();
    return data.products || [];
  } catch {
    return [];
  }
}

export async function getProduct(productId: string): Promise<Product | null> {
  try {
    const response = await fetch(`https://api.coinbase.com/api/v3/brokerage/market/products/${productId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// ============ Helper to check if API is configured ============

export function isConfigured(): boolean {
  return Boolean(COINBASE_API_KEY && COINBASE_API_SECRET);
}

// ============ Product ID helpers ============

export function toProductId(base: string, quote: string = 'USD'): string {
  return `${base}-${quote}`;
}

export const POPULAR_PRODUCTS = [
  'BTC-USD',
  'ETH-USD',
  'SOL-USD',
  'DOGE-USD',
  'XRP-USD',
  'ADA-USD',
  'AVAX-USD',
  'MATIC-USD',
  'LINK-USD',
  'DOT-USD',
];
