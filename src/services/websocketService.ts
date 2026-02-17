// WebSocket service for real-time crypto price updates using Binance public API

type PriceCallback = (symbol: string, price: number, change24h: number) => void;
type ConnectionCallback = (connected: boolean) => void;

interface TickerData {
  e: string;      // Event type
  s: string;      // Symbol
  c: string;      // Close price
  p: string;      // Price change
  P: string;      // Price change percent
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private priceCallbacks: Map<string, Set<PriceCallback>> = new Map();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isConnecting = false;
  private subscribedSymbols: Set<string> = new Set();

  // Map our symbols to Binance format
  private symbolMap: Record<string, string> = {
    'BTC': 'btcusdt',
    'ETH': 'ethusdt',
    'SOL': 'solusdt',
    'DOGE': 'dogeusdt',
    'XRP': 'xrpusdt',
  };

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    
    // Build stream URL with all subscribed symbols
    const streams = Array.from(this.subscribedSymbols)
      .map(s => this.symbolMap[s])
      .filter(Boolean)
      .map(s => `${s}@ticker`)
      .join('/');

    if (!streams) {
      this.isConnecting = false;
      return;
    }

    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected to Binance');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnection(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.data) {
            this.handleTickerUpdate(message.data as TickerData);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.notifyConnection(false);
        this.attemptReconnect();
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      this.isConnecting = false;
    }
  }

  private handleTickerUpdate(data: TickerData): void {
    // Convert Binance symbol back to our format
    const symbol = Object.entries(this.symbolMap).find(
      ([, binanceSymbol]) => binanceSymbol === data.s.toLowerCase()
    )?.[0];

    if (symbol) {
      const price = parseFloat(data.c);
      const change24h = parseFloat(data.P);
      
      const callbacks = this.priceCallbacks.get(symbol);
      if (callbacks) {
        callbacks.forEach(cb => cb(symbol, price, change24h));
      }
      
      // Also notify "all" subscribers
      const allCallbacks = this.priceCallbacks.get('*');
      if (allCallbacks) {
        allCallbacks.forEach(cb => cb(symbol, price, change24h));
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private notifyConnection(connected: boolean): void {
    this.connectionCallbacks.forEach(cb => cb(connected));
  }

  subscribe(symbol: string, callback: PriceCallback): () => void {
    // Add to subscribed symbols
    if (symbol !== '*') {
      this.subscribedSymbols.add(symbol);
    }

    // Add callback
    if (!this.priceCallbacks.has(symbol)) {
      this.priceCallbacks.set(symbol, new Set());
    }
    this.priceCallbacks.get(symbol)!.add(callback);

    // Reconnect with new symbol if needed
    if (this.ws?.readyState !== WebSocket.OPEN && !this.isConnecting) {
      this.connect();
    } else if (symbol !== '*' && this.ws?.readyState === WebSocket.OPEN) {
      // Need to reconnect to add new stream
      this.ws.close();
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.priceCallbacks.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.priceCallbacks.delete(symbol);
          if (symbol !== '*') {
            this.subscribedSymbols.delete(symbol);
          }
        }
      }
    };
  }

  subscribeAll(callback: PriceCallback): () => void {
    // Subscribe to all supported symbols
    Object.keys(this.symbolMap).forEach(s => this.subscribedSymbols.add(s));
    return this.subscribe('*', callback);
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.priceCallbacks.clear();
    this.subscribedSymbols.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

// Export types
export type { PriceCallback, ConnectionCallback };
