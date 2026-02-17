import React, { useState } from 'react';
import Card from '../ui/Card';
import type { Transaction } from '../../types';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import XCircleIcon from '../icons/XCircleIcon';
import ClockIcon from '../icons/ClockIcon';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

type FilterType = 'all' | 'Deposit' | 'Withdrawal';
type FilterStatus = 'all' | 'pending' | 'approved' | 'declined';

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = transactions.filter(tx => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (searchQuery && !tx.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const StatusBadge = ({ status }: { status: Transaction['status'] }) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      declined: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    
    const icons = {
      pending: <ClockIcon className="w-3.5 h-3.5 mr-1" />,
      approved: <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />,
      declined: <XCircleIcon className="w-3.5 h-3.5 mr-1" />,
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const TypeBadge = ({ type }: { type: Transaction['type'] }) => {
    const isDeposit = type === 'Deposit';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isDeposit 
          ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' 
          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      }`}>
        {isDeposit ? '↓' : '↑'} {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by Transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg py-2 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        
        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as FilterType)}
          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg py-2 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">All Types</option>
          <option value="Deposit">Deposits</option>
          <option value="Withdrawal">Withdrawals</option>
        </select>
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg py-2 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      <Card padding="p-0" className="dark:bg-slate-800 dark:border-slate-700">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p className="text-lg">No transactions found</p>
            <p className="text-sm mt-1">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Asset</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {new Date(tx.timestamp).toLocaleDateString()} <br />
                      <span className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <TypeBadge type={tx.type} />
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">
                      {tx.type === 'Deposit' ? '+' : '-'}{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {tx.asset}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {tx.id.slice(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Deposits</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${transactions.filter(t => t.type === 'Deposit' && t.status === 'approved').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
          </p>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Withdrawals</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ${transactions.filter(t => t.type === 'Withdrawal' && t.status === 'approved').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
          </p>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {transactions.filter(t => t.status === 'pending').length} transactions
          </p>
        </Card>
      </div>
    </div>
  );
};

export default TransactionHistory;
