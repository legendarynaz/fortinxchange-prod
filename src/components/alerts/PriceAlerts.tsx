import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { MARKETS } from '../../constants';
import XMarkIcon from '../icons/XMarkIcon';

export interface PriceAlert {
  id: string;
  asset: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: string;
  triggered: boolean;
}

const ALERTS_STORAGE_KEY = 'fortinXchange_priceAlerts';

const getStoredAlerts = (): PriceAlert[] => {
  try {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveAlerts = (alerts: PriceAlert[]) => {
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
};

interface PriceAlertsProps {
  currentPrices: Record<string, number>;
}

const PriceAlerts: React.FC<PriceAlertsProps> = ({ currentPrices }) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>(getStoredAlerts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    asset: 'BTC',
    targetPrice: '',
    condition: 'above' as 'above' | 'below',
  });

  // Check alerts against current prices
  useEffect(() => {
    const updatedAlerts = alerts.map(alert => {
      if (alert.triggered) return alert;
      
      const currentPrice = currentPrices[alert.asset];
      if (!currentPrice) return alert;

      const isTriggered = 
        (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && currentPrice <= alert.targetPrice);

      if (isTriggered) {
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification(`Price Alert: ${alert.asset}`, {
            body: `${alert.asset} is now ${alert.condition} $${alert.targetPrice.toLocaleString()}! Current: $${currentPrice.toLocaleString()}`,
            icon: '/favicon.ico',
          });
        }
        return { ...alert, triggered: true };
      }
      return alert;
    });

    if (JSON.stringify(updatedAlerts) !== JSON.stringify(alerts)) {
      setAlerts(updatedAlerts);
      saveAlerts(updatedAlerts);
    }
  }, [currentPrices, alerts]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newAlert.targetPrice);
    if (isNaN(price) || price <= 0) return;

    const alert: PriceAlert = {
      id: crypto.randomUUID(),
      asset: newAlert.asset,
      targetPrice: price,
      condition: newAlert.condition,
      createdAt: new Date().toISOString(),
      triggered: false,
    };

    const updatedAlerts = [...alerts, alert];
    setAlerts(updatedAlerts);
    saveAlerts(updatedAlerts);
    setNewAlert({ asset: 'BTC', targetPrice: '', condition: 'above' });
    setIsModalOpen(false);
  };

  const handleDeleteAlert = (id: string) => {
    const updatedAlerts = alerts.filter(a => a.id !== id);
    setAlerts(updatedAlerts);
    saveAlerts(updatedAlerts);
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <>
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Price Alerts</h3>
          <Button onClick={() => setIsModalOpen(true)} variant="primary" className="text-sm">
            + Add Alert
          </Button>
        </div>

        {alerts.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">
            No alerts set. Create one to get notified when prices hit your target.
          </p>
        ) : (
          <div className="space-y-3">
            {activeAlerts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Active</p>
                {activeAlerts.map(alert => (
                  <AlertRow 
                    key={alert.id} 
                    alert={alert} 
                    currentPrice={currentPrices[alert.asset]}
                    onDelete={handleDeleteAlert} 
                  />
                ))}
              </div>
            )}
            
            {triggeredAlerts.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Triggered</p>
                {triggeredAlerts.map(alert => (
                  <AlertRow 
                    key={alert.id} 
                    alert={alert}
                    currentPrice={currentPrices[alert.asset]}
                    onDelete={handleDeleteAlert} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Price Alert">
        <form onSubmit={handleCreateAlert} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-2">Asset</label>
            <select
              value={newAlert.asset}
              onChange={(e) => setNewAlert({ ...newAlert, asset: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm text-slate-900 dark:text-white"
            >
              {MARKETS.map(m => (
                <option key={m.base} value={m.base}>{m.base}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-2">Condition</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewAlert({ ...newAlert, condition: 'above' })}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  newAlert.condition === 'above'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Price goes above
              </button>
              <button
                type="button"
                onClick={() => setNewAlert({ ...newAlert, condition: 'below' })}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  newAlert.condition === 'below'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Price goes below
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-2">
              Target Price (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={newAlert.targetPrice}
              onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
              placeholder="e.g. 70000"
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              required
            />
            {currentPrices[newAlert.asset] && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Current {newAlert.asset} price: ${currentPrices[newAlert.asset]?.toLocaleString()}
              </p>
            )}
          </div>

          <Button type="submit" variant="primary" className="w-full">
            Create Alert
          </Button>
        </form>
      </Modal>
    </>
  );
};

const AlertRow: React.FC<{ 
  alert: PriceAlert; 
  currentPrice?: number;
  onDelete: (id: string) => void;
}> = ({ alert, currentPrice, onDelete }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg ${
    alert.triggered 
      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
      : 'bg-slate-50 dark:bg-slate-700/50'
  }`}>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-900 dark:text-white">{alert.asset}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          alert.condition === 'above' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {alert.condition === 'above' ? '↑' : '↓'} {alert.condition}
        </span>
        {alert.triggered && (
          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
            Triggered!
          </span>
        )}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
        Target: <span className="font-mono font-medium">${alert.targetPrice.toLocaleString()}</span>
        {currentPrice && (
          <span className="text-slate-400 ml-2">
            (Current: ${currentPrice.toLocaleString()})
          </span>
        )}
      </p>
    </div>
    <button 
      onClick={() => onDelete(alert.id)}
      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
    >
      <XMarkIcon className="w-5 h-5" />
    </button>
  </div>
);

export default PriceAlerts;
