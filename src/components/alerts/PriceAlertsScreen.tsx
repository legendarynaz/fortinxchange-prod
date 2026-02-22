import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  ToggleLeft,
  ToggleRight,
  AlertCircle
} from 'lucide-react';
import {
  getAlerts,
  deleteAlert,
  toggleAlert,
  requestNotificationPermission,
  POPULAR_ALERT_TOKENS,
  type PriceAlert,
} from '../../services/priceAlertService';
import { getMultipleTokenPrices } from '../../services/portfolioService';
import CreateAlertModal from './CreateAlertModal';

const PriceAlertsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadAlerts();
    fetchPrices();
    checkNotificationPermission();
  }, []);

  const loadAlerts = () => {
    setAlerts(getAlerts());
  };

  const fetchPrices = async () => {
    const symbols = POPULAR_ALERT_TOKENS.map(t => t.symbol);
    const fetchedPrices = await getMultipleTokenPrices(symbols);
    setPrices(fetchedPrices);
  };

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
  };

  const handleDeleteAlert = (id: string) => {
    deleteAlert(id);
    loadAlerts();
  };

  const handleToggleAlert = (id: string) => {
    toggleAlert(id);
    loadAlerts();
  };

  const handleAlertCreated = () => {
    loadAlerts();
    setShowCreateModal(false);
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const getDistanceToTarget = (alert: PriceAlert): string => {
    const currentPrice = prices[alert.symbol.toUpperCase()] || alert.currentPrice || 0;
    if (!currentPrice) return '—';
    
    const diff = ((alert.targetPrice - currentPrice) / currentPrice) * 100;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(2)}%`;
  };

  const activeAlerts = alerts.filter(a => a.isActive);
  const inactiveAlerts = alerts.filter(a => !a.isActive);

  return (
    <div className="flex-1 bg-[#0D1117] overflow-auto pb-20">
      {/* Header */}
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F0B90B]/10 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#F0B90B]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Price Alerts</h1>
              <p className="text-gray-500 text-sm">{activeAlerts.length} active</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-black font-medium px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Alert
          </button>
        </div>

        {/* Notification Permission Banner */}
        {!notificationsEnabled && (
          <button
            onClick={handleEnableNotifications}
            className="w-full bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-blue-500 font-medium">Enable Notifications</p>
              <p className="text-blue-400 text-sm">Get notified when prices hit your targets</p>
            </div>
          </button>
        )}
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-gray-400 text-sm font-medium mb-3">Active Alerts</h2>
          <div className="space-y-3">
            {activeAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                currentPrice={prices[alert.symbol.toUpperCase()]}
                onToggle={() => handleToggleAlert(alert.id)}
                onDelete={() => handleDeleteAlert(alert.id)}
                formatPrice={formatPrice}
                getDistanceToTarget={getDistanceToTarget}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Alerts */}
      {inactiveAlerts.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-gray-400 text-sm font-medium mb-3">Triggered / Inactive</h2>
          <div className="space-y-3">
            {inactiveAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                currentPrice={prices[alert.symbol.toUpperCase()]}
                onToggle={() => handleToggleAlert(alert.id)}
                onDelete={() => handleDeleteAlert(alert.id)}
                formatPrice={formatPrice}
                getDistanceToTarget={getDistanceToTarget}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-white font-semibold mb-2">No Price Alerts</h3>
          <p className="text-gray-500 text-sm mb-6">
            Create alerts to get notified when tokens reach your target price
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-black font-medium px-6 py-3 rounded-xl"
          >
            Create Your First Alert
          </button>
        </div>
      )}

      {/* Create Alert Modal */}
      <CreateAlertModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleAlertCreated}
        prices={prices}
      />
    </div>
  );
};

interface AlertCardProps {
  alert: PriceAlert;
  currentPrice?: number;
  onToggle: () => void;
  onDelete: () => void;
  formatPrice: (price: number) => string;
  getDistanceToTarget: (alert: PriceAlert) => string;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  currentPrice,
  onToggle,
  onDelete,
  formatPrice,
  getDistanceToTarget,
}) => {
  const isAbove = alert.condition === 'above';
  
  return (
    <div className={`bg-[#1A1A2E] rounded-2xl p-4 ${!alert.isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isAbove ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}>
            {isAbove ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{alert.symbol}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isAbove 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {isAbove ? 'Above' : 'Below'}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{alert.tokenName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {alert.isActive ? (
              <ToggleRight className="w-6 h-6 text-[#F0B90B]" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-gray-500" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5 text-gray-500 hover:text-red-500" />
          </button>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-gray-500 text-xs mb-1">Target</p>
          <p className="text-white font-semibold">{formatPrice(alert.targetPrice)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Current</p>
          <p className="text-white font-semibold">
            {currentPrice ? formatPrice(currentPrice) : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Distance</p>
          <p className={`font-semibold ${
            getDistanceToTarget(alert).startsWith('+') ? 'text-green-500' : 'text-red-500'
          }`}>
            {getDistanceToTarget(alert)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceAlertsScreen;
