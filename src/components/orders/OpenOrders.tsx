import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';

export interface OpenOrder {
  id: string;
  market: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'stop' | 'stop-limit';
  price: number;
  stopPrice?: number;
  amount: number;
  filled: number;
  total: number;
  status: 'open' | 'partial' | 'filled' | 'cancelled';
  createdAt: string;
}

const STORAGE_KEY = 'fortinx_open_orders';

export const getStoredOrders = (): OpenOrder[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveOrders = (orders: OpenOrder[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

export const addOrder = (order: Omit<OpenOrder, 'id' | 'filled' | 'status' | 'createdAt'>): OpenOrder => {
  const newOrder: OpenOrder = {
    ...order,
    id: crypto.randomUUID(),
    filled: 0,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  const orders = getStoredOrders();
  orders.unshift(newOrder);
  saveOrders(orders);
  return newOrder;
};

interface OpenOrdersProps {
  currentPrice?: number;
  market?: string;
}

const OpenOrders: React.FC<OpenOrdersProps> = ({ currentPrice, market }) => {
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'filled'>('all');

  useEffect(() => {
    setOrders(getStoredOrders());
    
    // Check for triggered orders
    const checkOrders = () => {
      const currentOrders = getStoredOrders();
      let updated = false;
      
      currentOrders.forEach((order, index) => {
        if (order.status === 'open' && currentPrice) {
          // Check stop orders
          if (order.type === 'stop' || order.type === 'stop-limit') {
            const stopPrice = order.stopPrice || order.price;
            if (order.side === 'buy' && currentPrice >= stopPrice) {
              currentOrders[index].status = 'filled';
              currentOrders[index].filled = order.amount;
              updated = true;
            } else if (order.side === 'sell' && currentPrice <= stopPrice) {
              currentOrders[index].status = 'filled';
              currentOrders[index].filled = order.amount;
              updated = true;
            }
          }
          // Check limit orders
          if (order.type === 'limit') {
            if (order.side === 'buy' && currentPrice <= order.price) {
              currentOrders[index].status = 'filled';
              currentOrders[index].filled = order.amount;
              updated = true;
            } else if (order.side === 'sell' && currentPrice >= order.price) {
              currentOrders[index].status = 'filled';
              currentOrders[index].filled = order.amount;
              updated = true;
            }
          }
        }
      });
      
      if (updated) {
        saveOrders(currentOrders);
        setOrders([...currentOrders]);
      }
    };
    
    if (currentPrice) {
      checkOrders();
    }
  }, [currentPrice]);

  const handleCancel = (orderId: string) => {
    const updated = orders.map(o => 
      o.id === orderId ? { ...o, status: 'cancelled' as const } : o
    );
    saveOrders(updated);
    setOrders(updated);
  };

  const filteredOrders = orders.filter(o => {
    if (market && o.market !== market) return false;
    if (filter === 'open') return o.status === 'open' || o.status === 'partial';
    if (filter === 'filled') return o.status === 'filled';
    return true;
  });

  const getStatusColor = (status: OpenOrder['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'partial': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'filled': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getTypeLabel = (type: OpenOrder['type']) => {
    switch (type) {
      case 'limit': return 'Limit';
      case 'stop': return 'Stop';
      case 'stop-limit': return 'Stop-Limit';
    }
  };

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">Open Orders</h3>
        <div className="flex gap-1">
          {(['all', 'open', 'filled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filter === f 
                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-10 h-10 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-slate-500 dark:text-slate-400">No orders</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Side</th>
                <th className="pb-2 font-medium">Price</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, 10).map((order) => (
                <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="py-2">
                    <span className="text-slate-700 dark:text-slate-300">{getTypeLabel(order.type)}</span>
                    {order.stopPrice && (
                      <span className="block text-xs text-slate-500">
                        Stop: ${order.stopPrice.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    <span className={`font-medium ${order.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                      {order.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 font-mono text-slate-900 dark:text-white">
                    ${order.price.toLocaleString()}
                  </td>
                  <td className="py-2 font-mono text-slate-700 dark:text-slate-300">
                    {order.amount.toFixed(4)}
                    {order.filled > 0 && order.filled < order.amount && (
                      <span className="block text-xs text-slate-500">
                        Filled: {order.filled.toFixed(4)}
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-2">
                    {(order.status === 'open' || order.status === 'partial') && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default OpenOrders;
