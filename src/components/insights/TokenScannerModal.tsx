import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { 
  scanToken, 
  getSafetyColor, 
  getSafetyLabel,
  type TokenScanResult,
  type TokenWarning
} from '../../services/tokenScannerService';

interface TokenScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TokenScannerModal: React.FC<TokenScannerModalProps> = ({ isOpen, onClose }) => {
  const { chainId, chain } = useWallet();
  const [address, setAddress] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<TokenScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!address.trim()) return;

    // Basic validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      setError('Please enter a valid contract address');
      return;
    }

    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      const scanResult = await scanToken(address.trim(), chainId);
      setResult(scanResult);
    } catch (err) {
      setError('Failed to scan token. Please try again.');
    }

    setIsScanning(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const getWarningIcon = (severity: TokenWarning['severity']) => {
    switch (severity) {
      case 'danger': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getWarningBg = (severity: TokenWarning['severity']) => {
    switch (severity) {
      case 'danger': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'info': return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const getRiskIcon = (riskLevel: TokenScanResult['riskLevel']) => {
    switch (riskLevel) {
      case 'safe': return <ShieldCheck className="w-12 h-12" />;
      case 'low': return <Shield className="w-12 h-12" />;
      default: return <ShieldAlert className="w-12 h-12" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1A1A2E] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Token Scanner</h2>
            <p className="text-gray-400 text-xs">Scan contracts for risks</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Search Input */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Token Contract Address</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0x..."
              className="flex-1 bg-[#1A1A2E] border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-green-500"
            />
            <button
              onClick={handleScan}
              disabled={isScanning || !address.trim()}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 disabled:opacity-50 px-4 rounded-xl transition-opacity flex items-center gap-2"
            >
              {isScanning ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Scanning on {chain.name}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Scanning State */}
        {isScanning && (
          <div className="bg-[#1A1A2E] rounded-2xl p-8 text-center">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Scanning Contract...</p>
            <p className="text-gray-400 text-sm">Analyzing bytecode and contract functions</p>
          </div>
        )}

        {/* Results */}
        {result && !isScanning && (
          <div className="space-y-4">
            {/* Safety Score */}
            <div className="bg-[#1A1A2E] rounded-2xl p-6 text-center">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ 
                  backgroundColor: `${getSafetyColor(result.safetyScore)}20`,
                  color: getSafetyColor(result.safetyScore)
                }}
              >
                {getRiskIcon(result.riskLevel)}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-1">
                {result.safetyScore}/100
              </h3>
              <p 
                className="text-lg font-medium mb-4"
                style={{ color: getSafetyColor(result.safetyScore) }}
              >
                {getSafetyLabel(result.riskLevel)}
              </p>

              {/* Token Info */}
              <div className="bg-[#252542] rounded-xl p-4 text-left">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="text-white font-medium">{result.details.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Symbol</p>
                    <p className="text-white font-medium">{result.details.symbol}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Decimals</p>
                    <p className="text-white font-medium">{result.details.decimals}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Verified</p>
                    <p className={`font-medium ${result.verified ? 'text-green-500' : 'text-gray-400'}`}>
                      {result.verified ? 'Yes ✓' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Features */}
            <div className="bg-[#1A1A2E] rounded-2xl p-4">
              <h4 className="text-white font-medium mb-3">Contract Features</h4>
              <div className="grid grid-cols-2 gap-2">
                <FeatureItem 
                  label="Proxy Contract" 
                  value={result.details.isProxy} 
                  warning={result.details.isProxy}
                />
                <FeatureItem 
                  label="Blacklist" 
                  value={result.details.hasBlacklist} 
                  warning={result.details.hasBlacklist}
                />
                <FeatureItem 
                  label="Pausable" 
                  value={result.details.hasPause} 
                  warning={result.details.hasPause}
                />
                <FeatureItem 
                  label="Mintable" 
                  value={result.details.hasMint} 
                  warning={result.details.hasMint}
                />
              </div>
              
              {/* Tax Info */}
              {(result.details.buyTax > 0 || result.details.sellTax > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2">
                  <div className="bg-[#252542] rounded-lg p-2 text-center">
                    <p className="text-gray-500 text-xs">Buy Tax</p>
                    <p className={`text-lg font-bold ${result.details.buyTax > 5 ? 'text-yellow-500' : 'text-white'}`}>
                      ~{result.details.buyTax}%
                    </p>
                  </div>
                  <div className="bg-[#252542] rounded-lg p-2 text-center">
                    <p className="text-gray-500 text-xs">Sell Tax</p>
                    <p className={`text-lg font-bold ${result.details.sellTax > 10 ? 'text-red-500' : result.details.sellTax > 5 ? 'text-yellow-500' : 'text-white'}`}>
                      ~{result.details.sellTax}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white font-medium">Warnings ({result.warnings.length})</h4>
                {result.warnings.map((warning, idx) => (
                  <div 
                    key={idx}
                    className={`rounded-xl p-3 border ${getWarningBg(warning.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getWarningIcon(warning.severity)}
                      <div>
                        <p className="text-white text-sm font-medium">{warning.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{warning.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Warnings */}
            {result.warnings.length === 0 && result.riskLevel === 'safe' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-green-400 font-medium">No issues detected</p>
                  <p className="text-gray-400 text-sm">This token appears to be safe</p>
                </div>
              </div>
            )}

            {/* View on Explorer */}
            <a
              href={`${chain.explorerUrl}/address/${result.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#252542] hover:bg-[#2d2d5a] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on {chain.name} Explorer
            </a>
          </div>
        )}

        {/* Empty State */}
        {!result && !isScanning && !error && (
          <div className="bg-[#1A1A2E] rounded-2xl p-8 text-center">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Scan any token contract</p>
            <p className="text-gray-400 text-sm">
              Enter a contract address to check for honeypots, high taxes, and other risks before you trade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for feature items
const FeatureItem: React.FC<{ label: string; value: boolean; warning: boolean }> = ({ 
  label, 
  value, 
  warning 
}) => (
  <div className={`flex items-center justify-between p-2 rounded-lg ${warning && value ? 'bg-yellow-500/10' : 'bg-[#252542]'}`}>
    <span className="text-gray-400 text-xs">{label}</span>
    {value ? (
      <span className={`text-xs font-medium ${warning ? 'text-yellow-500' : 'text-green-500'}`}>Yes</span>
    ) : (
      <span className="text-xs font-medium text-gray-500">No</span>
    )}
  </div>
);

export default TokenScannerModal;
