import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight, 
  FileCheck, 
  FileCode,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { 
  getCombinedHistory, 
  formatTimestamp, 
  getExplorerTxUrl,
  type Transaction 
} from '../../services/historyService';
import { formatAddress } from '../../services/walletService';

const BlockchainHistory: React.FC = () => {
  const { activeAccount, chainId, chain } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [activeAccount?.address, chainId]);

  const fetchHistory = async () => {
    if (!activeAccount?.address) {
      setIsLoading(false);
      return;
    }

    try {
      const txs = await getCombinedHistory(activeAccount.address, chainId, 1, 50);
      setTransactions(txs);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchHistory();
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-5 h-5" />;
      case 'receive':
        return <ArrowDownLeft className="w-5 h-5" />;
      case 'swap':
        return <ArrowLeftRight className="w-5 h-5" />;
      case 'approve':
        return <FileCheck className="w-5 h-5" />;
      case 'contract':
        return <FileCode className="w-5 h-5" />;
      default:
        return <ArrowUpRight className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return 'text-red-400 bg-red-500/10';
      case 'receive':
        return 'text-green-400 bg-green-500/10';
      case 'swap':
        return 'text-blue-400 bg-blue-500/10';
      case 'approve':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'contract':
        return 'text-purple-400 bg-purple-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'send': return 'Sent';
      case 'receive': return 'Received';
      case 'swap': return 'Swapped';
      case 'approve': return 'Approved';
      case 'contract': return 'Contract';
      default: return 'Transaction';
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
  };

  // Transaction detail view
  if (selectedTx) {
    return (
      <div className="flex-1 bg-[#0D1117] overflow-auto pb-20">
        <div className="p-4">
          <button
            onClick={() => setSelectedTx(null)}
            className="text-[#F0B90B] mb-4 flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="bg-[#1A1A2E] rounded-2xl p-6">
            {/* Status */}
            <div className="flex items-center justify-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getTypeColor(selectedTx.type)}`}>
                {getTypeIcon(selectedTx.type)}
              </div>
            </div>

            <h2 className="text-xl font-bold text-white text-center mb-2">
              {getTypeLabel(selectedTx.type)}
            </h2>

            <div className="flex items-center justify-center gap-2 mb-6">
              {getStatusIcon(selectedTx.status)}
              <span className="text-gray-400 capitalize">{selectedTx.status}</span>
            </div>

            {/* Amount */}
            <div className="text-center mb-6">
              <p className={`text-3xl font-bold ${
                selectedTx.type === 'receive' ? 'text-green-400' : 'text-white'
              }`}>
                {selectedTx.type === 'receive' ? '+' : '-'}
                {parseFloat(selectedTx.valueFormatted).toFixed(6)} {selectedTx.tokenSymbol}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-500">From</span>
                <span className="text-white font-mono text-sm">
                  {formatAddress(selectedTx.from, 8)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-500">To</span>
                <span className="text-white font-mono text-sm">
                  {formatAddress(selectedTx.to, 8)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-500">Network</span>
                <span className="text-white">{chain.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-500">Date</span>
                <span className="text-white">
                  {new Date(selectedTx.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-500">Block</span>
                <span className="text-white">{selectedTx.blockNumber.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-500">Nonce</span>
                <span className="text-white">{selectedTx.nonce}</span>
              </div>
            </div>

            {/* Explorer link */}
            <a
              href={getExplorerTxUrl(selectedTx.hash, chainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full bg-[#252542] hover:bg-[#2d2d5a] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on Explorer
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0D1117] overflow-auto pb-20">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Network indicator */}
      <div className="px-4 mb-4">
        <div className="bg-[#1A1A2E] rounded-xl px-4 py-2 inline-flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: chain.iconColor }}
          />
          <span className="text-gray-400 text-sm">{chain.name}</span>
        </div>
      </div>

      {/* Transactions list */}
      <div className="px-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-[#1A1A2E] rounded-xl animate-pulse">
                <div className="w-10 h-10 bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="w-20 h-4 bg-gray-700 rounded mb-2" />
                  <div className="w-32 h-3 bg-gray-700 rounded" />
                </div>
                <div className="text-right">
                  <div className="w-24 h-4 bg-gray-700 rounded mb-2" />
                  <div className="w-16 h-3 bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#1A1A2E] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 mb-2">No transactions yet</p>
            <p className="text-gray-500 text-sm">
              Your transaction history on {chain.name} will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <button
                key={tx.hash}
                onClick={() => setSelectedTx(tx)}
                className="w-full flex items-center gap-3 p-4 bg-[#1A1A2E] hover:bg-[#252542] rounded-xl transition-colors"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(tx.type)}`}>
                  {getTypeIcon(tx.type)}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{getTypeLabel(tx.type)}</span>
                    {getStatusIcon(tx.status)}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {tx.type === 'receive' ? 'From ' : 'To '}
                    {formatAddress(tx.type === 'receive' ? tx.from : tx.to, 4)}
                  </p>
                </div>

                {/* Amount & Time */}
                <div className="text-right">
                  <p className={`font-medium ${
                    tx.type === 'receive' ? 'text-green-400' : 'text-white'
                  }`}>
                    {tx.type === 'receive' ? '+' : '-'}
                    {parseFloat(tx.valueFormatted).toFixed(4)} {tx.tokenSymbol}
                  </p>
                  <p className="text-gray-500 text-sm">{formatTimestamp(tx.timestamp)}</p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainHistory;
