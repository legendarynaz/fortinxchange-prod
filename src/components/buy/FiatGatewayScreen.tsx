import React, { useState } from 'react';
import { 
  CreditCard, 
  ChevronRight, 
  Shield, 
  Clock, 
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Info,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  Image,
  Wallet,
  BanknoteIcon
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { FEE_CONFIG, trackRevenueEvent } from '../../services/feeService';

interface FiatGatewayScreenProps {
  onBack: () => void;
  initialTab?: 'buy' | 'sell' | 'swap' | 'nft';
}

type TabType = 'buy' | 'sell' | 'swap' | 'nft';

interface Provider {
  id: 'moonpay' | 'transak' | 'simplex';
  name: string;
  logo: string;
  fee: string;
  methods: string[];
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  supported: boolean;
  supportsSell?: boolean;
  supportsSwap?: boolean;
  supportsNFT?: boolean;
}

const PROVIDERS: Provider[] = [
  {
    id: 'moonpay',
    name: 'MoonPay',
    logo: '🌙',
    fee: '1-4.5%',
    methods: ['Card', 'Bank', 'Apple Pay', 'Google Pay'],
    minAmount: 20,
    maxAmount: 50000,
    processingTime: '2-10 min',
    supported: true,
    supportsSell: true,
    supportsSwap: true,
    supportsNFT: true,
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
    supportsSell: true,
    supportsSwap: false,
    supportsNFT: false,
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
    supportsSell: false,
    supportsSwap: false,
    supportsNFT: false,
  },
];

const POPULAR_AMOUNTS = [50, 100, 250, 500, 1000];
const SELL_AMOUNTS = [25, 50, 100, 250, 500];

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'buy', label: 'Buy', icon: <ArrowDownToLine size={18} /> },
  { id: 'sell', label: 'Sell', icon: <ArrowUpFromLine size={18} /> },
  { id: 'swap', label: 'Swap', icon: <Repeat size={18} /> },
  { id: 'nft', label: 'NFT', icon: <Image size={18} /> },
];

const FiatGatewayScreen: React.FC<FiatGatewayScreenProps> = ({ onBack, initialTab = 'buy' }) => {
  const { activeAccount, chain, chainId } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [amount, setAmount] = useState('100');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState(chain.symbol);
  const [nftUrl, setNftUrl] = useState('');
  
  // Swap specific state
  const [fromCrypto, setFromCrypto] = useState(chain.symbol);
  const [toCrypto, setToCrypto] = useState('USDC');

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
  };

  const getFilteredProviders = () => {
    return PROVIDERS.filter(p => {
      if (activeTab === 'buy') return p.supported;
      if (activeTab === 'sell') return p.supportsSell;
      if (activeTab === 'swap') return p.supportsSwap;
      if (activeTab === 'nft') return p.supportsNFT;
      return false;
    });
  };

  const handleAction = () => {
    if (!selectedProvider || !activeAccount?.address) return;

    const amountNum = parseFloat(amount);
    const walletAddress = activeAccount.address;
    
    // Track the revenue event
    trackRevenueEvent({
      type: activeTab === 'nft' ? 'nft' : 'onramp',
      amount: amountNum * (FEE_CONFIG.ONRAMP_COMMISSION[selectedProvider.id] / 100),
      currency: 'USD',
      timestamp: Date.now(),
      userAddress: walletAddress,
      chainId,
    });

    let url = '';
    const apiKey = import.meta.env.VITE_MOONPAY_API_KEY || 'pk_test_example';
    
    switch (activeTab) {
      case 'buy':
        if (selectedProvider.id === 'moonpay') {
          url = `https://buy.moonpay.com/?apiKey=${apiKey}&currencyCode=${selectedCrypto.toLowerCase()}&walletAddress=${walletAddress}&baseCurrencyAmount=${amount}&colorCode=%23F0B90B`;
        } else if (selectedProvider.id === 'transak') {
          url = `https://global.transak.com/?apiKey=example&cryptoCurrencyCode=${selectedCrypto}&walletAddress=${walletAddress}&fiatAmount=${amount}&fiatCurrency=USD&themeColor=F0B90B`;
        } else {
          url = `https://simplex.com/widget?apiKey=example&crypto=${selectedCrypto}&address=${walletAddress}&fiat=USD&amount=${amount}`;
        }
        break;
        
      case 'sell':
        if (selectedProvider.id === 'moonpay') {
          url = `https://sell.moonpay.com/?apiKey=${apiKey}&baseCurrencyCode=${selectedCrypto.toLowerCase()}&refundWalletAddress=${walletAddress}&quoteCurrencyAmount=${amount}&colorCode=%23F0B90B`;
        } else if (selectedProvider.id === 'transak') {
          url = `https://global.transak.com/?apiKey=example&cryptoCurrencyCode=${selectedCrypto}&walletAddress=${walletAddress}&fiatAmount=${amount}&fiatCurrency=USD&productsAvailed=SELL`;
        }
        break;
        
      case 'swap':
        if (selectedProvider.id === 'moonpay') {
          url = `https://swap.moonpay.com/?apiKey=${apiKey}&baseCurrencyCode=${fromCrypto.toLowerCase()}&quoteCurrencyCode=${toCrypto.toLowerCase()}&walletAddress=${walletAddress}&baseCurrencyAmount=${amount}&colorCode=%23F0B90B`;
        }
        break;
        
      case 'nft':
        if (selectedProvider.id === 'moonpay' && nftUrl) {
          // MoonPay NFT Checkout - typically integrated via their SDK
          // For widget, you pass the NFT contract and token ID
          url = `https://buy-nft.moonpay.com/?apiKey=${apiKey}&walletAddress=${walletAddress}&contractAddress=${nftUrl}&colorCode=%23F0B90B`;
        }
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=500,height=700');
    }
  };

  const cryptoOptions = [
    { symbol: chain.symbol, name: chain.nativeCurrency.name },
    { symbol: 'USDT', name: 'Tether USD' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
  ];

  const getTabTitle = () => {
    switch (activeTab) {
      case 'buy': return 'Buy Crypto';
      case 'sell': return 'Sell Crypto';
      case 'swap': return 'Swap Crypto';
      case 'nft': return 'Buy NFT';
    }
  };

  const getButtonText = () => {
    if (!selectedProvider) return 'Select a provider';
    switch (activeTab) {
      case 'buy': return `Buy $${amount} of ${selectedCrypto}`;
      case 'sell': return `Sell ${amount} ${selectedCrypto}`;
      case 'swap': return `Swap ${amount} ${fromCrypto} → ${toCrypto}`;
      case 'nft': return 'Buy NFT with Card';
    }
  };

  const filteredProviders = getFilteredProviders();

  return (
    <div className="flex-1 bg-[#0D1117] overflow-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-[#0D1117] border-b border-gray-800 px-4 py-3 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-white">{getTabTitle()}</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#1A1A2E] rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedProvider(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#F0B90B] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Buy/Sell Amount Input */}
        {(activeTab === 'buy' || activeTab === 'sell') && (
          <>
            <div className="bg-[#1A1A2E] rounded-2xl p-4">
              <label className="text-gray-400 text-sm mb-2 block">
                {activeTab === 'buy' ? 'I want to spend' : 'I want to sell'}
              </label>
              <div className="flex items-center gap-3">
                {activeTab === 'buy' ? (
                  <DollarSign className="w-6 h-6 text-gray-500" />
                ) : (
                  <Wallet className="w-6 h-6 text-gray-500" />
                )}
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-3xl font-bold text-white outline-none"
                  placeholder="0"
                />
                <span className="text-gray-400 text-lg">
                  {activeTab === 'buy' ? 'USD' : selectedCrypto}
                </span>
              </div>
              
              {/* Quick amounts */}
              <div className="flex gap-2 mt-4">
                {(activeTab === 'buy' ? POPULAR_AMOUNTS : SELL_AMOUNTS).map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      amount === amt.toString()
                        ? 'bg-[#F0B90B] text-black'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {activeTab === 'buy' ? `$${amt}` : amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Crypto Selection */}
            <div className="bg-[#1A1A2E] rounded-2xl p-4">
              <label className="text-gray-400 text-sm mb-3 block">
                {activeTab === 'buy' ? 'I want to buy' : 'Crypto to sell'}
              </label>
              <div className="space-y-2">
                {cryptoOptions.slice(0, 4).map((crypto) => (
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
          </>
        )}

        {/* Swap Interface */}
        {activeTab === 'swap' && (
          <>
            <div className="bg-[#1A1A2E] rounded-2xl p-4">
              <label className="text-gray-400 text-sm mb-2 block">From</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-3xl font-bold text-white outline-none"
                  placeholder="0"
                />
                <select
                  value={fromCrypto}
                  onChange={(e) => setFromCrypto(e.target.value)}
                  className="bg-[#252542] text-white px-4 py-2 rounded-lg"
                >
                  {cryptoOptions.map((c) => (
                    <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => {
                  const temp = fromCrypto;
                  setFromCrypto(toCrypto);
                  setToCrypto(temp);
                }}
                className="p-3 bg-[#1A1A2E] rounded-full hover:bg-[#252542] transition-colors"
              >
                <Repeat className="w-5 h-5 text-[#F0B90B]" />
              </button>
            </div>

            <div className="bg-[#1A1A2E] rounded-2xl p-4">
              <label className="text-gray-400 text-sm mb-2 block">To</label>
              <div className="flex items-center gap-3">
                <p className="flex-1 text-3xl font-bold text-gray-500">~0.00</p>
                <select
                  value={toCrypto}
                  onChange={(e) => setToCrypto(e.target.value)}
                  className="bg-[#252542] text-white px-4 py-2 rounded-lg"
                >
                  {cryptoOptions.map((c) => (
                    <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-gray-400 text-sm">
                MoonPay Swap lets you exchange crypto using fiat payment rails. 
                For on-chain DEX swaps with better rates, use the Swap tab.
              </p>
            </div>
          </>
        )}

        {/* NFT Checkout */}
        {activeTab === 'nft' && (
          <>
            <div className="bg-[#1A1A2E] rounded-2xl p-4">
              <label className="text-gray-400 text-sm mb-2 block">NFT Contract Address or URL</label>
              <input
                type="text"
                value={nftUrl}
                onChange={(e) => setNftUrl(e.target.value)}
                className="w-full bg-[#252542] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#F0B90B]"
                placeholder="0x... or OpenSea URL"
              />
            </div>

            <div className="bg-[#1A1A2E] rounded-2xl p-6 text-center">
              <div className="w-20 h-20 bg-[#252542] rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Image className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-white font-medium mb-2">Buy NFTs with Card</p>
              <p className="text-gray-500 text-sm">
                Purchase NFTs directly with credit card, Apple Pay, or bank transfer. 
                No crypto required.
              </p>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <p className="text-purple-400 text-sm font-medium mb-1">Supported Marketplaces</p>
              <p className="text-gray-400 text-xs">
                OpenSea, Rarible, Magic Eden, and other MoonPay-integrated marketplaces.
              </p>
            </div>
          </>
        )}

        {/* Payment Providers */}
        <div>
          <h3 className="text-white font-medium mb-3">
            {activeTab === 'nft' ? 'Checkout Provider' : 'Select Provider'}
          </h3>
          
          {filteredProviders.length === 0 ? (
            <div className="bg-[#1A1A2E] rounded-2xl p-6 text-center">
              <p className="text-gray-400">No providers available for this feature yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider)}
                  className={`w-full p-4 rounded-2xl transition-all ${
                    selectedProvider?.id === provider.id
                      ? 'bg-[#1A1A2E] border-2 border-[#F0B90B]'
                      : 'bg-[#1A1A2E] border-2 border-transparent hover:border-gray-700'
                  }`}
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
          )}
        </div>

        {/* Info Banner */}
        {activeTab === 'sell' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex gap-3">
            <BanknoteIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 text-sm font-medium">Cash out to bank</p>
              <p className="text-gray-400 text-xs mt-1">
                Sell your crypto and receive funds directly to your bank account. 
                KYC verification required.
              </p>
            </div>
          </div>
        )}

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

      {/* Action Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-[#0D1117] to-transparent">
        <button
          onClick={handleAction}
          disabled={!selectedProvider || (activeTab !== 'nft' && (!amount || parseFloat(amount) < 10)) || (activeTab === 'nft' && !nftUrl)}
          className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/90 disabled:bg-gray-700 disabled:text-gray-400 text-black font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {getButtonText()}
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FiatGatewayScreen;
