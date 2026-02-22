import React, { useState } from 'react';
import { 
  CreditCard, 
  ChevronRight, 
  Shield, 
  Clock, 
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Info
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { FEE_CONFIG, trackRevenueEvent } from '../../services/feeService';

interface BuyCryptoScreenProps {
  onBack: () => void;
}

interface OnRampProvider {
  id: 'moonpay' | 'transak' | 'simplex';
  name: string;
  logo: string;
  fee: string;
  methods: string[];
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  supported: boolean;
}

const PROVIDERS: OnRampProvider[] = [
  {
    id: 'moonpay',
    name: 'MoonPay',
    logo: '🌙',
    fee: '3.5-4.5%',
    methods: ['Card', 'Bank', 'Apple Pay'],
    minAmount: 20,
    maxAmount: 50000,
    processingTime: '2-10 min',
    supported: true,
  },
  {
    id: 'transak',
    name: 'Transak',
    logo: '⚡',
    fee: '1-5%',
    methods: ['Card', 'Bank Transfer'],
    minAmount: 15,
    maxAmount: 25000,
    processingTime: '5-30 min',
    supported: true,
  },
  {
    id: 'simplex',
    name: 'Simplex',
    logo: '💳',
    fee: '3.5-5%',
    methods: ['Card'],
    minAmount: 50,
    maxAmount: 20000,
    processingTime: '10-30 min',
    supported: true,
  },
];

const POPULAR_AMOUNTS = [50, 100, 250, 500, 1000];

const BuyCryptoScreen: React.FC<BuyCryptoScreenProps> = ({ onBack }) => {
  const { activeAccount, chain, chainId } = useWallet();
  const [amount, setAmount] = useState('100');
  const [selectedProvider, setSelectedProvider] = useState<OnRampProvider | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState(chain.symbol);

  const handleProviderSelect = (provider: OnRampProvider) => {
    setSelectedProvider(provider);
  };

  const handleBuy = () => {
    if (!selectedProvider || !activeAccount?.address) return;

    const amountNum = parseFloat(amount);
    
    // Track the revenue event
    trackRevenueEvent({
      type: 'onramp',
      amount: amountNum * (FEE_CONFIG.ONRAMP_COMMISSION[selectedProvider.id] / 100),
      currency: 'USD',
      timestamp: Date.now(),
      userAddress: activeAccount.address,
      chainId,
    });

    // Build the on-ramp URL with parameters
    let url = '';
    const walletAddress = activeAccount.address;
    
    switch (selectedProvider.id) {
      case 'moonpay':
        url = `https://www.moonpay.com/buy?apiKey=pk_live_example&currencyCode=${selectedCrypto}&walletAddress=${walletAddress}&baseCurrencyAmount=${amount}`;
        break;
      case 'transak':
        url = `https://global.transak.com/?apiKey=example&cryptoCurrencyCode=${selectedCrypto}&walletAddress=${walletAddress}&fiatAmount=${amount}&fiatCurrency=USD`;
        break;
      case 'simplex':
        url = `https://simplex.com/widget?apiKey=example&crypto=${selectedCrypto}&address=${walletAddress}&fiat=USD&amount=${amount}`;
        break;
    }

    // Open in new window (in production, you'd use their SDK for a better UX)
    window.open(url, '_blank', 'width=500,height=700');
  };

  const cryptoOptions = [
    { symbol: chain.symbol, name: chain.nativeCurrency.name },
    { symbol: 'USDT', name: 'Tether USD' },
    { symbol: 'USDC', name: 'USD Coin' },
  ];

  return (
    <div className="flex-1 bg-[#0D1117] overflow-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-[#0D1117] border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-white">Buy Crypto</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Amount Input */}
        <div className="bg-[#1A1A2E] rounded-2xl p-4">
          <label className="text-gray-400 text-sm mb-2 block">I want to spend</label>
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-gray-500" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-3xl font-bold text-white outline-none"
              placeholder="0"
            />
            <span className="text-gray-400 text-lg">USD</span>
          </div>
          
          {/* Quick amounts */}
          <div className="flex gap-2 mt-4">
            {POPULAR_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  amount === amt.toString()
                    ? 'bg-[#F0B90B] text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Crypto Selection */}
        <div className="bg-[#1A1A2E] rounded-2xl p-4">
          <label className="text-gray-400 text-sm mb-3 block">I want to buy</label>
          <div className="space-y-2">
            {cryptoOptions.map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => setSelectedCrypto(crypto.symbol)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  selectedCrypto === crypto.symbol
                    ? 'bg-[#F0B90B]/10 border border-[#F0B90B]/30'
                    : 'bg-[#252542] hover:bg-[#2d2d5a]'
                }`}
              >
                <div className="w-10 h-10 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                  <span className="text-[#F0B90B] font-bold">{crypto.symbol.slice(0, 2)}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{crypto.symbol}</p>
                  <p className="text-gray-500 text-sm">{crypto.name}</p>
                </div>
                {selectedCrypto === crypto.symbol && (
                  <div className="w-5 h-5 bg-[#F0B90B] rounded-full flex items-center justify-center">
                    <span className="text-black text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Providers */}
        <div>
          <h3 className="text-white font-medium mb-3">Select Payment Provider</h3>
          <div className="space-y-3">
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderSelect(provider)}
                disabled={!provider.supported}
                className={`w-full p-4 rounded-2xl transition-all ${
                  selectedProvider?.id === provider.id
                    ? 'bg-[#1A1A2E] border-2 border-[#F0B90B]'
                    : 'bg-[#1A1A2E] border-2 border-transparent hover:border-gray-700'
                } ${!provider.supported ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#252542] rounded-xl flex items-center justify-center text-2xl">
                    {provider.logo}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{provider.name}</p>
                      {selectedProvider?.id === provider.id && (
                        <span className="text-[#F0B90B] text-xs bg-[#F0B90B]/10 px-2 py-0.5 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">
                      {provider.methods.join(' • ')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
                
                {/* Provider details */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-800">
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Fee</p>
                    <p className="text-white text-sm font-medium">{provider.fee}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Time</p>
                    <p className="text-white text-sm font-medium">{provider.processingTime}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Limit</p>
                    <p className="text-white text-sm font-medium">${provider.maxAmount.toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 text-sm font-medium">How it works</p>
            <p className="text-gray-400 text-xs mt-1">
              You'll be redirected to complete your purchase. The crypto will be sent directly to your 4ortin-X wallet address.
            </p>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-6 py-2">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Shield className="w-4 h-4" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Clock className="w-4 h-4" />
            <span>Fast</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <CreditCard className="w-4 h-4" />
            <span>Card & Bank</span>
          </div>
        </div>
      </div>

      {/* Buy Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-[#0D1117] to-transparent">
        <button
          onClick={handleBuy}
          disabled={!selectedProvider || !amount || parseFloat(amount) < 10}
          className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-400 text-black font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {selectedProvider ? (
            <>
              Buy ${amount} of {selectedCrypto}
              <ExternalLink className="w-4 h-4" />
            </>
          ) : (
            'Select a provider'
          )}
        </button>
      </div>
    </div>
  );
};

export default BuyCryptoScreen;
