import React, { useState } from 'react';
import { Bell, Scan, Copy, Check } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { formatAddress } from '../../services/walletService';
import NetworkSelector from '../network/NetworkSelector';
import { LogoIcon } from '../common/Logo';
import QRScannerModal from '../scanner/QRScannerModal';
import NotificationsPanel from '../notifications/NotificationsPanel';

const TopBar: React.FC = () => {
  const { activeAccount } = useWallet();
  const [copied, setCopied] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleCopyAddress = async () => {
    if (activeAccount?.address) {
      await navigator.clipboard.writeText(activeAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleScan = (data: string) => {
    console.log('Scanned data:', data);
    
    // Determine what to do with the scanned data
    if (data.startsWith('0x') && data.length === 42) {
      // EVM address - navigate to send screen with pre-filled recipient
      window.dispatchEvent(new CustomEvent('navigate', { 
        detail: { view: 'send', scannedAddress: data, addressType: 'evm' } 
      }));
    } else if (data.startsWith('bc1') || data.startsWith('1') || data.startsWith('3')) {
      // Bitcoin address
      window.dispatchEvent(new CustomEvent('navigate', { 
        detail: { view: 'send', scannedAddress: data, addressType: 'bitcoin' } 
      }));
    } else if (data.startsWith('T') && data.length === 34) {
      // Tron address
      window.dispatchEvent(new CustomEvent('navigate', { 
        detail: { view: 'send', scannedAddress: data, addressType: 'tron' } 
      }));
    } else if (data.startsWith('wc:')) {
      // WalletConnect URI - could implement WC connection here
      console.log('WalletConnect URI detected:', data);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          {/* Logo and Address */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[#F0B90B]/30 blur-lg rounded-full" />
              <LogoIcon size={32} />
            </div>
            {activeAccount && (
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-xl transition-all duration-300"
              >
                <span className="text-sm text-gray-300">
                  {formatAddress(activeAccount.address, 4)}
                </span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            )}
          </div>
          
          {/* Network Selector */}
          <NetworkSelector />
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowScanner(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 border border-transparent hover:border-white/10"
              title="Scan QR Code"
            >
              <Scan className="w-5 h-5 text-gray-400" />
            </button>
            <button 
              onClick={() => setShowNotifications(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 border border-transparent hover:border-white/10 relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#F0B90B] rounded-full animate-pulse" />
            </button>
          </div>
        </div>
      </header>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default TopBar;
