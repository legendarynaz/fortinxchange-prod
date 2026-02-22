import { Capacitor } from '@capacitor/core';

const ALERTS_STORAGE_KEY = '4ortinx_price_alerts';
const TRIGGERED_ALERTS_KEY = '4ortinx_triggered_alerts';

export interface PriceAlert {
  id: string;
  symbol: string;
  tokenName: string;
  targetPrice: number;
  condition: 'above' | 'below';
  currentPrice?: number;
  createdAt: number;
  isActive: boolean;
  chainId?: number;
  tokenAddress?: string;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  symbol: string;
  targetPrice: number;
  actualPrice: number;
  condition: 'above' | 'below';
  triggeredAt: number;
  read: boolean;
}

/**
 * Get all price alerts
 */
export function getAlerts(): PriceAlert[] {
  try {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get active alerts only
 */
export function getActiveAlerts(): PriceAlert[] {
  return getAlerts().filter(alert => alert.isActive);
}

/**
 * Create a new price alert
 */
export function createAlert(alert: Omit<PriceAlert, 'id' | 'createdAt' | 'isActive'>): PriceAlert {
  const alerts = getAlerts();
  const newAlert: PriceAlert = {
    ...alert,
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    isActive: true,
  };
  
  alerts.push(newAlert);
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  
  return newAlert;
}

/**
 * Update an existing alert
 */
export function updateAlert(id: string, updates: Partial<PriceAlert>): PriceAlert | null {
  const alerts = getAlerts();
  const index = alerts.findIndex(a => a.id === id);
  
  if (index === -1) return null;
  
  alerts[index] = { ...alerts[index], ...updates };
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  
  return alerts[index];
}

/**
 * Delete an alert
 */
export function deleteAlert(id: string): boolean {
  const alerts = getAlerts();
  const filtered = alerts.filter(a => a.id !== id);
  
  if (filtered.length === alerts.length) return false;
  
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Toggle alert active status
 */
export function toggleAlert(id: string): PriceAlert | null {
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === id);
  
  if (!alert) return null;
  
  return updateAlert(id, { isActive: !alert.isActive });
}

/**
 * Get triggered alert notifications
 */
export function getTriggeredAlerts(): AlertNotification[] {
  try {
    const stored = localStorage.getItem(TRIGGERED_ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get unread triggered alerts count
 */
export function getUnreadAlertsCount(): number {
  return getTriggeredAlerts().filter(a => !a.read).length;
}

/**
 * Mark alert notification as read
 */
export function markAlertAsRead(notificationId: string): void {
  const notifications = getTriggeredAlerts();
  const index = notifications.findIndex(n => n.id === notificationId);
  
  if (index !== -1) {
    notifications[index].read = true;
    localStorage.setItem(TRIGGERED_ALERTS_KEY, JSON.stringify(notifications));
  }
}

/**
 * Mark all notifications as read
 */
export function markAllAlertsAsRead(): void {
  const notifications = getTriggeredAlerts().map(n => ({ ...n, read: true }));
  localStorage.setItem(TRIGGERED_ALERTS_KEY, JSON.stringify(notifications));
}

/**
 * Clear all triggered notifications
 */
export function clearTriggeredAlerts(): void {
  localStorage.setItem(TRIGGERED_ALERTS_KEY, JSON.stringify([]));
}

/**
 * Check alerts against current prices and trigger if conditions met
 */
export async function checkAlerts(prices: Record<string, number>): Promise<AlertNotification[]> {
  const activeAlerts = getActiveAlerts();
  const triggered: AlertNotification[] = [];
  const triggeredNotifications = getTriggeredAlerts();
  
  for (const alert of activeAlerts) {
    const currentPrice = prices[alert.symbol.toUpperCase()];
    if (!currentPrice) continue;
    
    // Update current price in alert
    updateAlert(alert.id, { currentPrice });
    
    // Check if condition is met
    const conditionMet = 
      (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.condition === 'below' && currentPrice <= alert.targetPrice);
    
    if (conditionMet) {
      // Check if we already triggered this alert recently (within 1 hour)
      const recentlyTriggered = triggeredNotifications.some(
        n => n.alertId === alert.id && Date.now() - n.triggeredAt < 3600000
      );
      
      if (!recentlyTriggered) {
        const notification: AlertNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          alertId: alert.id,
          symbol: alert.symbol,
          targetPrice: alert.targetPrice,
          actualPrice: currentPrice,
          condition: alert.condition,
          triggeredAt: Date.now(),
          read: false,
        };
        
        triggered.push(notification);
        
        // Send push notification if on native platform
        await sendPushNotification(alert, currentPrice);
        
        // Deactivate the alert after triggering
        updateAlert(alert.id, { isActive: false });
      }
    }
  }
  
  // Save triggered notifications
  if (triggered.length > 0) {
    const allNotifications = [...triggered, ...triggeredNotifications];
    localStorage.setItem(TRIGGERED_ALERTS_KEY, JSON.stringify(allNotifications));
  }
  
  return triggered;
}

/**
 * Send a push notification for a triggered alert
 */
async function sendPushNotification(alert: PriceAlert, currentPrice: number): Promise<void> {
  // Use web notifications API as fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    const direction = alert.condition === 'above' ? '📈' : '📉';
    new Notification(`${direction} ${alert.symbol} Price Alert`, {
      body: `${alert.symbol} is now $${currentPrice.toLocaleString()} (target: $${alert.targetPrice.toLocaleString()})`,
      icon: '/logo192.png',
      tag: alert.id,
    });
  }
  
  // For Capacitor native, you would use Local Notifications plugin
  // This would require: @capacitor/local-notifications
  if (Capacitor.isNativePlatform()) {
    // Implementation would go here with LocalNotifications.schedule()
    console.log('Native push notification would be sent here');
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

/**
 * Start monitoring prices for alerts
 * Returns cleanup function
 */
export function startAlertMonitoring(
  getPrices: () => Promise<Record<string, number>>,
  intervalMs: number = 60000 // Check every minute
): () => void {
  const checkAndNotify = async () => {
    try {
      const prices = await getPrices();
      await checkAlerts(prices);
    } catch (error) {
      console.error('Failed to check price alerts:', error);
    }
  };
  
  // Initial check
  checkAndNotify();
  
  // Set up interval
  const intervalId = setInterval(checkAndNotify, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Format price change percentage
 */
export function formatPriceChangePercent(currentPrice: number, targetPrice: number): string {
  const change = ((targetPrice - currentPrice) / currentPrice) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Popular tokens for quick alert setup
 */
export const POPULAR_ALERT_TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'TRX', name: 'Tron' },
];
