
import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Tabs } from '../ui/Tabs';
import { simulateSendEmail } from '../../emails/templates';
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
    
    const WithdrawContent = () => { /* ... similar logic would be applied here ... */ return <div>Withdrawal UI</div> };
    
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
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-sky-50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-slate-900">Wallet</h1>
                        <div className="flex space-x-2">
                            <Button variant="buy" onClick={() => setDepositOpen(true)}>Deposit</Button>
                            <Button variant="sell" onClick={() => setWithdrawOpen(true)}>Withdraw</Button>
                        </div>
                    </div>
                    {/* Rest of Wallet UI */}
                     <Card className="mb-6 bg-gradient-to-br from-sky-500 to-sky-700 text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sky-100 text-sm">Total Balance</p>
                                <p className="text-4xl font-bold">$377,500.00</p>
                            </div>
                        </div>
                    </Card>
                     <h2 className="text-xl font-bold text-slate-900 mb-4">Assets</h2>
                    <Card padding="p-0">
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3">Asset</th>
                                        <th className="px-6 py-3 text-right">Balance</th>
                                        <th className="px-6 py-3 text-right">Value (USD)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_ASSETS.map(asset => (
                                        <tr key={asset.symbol} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/70">
                                            <td className="px-6 py-4 font-medium text-slate-800">{asset.name} <span className="text-slate-500">{asset.symbol}</span></td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">{asset.balance}</td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">${asset.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
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
