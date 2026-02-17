import React, { useState } from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Tabs } from '../ui/Tabs';
import { simulateSendEmail } from '../../emails/templates';
import WalletConnect from './WalletConnect';
import { CHAIN_NAMES } from '../../config/web3';
import type { BankAccount, AppConfig, User, Transaction } from '../../types';

const MOCK_ASSETS = [
    { name: 'Bitcoin', symbol: 'BTC', balance: '1.50000000', value: '97,500.00' },
    { name: 'Ethereum', symbol: 'ETH', balance: '30.00000000', value: '105,000.00' },
    { name: 'Tether', symbol: 'USDT', balance: '100,000.0000', value: '100,000.00' },
    { name: 'Solana', symbol: 'SOL', balance: '500.000000', value: '75,000.00' },
];

type DepositType = 'card' | 'bank';

interface WalletViewProps {
    isKycVerified: boolean;
    onRequireKyc: () => void;
    appConfig: AppConfig;
    user: User;
    onAddTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp' | 'status'>) => void;
}

const WalletView: React.FC<WalletViewProps> = ({ isKycVerified, onRequireKyc, appConfig, user, onAddTransaction }) => {
    const [isDepositOpen, setDepositOpen] = useState(false);
    const [isWithdrawOpen, setWithdrawOpen] = useState(false);
    const [isAddBankOpen, setAddBankOpen] = useState(false);
    const [linkedAccounts] = useState<BankAccount[]>([]);
    
    // Web3 hooks
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { data: nativeBalance } = useBalance({ address });
    
    const formatBalance = (value: bigint, decimals: number, precision: number = 4) => {
        const divisor = BigInt(10 ** decimals);
        const intPart = value / divisor;
        const fracPart = value % divisor;
        const fracStr = fracPart.toString().padStart(decimals, '0').slice(0, precision);
        return `${intPart}.${fracStr}`;
    };
    
    const DepositContent = () => {
        const [type, setType] = useState<DepositType>('card');
        const [amount, setAmount] = useState('');
        const [status, setStatus] = useState<{ type: 'success' | 'error' | 'pending'; message: string } | null>(null);
        const [isProcessing, setIsProcessing] = useState(false);
        const [selectedBank, setSelectedBank] = useState<string>(linkedAccounts[0]?.id || '');

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsProcessing(true);
            setStatus(null);
            
            const depositAmount = parseFloat(amount);
            if (isNaN(depositAmount) || depositAmount <= 0) {
                setStatus({ type: 'error', message: 'Please enter a valid amount.' });
                setIsProcessing(false);
                return;
            }

            if (type === 'bank' && !selectedBank) {
                setStatus({ type: 'error', message: 'Please select a bank account.' });
                setIsProcessing(false);
                return;
            }

            // KYC Check
            if (!isKycVerified && depositAmount > appConfig.kycThreshold) {
                simulateSendEmail('kycRequired', { threshold: appConfig.kycThreshold });
                onRequireKyc();
                setDepositOpen(false);
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Smart Approval Check
            if (depositAmount > appConfig.manualApprovalThreshold) {
                onAddTransaction({
                    userId: user.userId,
                    type: 'Deposit',
                    amount: depositAmount,
                    asset: 'USD',
                });
                simulateSendEmail('transactionPending', { amount: depositAmount, asset: 'USD', type: 'Deposit' });
                setStatus({ type: 'pending', message: `Your deposit of $${depositAmount} is pending approval.` });
            } else {
                 // Auto-approve
                if (Math.random() > 0.1) {
                    setStatus({ type: 'success', message: `Successfully deposited $${amount}.` });
                    simulateSendEmail('depositSuccess', { amount: depositAmount, asset: 'USD', txId: crypto.randomUUID() });
                } else {
                    setStatus({ type: 'error', message: 'Deposit failed. Please try again.' });
                    simulateSendEmail('depositFailed', { amount: depositAmount, asset: 'USD', reason: 'Bank processing error' });
                }
            }
            setIsProcessing(false);
        };

        return (
            <div className="space-y-4">
                <Tabs tabs={[{id: 'card', label: 'Credit/Debit Card'}, {id: 'bank', label: 'Bank Transfer'}]} activeTab={type} onTabClick={(t) => setType(t as DepositType)} />
                {type === 'card' && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Card Number" placeholder="0000 0000 0000 0000" disabled={isProcessing}/>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Expiry Date" placeholder="MM/YY" disabled={isProcessing} />
                            <Input label="CVC" placeholder="123" disabled={isProcessing}/>
                        </div>
                        <Input label="Amount (USD)" placeholder="100.00" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isProcessing} />
                        <Button variant="primary" className="w-full" type="submit" disabled={isProcessing}>
                            {isProcessing ? 'Processing...' : 'Deposit Funds'}
                        </Button>
                    </form>
                )}
                {type === 'bank' && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {linkedAccounts.length > 0 ? (
                            <>
                                <Select label="From Account" value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                                    {linkedAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.bankName} - *{acc.accountNumberLast4}</option>)}
                                </Select>
                                <Input label="Amount (USD)" placeholder="100.00" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isProcessing} />
                                <Button variant="primary" className="w-full" type="submit" disabled={isProcessing}>
                                    {isProcessing ? 'Processing...' : 'Deposit Funds'}
                                </Button>
                            </>
                        ) : (
                            <div className="text-center bg-slate-100 p-4 rounded-lg">
                                <p className="text-sm text-slate-600 mb-3">You have no bank accounts linked.</p>
                                <Button onClick={() => { setDepositOpen(false); setAddBankOpen(true); }}>Add a Bank Account</Button>
                            </div>
                        )}
                    </form>
                )}
                {status && (
                    <p className={`text-sm text-center mt-4 ${status.type === 'success' ? 'text-green-600' : status.type === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>{status.message}</p>
                )}
            </div>
        )
    };
    
    const WithdrawContent = () => {
        type WithdrawType = 'crypto' | 'fiat';
        const [type, setType] = useState<WithdrawType>('crypto');
        const [amount, setAmount] = useState('');
        const [address, setAddress] = useState('');
        const [selectedAsset, setSelectedAsset] = useState('BTC');
        const [selectedBank, setSelectedBank] = useState<string>(linkedAccounts[0]?.id || '');
        const [status, setStatus] = useState<{ type: 'success' | 'error' | 'pending'; message: string } | null>(null);
        const [isProcessing, setIsProcessing] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsProcessing(true);
            setStatus(null);
            
            const withdrawAmount = parseFloat(amount);
            if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
                setStatus({ type: 'error', message: 'Please enter a valid amount.' });
                setIsProcessing(false);
                return;
            }

            if (type === 'crypto' && !address.trim()) {
                setStatus({ type: 'error', message: 'Please enter a wallet address.' });
                setIsProcessing(false);
                return;
            }

            if (type === 'fiat' && !selectedBank) {
                setStatus({ type: 'error', message: 'Please select a bank account.' });
                setIsProcessing(false);
                return;
            }

            // KYC Check
            if (!isKycVerified && withdrawAmount > appConfig.kycThreshold) {
                simulateSendEmail('kycRequired', { threshold: appConfig.kycThreshold });
                onRequireKyc();
                setWithdrawOpen(false);
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));

            const asset = type === 'crypto' ? selectedAsset : 'USD';

            // Smart Approval Check
            if (withdrawAmount > appConfig.manualApprovalThreshold) {
                onAddTransaction({
                    userId: user.userId,
                    type: 'Withdrawal',
                    amount: withdrawAmount,
                    asset: asset,
                });
                simulateSendEmail('transactionPending', { amount: withdrawAmount, asset: asset, type: 'Withdrawal' });
                setStatus({ type: 'pending', message: `Your withdrawal of ${withdrawAmount} ${asset} is pending approval.` });
            } else {
                // Auto-approve
                if (Math.random() > 0.1) {
                    const txId = crypto.randomUUID();
                    setStatus({ type: 'success', message: `Successfully withdrew ${amount} ${asset}.` });
                    simulateSendEmail('withdrawalSuccess', { amount: withdrawAmount, asset: asset, address: address || 'Bank Account', txId });
                } else {
                    setStatus({ type: 'error', message: 'Withdrawal failed. Please try again.' });
                    simulateSendEmail('withdrawalFailed', { amount: withdrawAmount, asset: asset, reason: 'Insufficient funds or network error' });
                }
            }
            setIsProcessing(false);
        };

        return (
            <div className="space-y-4">
                <Tabs tabs={[{id: 'crypto', label: 'Crypto'}, {id: 'fiat', label: 'Bank Transfer'}]} activeTab={type} onTabClick={(t) => setType(t as WithdrawType)} />
                {type === 'crypto' && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Select label="Asset" value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}>
                            {MOCK_ASSETS.map(asset => <option key={asset.symbol} value={asset.symbol}>{asset.name} ({asset.symbol}) - {asset.balance}</option>)}
                        </Select>
                        <Input label="Wallet Address" placeholder="Enter destination wallet address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={isProcessing} />
                        <Input label="Amount" placeholder="0.00" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isProcessing} />
                        <Button variant="primary" className="w-full" type="submit" disabled={isProcessing}>
                            {isProcessing ? 'Processing...' : 'Withdraw'}
                        </Button>
                    </form>
                )}
                {type === 'fiat' && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {linkedAccounts.length > 0 ? (
                            <>
                                <Select label="To Account" value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                                    {linkedAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.bankName} - *{acc.accountNumberLast4}</option>)}
                                </Select>
                                <Input label="Amount (USD)" placeholder="100.00" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isProcessing} />
                                <Button variant="primary" className="w-full" type="submit" disabled={isProcessing}>
                                    {isProcessing ? 'Processing...' : 'Withdraw to Bank'}
                                </Button>
                            </>
                        ) : (
                            <div className="text-center bg-slate-100 p-4 rounded-lg">
                                <p className="text-sm text-slate-600 mb-3">You have no bank accounts linked.</p>
                                <Button onClick={() => { setWithdrawOpen(false); setAddBankOpen(true); }}>Add a Bank Account</Button>
                            </div>
                        )}
                    </form>
                )}
                {status && (
                    <p className={`text-sm text-center mt-4 ${status.type === 'success' ? 'text-green-600' : status.type === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>{status.message}</p>
                )}
            </div>
        )
    };
    
    const AddBankContent = () => { /* ... content ... */ return <div>Add bank UI</div> };

    const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
        <div>
            <label className="text-xs text-slate-500 block mb-1.5">{label}</label>
            <input {...props} className="w-full bg-slate-100 border border-slate-300 rounded-md py-2 px-3 text-sm placeholder:text-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-200/50 disabled:cursor-not-allowed" />
        </div>
    );
    
    const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
        <div>
            <label className="text-xs text-slate-500 block mb-1.5">{label}</label>
            <select {...props} className="w-full bg-slate-100 border border-slate-300 rounded-md py-2 px-3 text-sm placeholder:text-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-200/50 disabled:cursor-not-allowed">
                {children}
            </select>
        </div>
    );

    return (
        <>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-900">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-white">Wallet</h1>
                        <div className="flex space-x-2">
                            <Button variant="buy" onClick={() => setDepositOpen(true)}>Deposit</Button>
                            <Button variant="sell" onClick={() => setWithdrawOpen(true)}>Withdraw</Button>
                        </div>
                    </div>
                    
                    {/* Web3 Wallet Connection */}
                    <div className="mb-6">
                        <WalletConnect />
                    </div>
                    
                    {/* Balance Card */}
                    <Card className="mb-6 bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-blue-100 text-sm">
                                    {isConnected ? `${CHAIN_NAMES[chainId] || 'Network'} Balance` : 'Total Balance'}
                                </p>
                                <p className="text-4xl font-bold">
                                    {isConnected && nativeBalance 
                                        ? `${formatBalance(nativeBalance.value, nativeBalance.decimals)} ${nativeBalance.symbol}`
                                        : '0.0000 ETH'
                                    }
                                </p>
                                {isConnected ? (
                                    <p className="text-blue-200 text-sm mt-1">
                                        Connected to Web3 Wallet
                                    </p>
                                ) : (
                                    <p className="text-blue-200 text-sm mt-1">
                                        Connect wallet to view balance
                                    </p>
                                )}
                            </div>
                            {isConnected && (
                                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                                    ● Live
                                </div>
                            )}
                        </div>
                    </Card>
                    
                    <h2 className="text-xl font-bold text-white mb-4">Assets</h2>
                    <Card padding="p-0" className="bg-gray-800 border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-3">Asset</th>
                                        <th className="px-6 py-3 text-right">Balance</th>
                                        <th className="px-6 py-3 text-right">Value (USD)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isConnected && nativeBalance ? (
                                        <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium text-white">
                                                {nativeBalance.symbol} <span className="text-gray-400">Native</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-gray-300">
                                                {formatBalance(nativeBalance.value, nativeBalance.decimals, 6)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-gray-300">-</td>
                                        </tr>
                                    ) : (
                                        <>
                                            <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="px-6 py-4 font-medium text-white">Ethereum <span className="text-gray-400">ETH</span></td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-300">0.000000</td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-300">$0.00</td>
                                            </tr>
                                            <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="px-6 py-4 font-medium text-white">Bitcoin <span className="text-gray-400">BTC</span></td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-300">0.00000000</td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-300">$0.00</td>
                                            </tr>
                                            <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="px-6 py-4 font-medium text-white">USDT <span className="text-gray-400">USDT</span></td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-300">0.000000</td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-300">$0.00</td>
                                            </tr>
                                            <tr className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                                <td className="px-6 py-4 font-medium text-white">USDC <span className="text-gray-400">USDC</span></td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-300">0.000000</td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-300">$0.00</td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                    
                    {!isConnected && (
                        <p className="text-center text-gray-500 text-sm mt-4">
                            Connect your wallet above to see your real crypto balances
                        </p>
                    )}
                </div>
            </main>
            <Modal isOpen={isDepositOpen} onClose={() => setDepositOpen(false)} title="Deposit Funds">
                <DepositContent />
            </Modal>
            <Modal isOpen={isWithdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw Funds">
                <WithdrawContent />
            </Modal>
             <Modal isOpen={isAddBankOpen} onClose={() => setAddBankOpen(false)} title="Add a Bank Account">
                <AddBankContent />
            </Modal>
        </>
    );
};

export default WalletView;
