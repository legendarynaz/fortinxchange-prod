import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight, 
  Bell,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { 
  getCombinedHistory, 
  formatTimestamp, 
  getExplorerTxUrl,
  type Transaction 
} from '../../services/historyService';
import { formatAddress } from '../../services/walletService';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'transaction' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  txHash?: string;
  txType?: Transaction['type'];
  chainId?: number;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { activeAccount, chainId, chain } = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && activeAccount?.address) {
      fetchNotifications();
    }
  }, [isOpen, activeAccount?.address, chainId]);

  const fetchNotifications = async () => {
    if (!activeAccount?.address) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch recent transactions and convert to notifications
      const txs = await getCombinedHistory(activeAccount.address, chainId, 1, 20);
      
      const txNotifications: Notification[] = txs.map(tx => ({
        id: tx.hash,
        type: 'transaction',
        title: getTransactionTitle(tx.type),
        message: getTransactionMessage(tx),
        timestamp: tx.timestamp,
        read: false,
        txHash: tx.hash,
        txType: tx.type,
        chainId: chainId,
      }));

      // Add welcome notification if new user
      const storedNotifications = localStorage.getItem('4ortinx_notifications_read') || '[]';
      const readIds = JSON.parse(storedNotifications) as string[];
      
      const allNotifications = [
        ...txNotifications.map(n => ({
          ...n,
          read: readIds.includes(n.id)
        }))
      ];

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
    setIsLoading(false);
  };

  const getTransactionTitle = (type: Transaction['type']): string => {
    switch (type) {
      case 'send': return 'Sent';
      case 'receive': return 'Received';
      case 'swap': return 'Swapped';
      case 'approve': return 'Approved';
      case 'contract': return 'Contract Interaction';
      default: return 'Transaction';
    }
  };

  const getTransactionMessage = (tx: Transaction): string => {
    const amount = parseFloat(tx.valueFormatted).toFixed(4);
    switch (tx.type) {
      case 'send':
        return `Sent ${amount} ${tx.tokenSymbol} to ${formatAddress(tx.to, 4)}`;
      case 'receive':
        return `Received ${amount} ${tx.tokenSymbol} from ${formatAddress(tx.from, 4)}`;
      case 'swap':
        return `Swapped ${amount} ${tx.tokenSymbol}`;
      case 'approve':
        return `Approved ${tx.tokenSymbol} spending`;
      default:
        return `${amount} ${tx.tokenSymbol}`;
    }
  };

  const getTypeIcon = (type?: Transaction['type']) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-5 h-5" />;
      case 'receive':
        return <ArrowDownLeft className="w-5 h-5" />;
      case 'swap':
        return <ArrowLeftRight className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type?: Transaction['type']) => {
    switch (type) {
      case 'send':
        return 'text-red-400 bg-red-500/10';
      case 'receive':
        return 'text-green-400 bg-green-500/10';
      case 'swap':
        return 'text-blue-400 bg-blue-500/10';
      default:
        return 'text-[#F0B90B] bg-[#F0B90B]/10';
    }
  };

  const markAsRead = (id: string) => {
    const storedNotifications = localStorage.getItem('4ortinx_notifications_read') || '[]';
    const readIds = JSON.parse(storedNotifications) as string[];
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('4ortinx_notifications_read', JSON.stringify(readIds));
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    const readIds = notifications.map(n => n.id);
    localStorage.setItem('4ortinx_notifications_read', JSON.stringify(readIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    localStorage.setItem('4ortinx_notifications_read', JSON.stringify(notifications.map(n => n.id)));
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50"
      onClick={onClose}
    >
      <div 
        className="absolute top-0 right-0 w-full max-w-sm h-full bg-[#0D1117] shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-12 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#F0B90B]" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-[#F0B90B] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/50">
            <button
              onClick={markAllAsRead}
              className="text-[#F0B90B] text-sm hover:underline"
            >
              Mark all as read
            </button>
            <button
              onClick={clearAll}
              className="text-gray-500 text-sm hover:text-gray-400 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="overflow-auto h-[calc(100%-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-[#F0B90B] border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 text-center">No notifications yet</p>
              <p className="text-gray-600 text-sm text-center mt-1">
                Your transaction activity will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.txHash && notification.chainId) {
                      window.open(getExplorerTxUrl(notification.txHash, notification.chainId), '_blank');
                    }
                  }}
                  className={`w-full text-left p-4 hover:bg-gray-800/50 transition-colors ${
                    !notification.read ? 'bg-[#F0B90B]/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.txType)}`}>
                      {getTypeIcon(notification.txType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{notification.title}</span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-[#F0B90B] rounded-full" />
                        )}
                      </div>
                      <p className="text-gray-400 text-sm truncate mt-0.5">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-600 text-xs">
                          {formatTimestamp(notification.timestamp as unknown as number)}
                        </span>
                        {notification.txHash && (
                          <ExternalLink className="w-3 h-3 text-gray-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Network indicator */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0D1117] border-t border-gray-800">
          <div className="flex items-center justify-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: chain.iconColor }}
            />
            <span className="text-gray-500 text-xs">
              Showing activity on {chain.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
