import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Loader2, Plus } from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../../context/WalletContext';
import { CHAINS } from '../../config/chains';

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenAdded: () => void;
}

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

const POPULAR_TOKENS: Record<number, TokenInfo[]> = {
  1: [ // Ethereum
    // Bitcoin
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', decimals: 8 },
    // Stablecoins
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x6B175474E89094C44Da98b954EescdeCB5066F65', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53', symbol: 'BUSD', name: 'Binance USD', decimals: 18 },
    // Major tokens
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
    { address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', symbol: 'MATIC', name: 'Polygon', decimals: 18 },
    { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', symbol: 'SHIB', name: 'Shiba Inu', decimals: 18 },
    { address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', symbol: 'PEPE', name: 'Pepe', decimals: 18 },
    { address: '0x853d955aCEf822Db058eb8505911ED77F175b99e', symbol: 'FRAX', name: 'Frax', decimals: 18 },
    { address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', symbol: 'stETH', name: 'Lido Staked ETH', decimals: 18 },
    { address: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704', symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', decimals: 18 },
    { address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', symbol: 'wstETH', name: 'Wrapped stETH', decimals: 18 },
    { address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32', symbol: 'LDO', name: 'Lido DAO', decimals: 18 },
    { address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72', symbol: 'ENS', name: 'Ethereum Name Service', decimals: 18 },
    { address: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2', symbol: 'SUSHI', name: 'SushiSwap', decimals: 18 },
    { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave', decimals: 18 },
    { address: '0xD533a949740bb3306d119CC777fa900bA034cd52', symbol: 'CRV', name: 'Curve DAO', decimals: 18 },
    { address: '0x4d224452801ACEd8B2F0aebE155379bb5D594381', symbol: 'APE', name: 'ApeCoin', decimals: 18 },
    { address: '0x111111111117dC0aa78b770fA6A738034120C302', symbol: '1INCH', name: '1inch', decimals: 18 },
  ],
  56: [ // BSC
    // Bitcoin
    { address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', symbol: 'BTCB', name: 'Bitcoin BEP20', decimals: 18 },
    // Stablecoins
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18 },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
    { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', name: 'Binance USD', decimals: 18 },
    { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    // Major tokens
    { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'ETH', name: 'Ethereum Token', decimals: 18 },
    { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', name: 'Wrapped BNB', decimals: 18 },
    { address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', symbol: 'CAKE', name: 'PancakeSwap', decimals: 18 },
    { address: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
    { address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94', symbol: 'LTC', name: 'Litecoin', decimals: 18 },
    { address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', symbol: 'XRP', name: 'XRP Token', decimals: 18 },
    { address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', symbol: 'ADA', name: 'Cardano', decimals: 18 },
    { address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402', symbol: 'DOT', name: 'Polkadot', decimals: 18 },
    { address: '0x8595F9dA7b868b1822194fAEd312235E43007b49', symbol: 'BTT', name: 'BitTorrent', decimals: 18 },
    { address: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D', symbol: 'SHIB', name: 'Shiba Inu', decimals: 18 },
    { address: '0xfb6115445Bff7b52FeB98650C87f44907E58f802', symbol: 'AAVE', name: 'Aave', decimals: 18 },
    { address: '0x1Fa4a73a3F0133f0025378af00236f3aBDEE5D63', symbol: 'NEAR', name: 'NEAR Protocol', decimals: 18 },
  ],
  137: [ // Polygon
    // Bitcoin
    { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    // Stablecoins
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', name: 'USD Coin (Native)', decimals: 6 },
    { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    // Major tokens
    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', symbol: 'WMATIC', name: 'Wrapped MATIC', decimals: 18 },
    { address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
    { address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', symbol: 'AAVE', name: 'Aave', decimals: 18 },
    { address: '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a', symbol: 'SUSHI', name: 'SushiSwap', decimals: 18 },
    { address: '0x172370d5Cd63279eFa6d502DAB29171933a610AF', symbol: 'CRV', name: 'Curve DAO', decimals: 18 },
    { address: '0x6f8a06447Ff6FcF75d803135a7de15CE88C1d4ec', symbol: 'SHIB', name: 'Shiba Inu', decimals: 18 },
    { address: '0xc26D47d5c33aC71AC5CF9F776D63Ba292a4F7842', symbol: 'SAND', name: 'The Sandbox', decimals: 18 },
    { address: '0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4', symbol: 'MANA', name: 'Decentraland', decimals: 18 },
  ],
  42161: [ // Arbitrum
    // Bitcoin
    { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    // Stablecoins
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', symbol: 'USDC.e', name: 'USD Coin (Bridged)', decimals: 6 },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    // Major tokens
    { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', name: 'Arbitrum', decimals: 18 },
    { address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
    { address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', symbol: 'GMX', name: 'GMX', decimals: 18 },
    { address: '0x6C2C06790b3E3E3c38e12Ee22F8183b37a13EE55', symbol: 'DPX', name: 'Dopex', decimals: 18 },
    { address: '0x539bdE0d7Dbd336b79148AA742883198BBF60342', symbol: 'MAGIC', name: 'Magic', decimals: 18 },
  ],
  10: [ // Optimism
    // Bitcoin
    { address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    // Stablecoins
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', symbol: 'USDC.e', name: 'USD Coin (Bridged)', decimals: 6 },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    // Major tokens
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x4200000000000000000000000000000000000042', symbol: 'OP', name: 'Optimism', decimals: 18 },
    { address: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0x9e1028F5F1D5eDE59748FFceE5532509976840E0', symbol: 'PERP', name: 'Perpetual Protocol', decimals: 18 },
    { address: '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9', symbol: 'sUSD', name: 'Synth sUSD', decimals: 18 },
  ],
  8453: [ // Base
    // Stablecoins
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    // Major tokens
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', decimals: 18 },
    { address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452', symbol: 'wstETH', name: 'Wrapped stETH', decimals: 18 },
    { address: '0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c', symbol: 'rETH', name: 'Rocket Pool ETH', decimals: 18 },
  ],
  43114: [ // Avalanche
    // Bitcoin
    { address: '0x50b7545627a5162F82A992c33b87aDc75187B218', symbol: 'WBTC.e', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x152b9d0FdC40C096757F570A51E494bd4b943E50', symbol: 'BTC.b', name: 'Bitcoin (Bridged)', decimals: 8 },
    // Stablecoins
    { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664', symbol: 'USDC.e', name: 'USD Coin (Bridged)', decimals: 6 },
    { address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', symbol: 'DAI.e', name: 'Dai Stablecoin', decimals: 18 },
    // Major tokens
    { address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', symbol: 'WETH.e', name: 'Wrapped Ether', decimals: 18 },
    { address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', symbol: 'WAVAX', name: 'Wrapped AVAX', decimals: 18 },
    { address: '0x5947BB275c521040051D82396192181b413227A3', symbol: 'LINK.e', name: 'Chainlink', decimals: 18 },
    { address: '0x63a72806098Bd3D9520cC43356dD78afe5D386D9', symbol: 'AAVE.e', name: 'Aave', decimals: 18 },
    { address: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd', symbol: 'JOE', name: 'Trader Joe', decimals: 18 },
  ],
  250: [ // Fantom
    // Bitcoin
    { address: '0x321162Cd933E2Be498Cd2267a90534A804051b11', symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
    // Stablecoins
    { address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', symbol: 'fUSDT', name: 'Frapped USDT', decimals: 6 },
    { address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    // Major tokens
    { address: '0x74b23882a30290451A17c44f4F05243b6b58C76d', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', symbol: 'WFTM', name: 'Wrapped Fantom', decimals: 18 },
    { address: '0xb3654dc3D10Ea7645f8319668E8F54d2574FBdC8', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0x6a07A792ab2965C72a5B8088d3a069A7aC3a993B', symbol: 'AAVE', name: 'Aave', decimals: 18 },
    { address: '0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC', symbol: 'SUSHI', name: 'SushiSwap', decimals: 18 },
  ],
  324: [ // zkSync Era
    // Stablecoins
    { address: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    // Major tokens
    { address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E', symbol: 'ZK', name: 'zkSync', decimals: 18 },
  ],
};

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

const CUSTOM_TOKENS_KEY = '4ortinx_custom_tokens';

const AddTokenModal: React.FC<AddTokenModalProps> = ({ isOpen, onClose, onTokenAdded }) => {
  const { chainId } = useWallet();
  const [contractAddress, setContractAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [success, setSuccess] = useState(false);

  const chain = CHAINS[chainId];
  const popularTokens = POPULAR_TOKENS[chainId] || [];

  const resetState = () => {
    setContractAddress('');
    setError('');
    setTokenInfo(null);
    setSuccess(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const fetchTokenInfo = async (address: string) => {
    if (!ethers.isAddress(address)) {
      setError('Invalid contract address');
      return;
    }

    setIsLoading(true);
    setError('');
    setTokenInfo(null);

    try {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      const contract = new ethers.Contract(address, ERC20_ABI, provider);

      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      setTokenInfo({
        address: address,
        name,
        symbol,
        decimals: Number(decimals),
      });
    } catch (err) {
      console.error('Failed to fetch token info:', err);
      setError('Could not find token. Make sure the address is correct and the token exists on ' + chain.name);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value.trim();
    setContractAddress(address);
    setError('');
    setTokenInfo(null);
    setSuccess(false);

    if (address.length === 42) {
      fetchTokenInfo(address);
    }
  };

  const saveToken = (token: TokenInfo) => {
    const stored = localStorage.getItem(CUSTOM_TOKENS_KEY);
    const tokens: Record<number, TokenInfo[]> = stored ? JSON.parse(stored) : {};
    
    if (!tokens[chainId]) {
      tokens[chainId] = [];
    }

    // Check if already exists
    if (tokens[chainId].some(t => t.address.toLowerCase() === token.address.toLowerCase())) {
      setError('Token already added');
      return false;
    }

    tokens[chainId].push(token);
    localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(tokens));
    return true;
  };

  const handleAddToken = () => {
    if (!tokenInfo) return;

    if (saveToken(tokenInfo)) {
      setSuccess(true);
      onTokenAdded();
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  };

  const handleAddPopularToken = (token: TokenInfo) => {
    if (saveToken(token)) {
      setSuccess(true);
      onTokenAdded();
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#1A1A2E] rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Add Token</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(85vh-60px)]">
          {/* Network indicator */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-[#252542] rounded-xl">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: chain.iconColor }}
            />
            <span className="text-gray-300 text-sm">Adding token on {chain.name}</span>
          </div>

          {/* Contract Address Input */}
          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">Token Contract Address</label>
            <div className="relative">
              <input
                type="text"
                value={contractAddress}
                onChange={handleAddressChange}
                placeholder="0x..."
                className="w-full bg-[#252542] text-white p-4 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-[#F0B90B] placeholder-gray-500"
              />
              {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-[#F0B90B] animate-spin" />
                </div>
              )}
              {tokenInfo && !isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-400 text-sm">Token added successfully!</p>
            </div>
          )}

          {/* Token Info Preview */}
          {tokenInfo && !success && (
            <div className="mb-6 p-4 bg-[#252542] rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                  <span className="text-[#F0B90B] font-bold">{tokenInfo.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{tokenInfo.symbol}</p>
                  <p className="text-gray-400 text-sm">{tokenInfo.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Decimals</p>
                  <p className="text-white">{tokenInfo.decimals}</p>
                </div>
                <div>
                  <p className="text-gray-500">Address</p>
                  <p className="text-white truncate">{tokenInfo.address.slice(0, 10)}...</p>
                </div>
              </div>
              
              <button
                onClick={handleAddToken}
                className="w-full mt-4 bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-black font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add {tokenInfo.symbol}
              </button>
            </div>
          )}

          {/* Popular Tokens */}
          {!tokenInfo && popularTokens.length > 0 && (
            <div>
              <h3 className="text-gray-400 text-sm mb-3">Popular Tokens</h3>
              <div className="space-y-2">
                {popularTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleAddPopularToken(token)}
                    className="w-full flex items-center gap-3 p-3 bg-[#252542] hover:bg-[#2d2d5a] rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#F0B90B]/20 rounded-full flex items-center justify-center">
                      <span className="text-[#F0B90B] font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{token.symbol}</p>
                      <p className="text-gray-500 text-sm">{token.name}</p>
                    </div>
                    <Plus className="w-5 h-5 text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTokenModal;
