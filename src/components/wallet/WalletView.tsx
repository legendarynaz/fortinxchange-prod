import React, { useState, useMemo, useEffect } from 'react';
import { useAccount, useBalance, useChainId, useReadContracts } from 'wagmi';
import { erc20Abi } from 'viem';
import { Loader2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Tabs } from '../ui/Tabs';
import WalletConnect from './WalletConnect';
import { CHAIN_NAMES, SUPPORTED_TOKENS } from '../../config/web3';
import { getBalances, isConfigured as isBinanceConfigured, type BinanceAccount } from '../../services/binanceService';
import type { BankAccount, AppConfig, User, Transaction } from '../../types';

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
    
    // Binance balances
    const [binanceBalances, setBinanceBalances] = useState<BinanceAccount[]>([]);
    const [isBinanceLoading, setIsBinanceLoading] = useState(false);
    const binanceConfigured = isBinanceConfigured();
    
    useEffect(() => {
        if (!binanceConfigured) return;
        
        const fetchBinanceBalances = async () => {
            setIsBinanceLoading(true);
            try {
                const balances = await getBalances();
                setBinanceBalances(balances);
            } catch (err) {
                console.error('Failed to fetch Binance balances:', err);
            }
            setIsBinanceLoading(false);
        };
        
        fetchBinanceBalances();
        const interval = setInterval(fetchBinanceBalances, 30000);
        return () => clearInterval(interval);
    }, [binanceConfigured]);
    
    // Calculate total USDT value from Binance
    const binanceTotalUSDT = useMemo(() => {
        const usdtAccount = binanceBalances.find(a => a.asset === 'USDT');
        return parseFloat(usdtAccount?.free || '0') + parseFloat(usdtAccount?.locked || '0');
    }, [binanceBalances]);
    
    // Web3 hooks
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { data: nativeBalance } = useBalance({ address });
    
    // Token balances for connected chain using ERC20 balanceOf
    const tokens = SUPPORTED_TOKENS[chainId] || [];
    
    const tokenContracts = useMemo(() => {
        if (!address || tokens.length === 0) return [];
        return tokens.map(token => ({
            address: token.address,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address],
        }));
    }, [address, tokens]);
    
    const { data: tokenBalanceResults } = useReadContracts({
        contracts: tokenContracts,
    });
    
    // Helper to format balance as string
    const formatBalance = (value: bigint, decimals: number, precision: number = 6) => {
        const divisor = BigInt(10 ** decimals);
        const intPart = value / divisor;
        const fracPart = value % divisor;
        const fracStr = fracPart.toString().padStart(decimals, '0').slice(0, precision);
        return `${intPart}.${fracStr}`;
    };
    
    // Combine token info with balance results
    const tokenBalances = useMemo(() => {
        if (!tokenBalanceResults) return [];
        return tokens.map((token, idx) => {
            const result = tokenBalanceResults[idx];
            if (result?.status !== 'success') return null;
            return {
                symbol: token.symbol,
                value: result.result as bigint,
                decimals: token.decimals,
            };
        }).filter(Boolean);
    }, [tokens, tokenBalanceResults]);
    
    // Assets list for withdraw modal
    const availableAssets = useMemo(() => {
        const assets: { symbol: string; name: string; balance: string }[] = [];
        if (nativeBalance) {
            assets.push({
                symbol: nativeBalance.symbol,
                name: nativeBalance.symbol,
                balance: formatBalance(nativeBalance.value, nativeBalance.decimals),
            });
        }
        tokenBalances.forEach(token => {
            if (token) {
                assets.push({
                    symbol: token.symbol,
                    name: token.symbol,
                    balance: formatBalance(token.value, token.decimals),
                });
            }
        });
        return assets.length > 0 ? assets : [{ symbol: 'ETH', name: 'Ethereum', balance: '0.00' }];
    }, [nativeBalance, tokenBalances]);
    
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
                onRequireKyc();
                setDepositOpen(false);
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Process via Coinbase or traditional flow
            if (depositAmount > appConfig.manualApprovalThreshold) {
                onAddTransaction({
                    userId: user.userId,
                    type: 'Deposit',
                    amount: depositAmount,
                    asset: 'USD',
                });
                setStatus({ type: 'pending', message: `Your deposit of $${depositAmount} is pending approval.` });
            } else {
                setStatus({ type: 'success', message: `Deposit of $${amount} initiated. It will appear in your balance shortly.` });
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
                onRequireKyc();
                setWithdrawOpen(false);
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));

            const asset = type === 'crypto' ? selectedAsset : 'USD';

            // Process withdrawal
            if (withdrawAmount > appConfig.manualApprovalThreshold) {
                onAddTransaction({
                    userId: user.userId,
                    type: 'Withdrawal',
                    amount: withdrawAmount,
                    asset: asset,
                });
                setStatus({ type: 'pending', message: `Your withdrawal of ${withdrawAmount} ${asset} is pending approval.` });
            } else {
                setStatus({ type: 'success', message: `Withdrawal of ${amount} ${asset} initiated. Check your wallet for confirmation.` });
            }
            setIsProcessing(false);
        };

        return (
            <div className="space-y-4">
                <Tabs tabs={[{id: 'crypto', label: 'Crypto'}, {id: 'fiat', label: 'Bank Transfer'}]} activeTab={type} onTabClick={(t) => setType(t as WithdrawType)} />
                {type === 'crypto' && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Select label="Asset" value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}>
                            {availableAssets.map(asset => <option key={asset.symbol} value={asset.symbol}>{asset.name} ({asset.symbol}) - {asset.balance}</option>)}
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
                    
                    {/* Binance Balance Card */}
                    {binanceConfigured && (
                        <Card className="mb-6 bg-gradient-to-br from-yellow-600 to-orange-700 text-white border-0">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-yellow-100 text-sm">Binance Balance</p>
                                    {isBinanceLoading ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Loading...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-4xl font-bold">
                                                {binanceTotalUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                                            </p>
                                            <p className="text-yellow-200 text-sm mt-1">
                                                {binanceBalances.length} assets in your Binance account
                                            </p>
                                        </>
                                    )}
                                </div>
                                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    LIVE
                                </div>
                            </div>
                        </Card>
                    )}
                    
                    {/* Binance Assets */}
                    {binanceConfigured && binanceBalances.length > 0 && (
                        <>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                Binance Assets
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">LIVE</span>
                            </h2>
                            <Card padding="p-0" className="bg-gray-800 border-gray-700 mb-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                                            <tr>
                                                <th className="px-6 py-3">Asset</th>
                                                <th className="px-6 py-3 text-right">Available</th>
                                                <th className="px-6 py-3 text-right">Locked</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {binanceBalances.map((balance) => (
                                                <tr key={balance.asset} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 font-medium text-white">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 font-bold text-xs">
                                                                {balance.asset.slice(0, 2)}
                                                            </span>
                                                            <div>{balance.asset}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-300">
                                                        {parseFloat(balance.free).toLocaleString('en-US', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 8,
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-500">
                                                        {parseFloat(balance.locked) > 0 
                                                            ? parseFloat(balance.locked).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
                                                            : '-'
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </>
                    )}
                    
                    {/* Web3 Wallet Assets */}
                    {isConnected && (
                        <>
                            <h2 className="text-xl font-bold text-white mb-4">Web3 Wallet Assets</h2>
                            <Card padding="p-0" className="bg-gray-800 border-gray-700 mb-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                                            <tr>
                                                <th className="px-6 py-3">Asset</th>
                                                <th className="px-6 py-3 text-right">Balance</th>
                                                <th className="px-6 py-3 text-right">Network</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Native Token */}
                                            {nativeBalance && (
                                                <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 font-medium text-white">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs">
                                                                {nativeBalance.symbol.slice(0, 2)}
                                                            </span>
                                                            {nativeBalance.symbol}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-300">
                                                        {formatBalance(nativeBalance.value, nativeBalance.decimals, 6)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-400 text-xs">
                                                        {CHAIN_NAMES[chainId] || 'Unknown'}
                                                    </td>
                                                </tr>
                                            )}
                                            {/* Token Balances */}
                                            {tokenBalances.map((token, idx) => token && (
                                                <tr key={idx} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 font-medium text-white">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold text-xs">
                                                                {token.symbol.slice(0, 2)}
                                                            </span>
                                                            {token.symbol}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-300">
                                                        {formatBalance(token.value, token.decimals, 6)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-400 text-xs">
                                                        {CHAIN_NAMES[chainId] || 'Unknown'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </>
                    )}
                    
                    {/* No wallets connected message */}
                    {!binanceConfigured && !isConnected && (
                        <Card className="bg-gray-800 border-gray-700">
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No Wallet Connected</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Connect your Web3 wallet or configure Coinbase API to view your balances
                                </p>
                                <p className="text-gray-500 text-xs">
                                    Set VITE_COINBASE_API_KEY and VITE_COINBASE_API_SECRET for Coinbase integration
                                </p>
                            </div>
                        </Card>
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
