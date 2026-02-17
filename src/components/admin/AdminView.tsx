
import React, { useState, useEffect } from 'react';
import LogoIcon from '../icons/LogoIcon';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { getAppConfig, saveAppConfig, getTransactions, saveTransactions, resetAppConfig } from '../../services/configService';
import { AppConfig, Transaction } from '../../types';
import { MARKETS } from '../../constants';
import CogIcon from '../icons/CogIcon';
import ClockIcon from '../icons/ClockIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import XCircleIcon from '../icons/XCircleIcon';

const AdminView: React.FC<{ onConfigChange: () => void }> = ({ onConfigChange }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [config, setConfig] = useState<AppConfig>(getAppConfig());
  const [transactions, setTransactions] = useState<Transaction[]>(getTransactions());
  const [message, setMessage] = useState('');
  
  useEffect(() => {
      const interval = setInterval(() => {
        setTransactions(getTransactions());
      }, 5000); // Poll for new transactions
      return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'FortinXchangeDev2024!') {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Invalid credentials.');
    }
  };
  
  const handleSaveConfig = () => {
    saveAppConfig(config);
    onConfigChange(); // Notify App.tsx of the change
    setMessage('Configuration saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };
  
  const handleResetConfig = () => {
      if(window.confirm('Are you sure you want to reset all settings to their defaults?')) {
          resetAppConfig();
          const newConfig = getAppConfig();
          setConfig(newConfig);
          onConfigChange();
          setMessage('Configuration has been reset to default.');
          setTimeout(() => setMessage(''), 3000);
      }
  }

  const handleTransaction = (txId: string, status: 'approved' | 'declined') => {
      const updatedTransactions = transactions.filter(tx => tx.id !== txId);
      // In a real app, you'd update the status, but here we just remove it from the queue.
      setTransactions(updatedTransactions);
      saveTransactions(updatedTransactions);
  };

  const handleConfigChange = (field: keyof AppConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleManualRateChange = (base: string, value: string) => {
    const newManualRates = { ...config.manualRates, [base]: parseFloat(value) || 0 };
    handleConfigChange('manualRates', newManualRates);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-800 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center items-center gap-3 mb-6">
            <LogoIcon />
            <h1 className="text-3xl font-bold tracking-tighter">FortinXchange Admin</h1>
          </div>
          <Card className="!bg-slate-700 !border-slate-600">
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-xl font-bold text-center">Developer Login</h2>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-3 text-sm text-white placeholder:text-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-3 text-sm text-white placeholder:text-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500" />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full !mt-6">Login</Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  const pendingTransactions = transactions.filter(tx => tx.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <LogoIcon/>
                <h1 className="text-3xl font-bold tracking-tighter">Admin Dashboard</h1>
            </div>
            <a href="/" className="text-sm text-sky-400 hover:underline">Back to App</a>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Config */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="!bg-slate-800 !border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                       <CogIcon className="w-6 h-6 text-sky-400" />
                       <h2 className="text-xl font-bold">Platform Configuration</h2>
                    </div>

                    <div className="space-y-6 p-4 rounded-md bg-slate-800/50">
                        {/* Maintenance Mode */}
                        <div className="flex items-center justify-between">
                            <label className="font-semibold">Maintenance Mode</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={config.maintenanceMode} onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                            </label>
                        </div>
                        
                        {/* Thresholds */}
                        <InputGroup label="KYC Threshold ($)" type="number" value={config.kycThreshold} onChange={e => handleConfigChange('kycThreshold', Number(e.target.value))} />
                        <InputGroup label="Manual Approval Threshold ($)" type="number" value={config.manualApprovalThreshold} onChange={e => handleConfigChange('manualApprovalThreshold', Number(e.target.value))} />
                        
                        {/* Region Control */}
                        <InputGroup label="Allowed Countries (comma-separated, or GLOBAL)" type="text" value={Array.isArray(config.allowedCountries) ? config.allowedCountries.join(',') : 'GLOBAL'} onChange={e => handleConfigChange('allowedCountries', e.target.value.split(',').map(c => c.trim().toUpperCase()))} />
                    
                        {/* Rate Management */}
                        <div>
                            <label className="font-semibold block mb-2">Rate Mode</label>
                            <div className="flex gap-2">
                                <Button variant={config.rateMode === 'live' ? 'primary' : 'secondary'} onClick={() => handleConfigChange('rateMode', 'live')}>Live Rates</Button>
                                <Button variant={config.rateMode === 'manual' ? 'primary' : 'secondary'} onClick={() => handleConfigChange('rateMode', 'manual')}>Manual Rates</Button>
                            </div>
                        </div>

                        {config.rateMode === 'manual' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                                {MARKETS.map(market => (
                                    <InputGroup key={market.id} label={`${market.base} Price ($)`} type="number" value={config.manualRates[market.base] || ''} onChange={e => handleManualRateChange(market.base, e.target.value)} />
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center">
                        <p className={`text-sm h-5 transition-opacity ${message ? 'opacity-100' : 'opacity-0'}`}>{message}</p>
                        <div className="flex gap-4">
                           <Button onClick={handleResetConfig} variant="sell">Reset to Default</Button>
                           <Button onClick={handleSaveConfig} variant="primary">Save Configuration</Button>
                        </div>
                    </div>
                </Card>
            </div>
            {/* Right Column: Pending Transactions */}
            <div className="space-y-6">
                 <Card className="!bg-slate-800 !border-slate-700">
                    <h2 className="text-xl font-bold mb-4">Pending Transactions ({pendingTransactions.length})</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                       {pendingTransactions.length > 0 ? pendingTransactions.map(tx => (
                           <div key={tx.id} className="bg-slate-700/50 p-3 rounded-md">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{tx.type}: ${tx.amount.toFixed(2)} {tx.asset}</p>
                                        <p className="text-xs text-slate-400">User: {tx.userId}</p>
                                        <p className="text-xs text-slate-400">Time: {new Date(tx.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleTransaction(tx.id, 'approved')} className="text-green-400 hover:text-green-300"><CheckCircleIcon className="w-6 h-6" /></button>
                                        <button onClick={() => handleTransaction(tx.id, 'declined')} className="text-red-400 hover:text-red-300"><XCircleIcon className="w-6 h-6" /></button>
                                    </div>
                                </div>
                           </div>
                       )) : <p className="text-slate-400 text-center py-4">No pending transactions.</p>}
                    </div>
                 </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

const InputGroup: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="text-sm font-medium text-slate-300 block mb-2">{label}</label>
        <input {...props} className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-3 text-sm text-white placeholder:text-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500" />
    </div>
);

export default AdminView;
