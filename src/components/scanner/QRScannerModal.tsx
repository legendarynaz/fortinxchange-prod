import React, { useState, useEffect, useCallback } from 'react';
import { X, Camera, Keyboard, AlertCircle, Copy, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
  BarcodeScanner,
  BarcodeFormat,
} from '@capacitor-mlkit/barcode-scanning';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const stopScanning = useCallback(async () => {
    if (isNative && isScanning) {
      try {
        await BarcodeScanner.stopScan();
        document.querySelector('body')?.classList.remove('barcode-scanner-active');
      } catch (e) {
        console.error('Error stopping scan:', e);
      }
    }
    setIsScanning(false);
  }, [isNative, isScanning]);

  const startScanning = useCallback(async () => {
    if (!isNative) {
      setMode('manual');
      setError('Camera scanning is only available in the mobile app. Please enter address manually.');
      return;
    }

    try {
      // Check/request permissions
      const { camera } = await BarcodeScanner.checkPermissions();
      
      if (camera !== 'granted') {
        const result = await BarcodeScanner.requestPermissions();
        if (result.camera !== 'granted') {
          setError('Camera permission required to scan QR codes.');
          setMode('manual');
          return;
        }
      }

      setError(null);
      setIsScanning(true);
      
      // Make background transparent for camera view
      document.querySelector('body')?.classList.add('barcode-scanner-active');

      // Start scanning
      const result = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
      });

      // Restore background
      document.querySelector('body')?.classList.remove('barcode-scanner-active');
      setIsScanning(false);

      if (result.barcodes.length > 0) {
        const scannedData = result.barcodes[0].rawValue;
        if (scannedData) {
          onScan(scannedData);
          onClose();
        }
      }
    } catch (e: any) {
      console.error('Scan error:', e);
      document.querySelector('body')?.classList.remove('barcode-scanner-active');
      setIsScanning(false);
      
      if (e.message !== 'scan canceled') {
        setError('Failed to scan. Please try manual entry.');
        setMode('manual');
      }
    }
  }, [isNative, onScan, onClose]);

  useEffect(() => {
    if (isOpen && mode === 'camera' && isNative) {
      startScanning();
    }
    return () => {
      stopScanning();
    };
  }, [isOpen, mode, isNative]);

  // Auto-switch to manual on web
  useEffect(() => {
    if (isOpen && !isNative) {
      setMode('manual');
    }
  }, [isOpen, isNative]);

  const handleClose = async () => {
    await stopScanning();
    setManualInput('');
    setError(null);
    onClose();
  };

  const handleManualSubmit = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) {
      setError('Please enter an address');
      return;
    }

    // Basic validation - check if it looks like a crypto address
    const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmed);
    const isBtcAddress = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed);
    const isTronAddress = /^T[a-zA-Z0-9]{33}$/.test(trimmed);
    const isWalletConnect = trimmed.startsWith('wc:');

    if (isEthAddress || isBtcAddress || isTronAddress || isWalletConnect) {
      onScan(trimmed);
      onClose();
    } else {
      setError('Invalid address format');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setManualInput(text);
      setError(null);
    } catch (err) {
      setError('Failed to paste from clipboard');
    }
  };

  const handleModeSwitch = async (newMode: 'camera' | 'manual') => {
    if (newMode === mode) return;
    
    if (mode === 'camera') {
      await stopScanning();
    }
    
    setError(null);
    setMode(newMode);
    
    if (newMode === 'camera' && isNative) {
      startScanning();
    }
  };

  if (!isOpen) return null;

  // When native scanning is active, show minimal UI overlay
  if (isScanning && isNative) {
    return (
      <div className="fixed inset-0 z-50">
        {/* Scanner is showing through transparent body */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-12 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Scan QR Code</h2>
            <button
              onClick={handleClose}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        
        {/* Scanning frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-[#F0B90B] rounded-2xl relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#F0B90B] rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#F0B90B] rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#F0B90B] rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#F0B90B] rounded-br-xl" />
          </div>
        </div>

        {/* Bottom instruction */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-center text-white text-sm mb-4">Position QR code within the frame</p>
          <button
            onClick={() => handleModeSwitch('manual')}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-colors"
          >
            Enter Manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col safe-area-inset">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12 bg-[#0D1117] border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Scan QR Code</h2>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-800 rounded-full"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      {/* Mode Tabs - Only show if native platform */}
      {isNative && (
        <div className="flex bg-[#1A1A2E] mx-4 mt-4 rounded-xl p-1">
          <button
            onClick={() => handleModeSwitch('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors ${
              mode === 'camera'
                ? 'bg-[#F0B90B] text-black font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          <button
            onClick={() => handleModeSwitch('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors ${
              mode === 'manual'
                ? 'bg-[#F0B90B] text-black font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Manual
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {mode === 'camera' && isNative ? (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#F0B90B] animate-spin mx-auto mb-4" />
            <p className="text-white">Starting camera...</p>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#F0B90B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Keyboard className="w-8 h-8 text-[#F0B90B]" />
              </div>
              <h3 className="text-white font-semibold mb-1">Enter Address Manually</h3>
              <p className="text-gray-500 text-sm">Paste or type a wallet address</p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => {
                  setManualInput(e.target.value);
                  setError(null);
                }}
                placeholder="0x... or bc1... or T..."
                className="w-full bg-[#1A1A2E] text-white px-4 py-4 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-[#F0B90B] placeholder:text-gray-600 font-mono text-sm"
                autoFocus
              />
              <button
                onClick={handlePaste}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Paste"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-4 rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 w-full max-w-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-500 text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Supported formats */}
      <div className="p-4 pb-8 bg-[#0D1117] border-t border-gray-800">
        <p className="text-gray-500 text-xs text-center">
          Supports: Ethereum, Bitcoin, Tron addresses & WalletConnect
        </p>
      </div>
    </div>
  );
};

export default QRScannerModal;
