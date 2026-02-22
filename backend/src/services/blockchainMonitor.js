const { ethers } = require('ethers');
const { run, get, query } = require('../db/database');

// RPC endpoints for each chain
const RPC_URLS = {
  1: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
  56: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
  137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  10: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  43114: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
  8453: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
};

// Chain names for display
const CHAIN_NAMES = {
  1: 'Ethereum',
  56: 'BNB Chain',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  43114: 'Avalanche',
  8453: 'Base',
};

// Native token symbols
const NATIVE_SYMBOLS = {
  1: 'ETH',
  56: 'BNB',
  137: 'MATIC',
  42161: 'ETH',
  10: 'ETH',
  43114: 'AVAX',
  8453: 'ETH',
};

// ERC20 ABI for balance checking
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

/**
 * Get provider for a specific chain
 */
const getProvider = (chainId) => {
  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) {
    throw new Error(`No RPC URL for chain ${chainId}`);
  }
  return new ethers.JsonRpcProvider(rpcUrl);
};

/**
 * Fetch native balance for the fee wallet on a specific chain
 */
const fetchNativeBalance = async (chainId) => {
  const feeWallet = process.env.FEE_WALLET_ADDRESS;
  if (!feeWallet) {
    console.warn('FEE_WALLET_ADDRESS not configured');
    return null;
  }

  try {
    const provider = getProvider(chainId);
    const balance = await provider.getBalance(feeWallet);
    const formatted = ethers.formatEther(balance);
    
    return {
      chainId,
      chainName: CHAIN_NAMES[chainId],
      tokenAddress: 'native',
      tokenSymbol: NATIVE_SYMBOLS[chainId],
      balance: formatted,
      balanceRaw: balance.toString(),
    };
  } catch (error) {
    console.error(`Error fetching balance for chain ${chainId}:`, error.message);
    return null;
  }
};

/**
 * Fetch ERC20 token balance
 */
const fetchTokenBalance = async (chainId, tokenAddress) => {
  const feeWallet = process.env.FEE_WALLET_ADDRESS;
  if (!feeWallet) return null;

  try {
    const provider = getProvider(chainId);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [balance, decimals, symbol] = await Promise.all([
      contract.balanceOf(feeWallet),
      contract.decimals(),
      contract.symbol(),
    ]);
    
    const formatted = ethers.formatUnits(balance, decimals);
    
    return {
      chainId,
      chainName: CHAIN_NAMES[chainId],
      tokenAddress,
      tokenSymbol: symbol,
      balance: formatted,
      balanceRaw: balance.toString(),
      decimals,
    };
  } catch (error) {
    console.error(`Error fetching token balance:`, error.message);
    return null;
  }
};

/**
 * Update wallet balance in database
 */
const updateBalance = (chainId, tokenAddress, tokenSymbol, balance, balanceUsd = null) => {
  run(`
    INSERT INTO wallet_balances (chain_id, token_address, token_symbol, balance, balance_usd, last_updated)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(chain_id, token_address) DO UPDATE SET
      balance = ?,
      balance_usd = COALESCE(?, balance_usd),
      last_updated = CURRENT_TIMESTAMP
  `, [chainId, tokenAddress, tokenSymbol, balance, balanceUsd, balance, balanceUsd]);
};

/**
 * Fetch all native balances across chains
 */
const fetchAllNativeBalances = async () => {
  const chainIds = Object.keys(RPC_URLS).map(Number);
  const results = await Promise.allSettled(
    chainIds.map(chainId => fetchNativeBalance(chainId))
  );
  
  const balances = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      balances.push(result.value);
      updateBalance(
        result.value.chainId,
        'native',
        result.value.tokenSymbol,
        result.value.balance
      );
    }
  }
  
  return balances;
};

/**
 * Get stored balances from database
 */
const getStoredBalances = () => {
  return query(`
    SELECT * FROM wallet_balances
    ORDER BY balance_usd DESC NULLS LAST, chain_id
  `);
};

/**
 * Start monitoring interval
 */
let monitorInterval = null;

const startMonitoring = (intervalMs = 5 * 60 * 1000) => { // Default: 5 minutes
  if (monitorInterval) {
    console.log('Monitor already running');
    return;
  }

  console.log(`Starting blockchain monitor (interval: ${intervalMs}ms)`);
  
  // Initial fetch
  fetchAllNativeBalances()
    .then(balances => console.log(`Fetched ${balances.length} balances`))
    .catch(err => console.error('Initial balance fetch error:', err));
  
  // Set interval
  monitorInterval = setInterval(async () => {
    try {
      await fetchAllNativeBalances();
      console.log(`Balance update completed at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Balance update error:', error);
    }
  }, intervalMs);
};

const stopMonitoring = () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('Blockchain monitor stopped');
  }
};

module.exports = {
  getProvider,
  fetchNativeBalance,
  fetchTokenBalance,
  fetchAllNativeBalances,
  getStoredBalances,
  updateBalance,
  startMonitoring,
  stopMonitoring,
  CHAIN_NAMES,
  NATIVE_SYMBOLS,
};
