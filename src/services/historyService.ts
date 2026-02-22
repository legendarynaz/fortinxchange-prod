// Transaction History Service - Fetch on-chain transaction history
import { ethers } from 'ethers';
import { CHAINS } from '../config/chains';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  gasUsed: string;
  gasPrice: string;
  timestamp: number;
  blockNumber: number;
  status: 'success' | 'failed' | 'pending';
  type: 'send' | 'receive' | 'swap' | 'approve' | 'contract';
  tokenSymbol?: string;
  tokenAmount?: string;
  tokenDecimals?: number;
  nonce: number;
}

// Explorer API endpoints
const EXPLORER_APIS: Record<number, { url: string; apiKey?: string }> = {
  1: { url: 'https://api.etherscan.io/api' },
  56: { url: 'https://api.bscscan.com/api' },
  137: { url: 'https://api.polygonscan.com/api' },
  42161: { url: 'https://api.arbiscan.io/api' },
  10: { url: 'https://api-optimistic.etherscan.io/api' },
  43114: { url: 'https://api.snowtrace.io/api' },
  250: { url: 'https://api.ftmscan.com/api' },
  8453: { url: 'https://api.basescan.org/api' },
};

// Get transaction history from explorer API
export const getTransactionHistory = async (
  address: string,
  chainId: number,
  page: number = 1,
  limit: number = 20
): Promise<Transaction[]> => {
  const explorer = EXPLORER_APIS[chainId];
  const chain = CHAINS[chainId];
  
  if (!chain) {
    return [];
  }

  // Try explorer API first
  if (explorer) {
    try {
      const transactions = await fetchFromExplorer(
        explorer.url,
        address,
        page,
        limit,
        chain.symbol,
        chain.decimals
      );
      return transactions;
    } catch (error) {
      console.error('Explorer API failed, falling back to RPC:', error);
    }
  }

  // Fallback to RPC (limited functionality)
  return await fetchFromRPC(address, chainId, limit);
};

// Fetch from block explorer API
const fetchFromExplorer = async (
  apiUrl: string,
  address: string,
  page: number,
  limit: number,
  symbol: string,
  decimals: number
): Promise<Transaction[]> => {
  const params = new URLSearchParams({
    module: 'account',
    action: 'txlist',
    address: address,
    startblock: '0',
    endblock: '99999999',
    page: page.toString(),
    offset: limit.toString(),
    sort: 'desc',
  });

  const response = await fetch(`${apiUrl}?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  const data = await response.json();
  
  if (data.status !== '1' || !Array.isArray(data.result)) {
    // No transactions or error
    return [];
  }

  return data.result.map((tx: any) => formatTransaction(tx, address, symbol, decimals));
};

// Format transaction from explorer API response
const formatTransaction = (
  tx: any,
  userAddress: string,
  symbol: string,
  decimals: number
): Transaction => {
  const isReceive = tx.to.toLowerCase() === userAddress.toLowerCase();
  const isContract = tx.input && tx.input !== '0x';
  const value = BigInt(tx.value || '0');
  
  let type: Transaction['type'] = 'send';
  if (isReceive) type = 'receive';
  if (isContract && !isReceive) {
    // Check if it's an approval or swap based on method signature
    const methodId = tx.input?.slice(0, 10);
    if (methodId === '0x095ea7b3') type = 'approve'; // approve(address,uint256)
    else if (methodId === '0x7ff36ab5' || methodId === '0x38ed1739') type = 'swap'; // swap methods
    else type = 'contract';
  }

  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    valueFormatted: ethers.formatUnits(value, decimals),
    gasUsed: tx.gasUsed || '0',
    gasPrice: tx.gasPrice || '0',
    timestamp: parseInt(tx.timeStamp) * 1000,
    blockNumber: parseInt(tx.blockNumber),
    status: tx.txreceipt_status === '1' ? 'success' : tx.txreceipt_status === '0' ? 'failed' : 'pending',
    type,
    tokenSymbol: symbol,
    nonce: parseInt(tx.nonce),
  };
};

// Fetch from RPC (fallback, limited)
const fetchFromRPC = async (
  address: string,
  chainId: number,
  limit: number
): Promise<Transaction[]> => {
  const chain = CHAINS[chainId];
  if (!chain) return [];

  try {
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const currentBlock = await provider.getBlockNumber();
    const transactions: Transaction[] = [];

    // Scan recent blocks (this is slow and limited)
    const blocksToScan = Math.min(100, limit * 10);
    
    for (let i = 0; i < blocksToScan && transactions.length < limit; i++) {
      const blockNumber = currentBlock - i;
      try {
        const block = await provider.getBlock(blockNumber, true);
        if (!block || !block.transactions) continue;

        for (const txHash of block.transactions) {
          if (typeof txHash === 'string') {
            const tx = await provider.getTransaction(txHash);
            if (!tx) continue;
            
            if (
              tx.from.toLowerCase() === address.toLowerCase() ||
              tx.to?.toLowerCase() === address.toLowerCase()
            ) {
              const receipt = await provider.getTransactionReceipt(txHash);
              
              transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to || '',
                value: tx.value.toString(),
                valueFormatted: ethers.formatUnits(tx.value, chain.decimals),
                gasUsed: receipt?.gasUsed.toString() || '0',
                gasPrice: tx.gasPrice?.toString() || '0',
                timestamp: block.timestamp * 1000,
                blockNumber: block.number,
                status: receipt?.status === 1 ? 'success' : 'failed',
                type: tx.to?.toLowerCase() === address.toLowerCase() ? 'receive' : 'send',
                tokenSymbol: chain.symbol,
                nonce: tx.nonce,
              });

              if (transactions.length >= limit) break;
            }
          }
        }
      } catch (e) {
        // Skip failed blocks
      }
    }

    return transactions;
  } catch (error) {
    console.error('RPC history fetch failed:', error);
    return [];
  }
};

// Get token transfer history (ERC-20)
export const getTokenTransferHistory = async (
  address: string,
  chainId: number,
  tokenAddress?: string,
  page: number = 1,
  limit: number = 20
): Promise<Transaction[]> => {
  const explorer = EXPLORER_APIS[chainId];
  
  if (!explorer) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address: address,
      startblock: '0',
      endblock: '99999999',
      page: page.toString(),
      offset: limit.toString(),
      sort: 'desc',
    });

    if (tokenAddress) {
      params.append('contractaddress', tokenAddress);
    }

    const response = await fetch(`${explorer.url}?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch token transfers');
    }

    const data = await response.json();
    
    if (data.status !== '1' || !Array.isArray(data.result)) {
      return [];
    }

    return data.result.map((tx: any) => formatTokenTransfer(tx, address));
  } catch (error) {
    console.error('Failed to fetch token transfers:', error);
    return [];
  }
};

// Format token transfer
const formatTokenTransfer = (tx: any, userAddress: string): Transaction => {
  const isReceive = tx.to.toLowerCase() === userAddress.toLowerCase();
  const decimals = parseInt(tx.tokenDecimal) || 18;
  const value = BigInt(tx.value || '0');

  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    valueFormatted: ethers.formatUnits(value, decimals),
    gasUsed: tx.gasUsed || '0',
    gasPrice: tx.gasPrice || '0',
    timestamp: parseInt(tx.timeStamp) * 1000,
    blockNumber: parseInt(tx.blockNumber),
    status: 'success',
    type: isReceive ? 'receive' : 'send',
    tokenSymbol: tx.tokenSymbol,
    tokenAmount: ethers.formatUnits(value, decimals),
    tokenDecimals: decimals,
    nonce: parseInt(tx.nonce),
  };
};

// Get combined history (native + tokens)
export const getCombinedHistory = async (
  address: string,
  chainId: number,
  page: number = 1,
  limit: number = 20
): Promise<Transaction[]> => {
  const [nativeTxs, tokenTxs] = await Promise.all([
    getTransactionHistory(address, chainId, page, limit),
    getTokenTransferHistory(address, chainId, undefined, page, limit),
  ]);

  // Combine and sort by timestamp
  const combined = [...nativeTxs, ...tokenTxs];
  combined.sort((a, b) => b.timestamp - a.timestamp);

  // Remove duplicates by hash
  const seen = new Set<string>();
  return combined.filter(tx => {
    if (seen.has(tx.hash)) return false;
    seen.add(tx.hash);
    return true;
  }).slice(0, limit);
};

// Format timestamp for display
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  // Less than 1 minute
  if (diff < 60000) return 'Just now';
  
  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  // Format as date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

// Get explorer URL for transaction
export const getExplorerTxUrl = (hash: string, chainId: number): string => {
  const chain = CHAINS[chainId];
  if (!chain) return '';
  return `${chain.explorerUrl}/tx/${hash}`;
};
