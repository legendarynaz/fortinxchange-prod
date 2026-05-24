// Tron Service - Full Tron blockchain support for 4ortin-X Wallet
// Pure JS implementation for iOS/Android compatibility
import { ethers } from 'ethers';
import { sha256 } from '@noble/hashes/sha2.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { secp256k1 } from '@noble/curves/secp256k1';
import { base58 } from '@scure/base';

// TronGrid API (mainnet)
const TRONGRID_API = 'https://api.trongrid.io';

// Interfaces
export interface TronBalance {
  trx: number;
  trxFormatted: string;
  bandwidth: number;
  energy: number;
  tokens: TRC20Balance[];
}

export interface TRC20Balance {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
}

export interface TronTransaction {
  txID: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  amount: number;
  type: 'send' | 'receive';
  confirmed: boolean;
}

export interface TronUnsignedTx {
  txID: string;
  raw_data: any;
  raw_data_hex: string;
}

// Popular TRC20 tokens on Tron
export const TRON_TOKENS = [
  { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9', symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
  { address: 'THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  { address: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9', symbol: 'JST', name: 'JUST', decimals: 18 },
  { address: 'TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9', symbol: 'SUN', name: 'SUN Token', decimals: 18 },
  { address: 'TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4', symbol: 'BTT', name: 'BitTorrent', decimals: 18 },
  { address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7', symbol: 'WIN', name: 'WINkLink', decimals: 6 },
];

// Helper: Convert hex to bytes
const hexToBytes = (hex: string): Uint8Array => {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
};

// Helper: Bytes to hex
const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Helper: Create Tron address from public key
const publicKeyToTronAddress = (publicKey: Uint8Array): string => {
  // Remove the 04 prefix if present (uncompressed key marker)
  const pubKeyNoPrefix = publicKey.length === 65 ? publicKey.slice(1) : publicKey;
  
  // Keccak256 hash of public key
  const hash = keccak_256(pubKeyNoPrefix);
  
  // Take last 20 bytes
  const addressBytes = hash.slice(-20);
  
  // Add Tron prefix (0x41 for mainnet)
  const addressWithPrefix = new Uint8Array(21);
  addressWithPrefix[0] = 0x41;
  addressWithPrefix.set(addressBytes, 1);
  
  // Double SHA256 for checksum
  const hash1 = sha256(addressWithPrefix);
  const hash2 = sha256(hash1);
  const checksum = hash2.slice(0, 4);
  
  // Combine address with checksum
  const addressWithChecksum = new Uint8Array(25);
  addressWithChecksum.set(addressWithPrefix);
  addressWithChecksum.set(checksum, 21);
  
  // Base58 encode
  return base58.encode(addressWithChecksum);
};

// Helper: Tron address to hex (without 0x prefix, with 41 prefix)
const tronAddressToHex = (address: string): string => {
  const decoded = base58.decode(address);
  // Remove checksum (last 4 bytes)
  const addressBytes = decoded.slice(0, 21);
  return bytesToHex(addressBytes);
};

// Helper: Hex address to Tron address
const hexToTronAddress = (hex: string): string => {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const addressBytes = hexToBytes(cleanHex.startsWith('41') ? cleanHex : '41' + cleanHex);
  
  // Double SHA256 for checksum
  const hash1 = sha256(addressBytes);
  const hash2 = sha256(hash1);
  const checksum = hash2.slice(0, 4);
  
  // Combine
  const addressWithChecksum = new Uint8Array(25);
  addressWithChecksum.set(addressBytes);
  addressWithChecksum.set(checksum, 21);
  
  return base58.encode(addressWithChecksum);
};

// Validate Tron address
export const isValidTronAddress = (address: string): boolean => {
  try {
    if (!address.startsWith('T') || address.length !== 34) return false;
    
    const decoded = base58.decode(address);
    if (decoded.length !== 25) return false;
    if (decoded[0] !== 0x41) return false;
    
    // Verify checksum
    const addressBytes = decoded.slice(0, 21);
    const checksum = decoded.slice(21);
    const hash1 = sha256(addressBytes);
    const hash2 = sha256(hash1);
    const expectedChecksum = hash2.slice(0, 4);
    
    return checksum.every((b, i) => b === expectedChecksum[i]);
  } catch {
    return false;
  }
};

// Derive Tron address from mnemonic (BIP44: m/44'/195'/0'/0/0)
export const deriveTronAddress = (mnemonic: string, accountIndex: number = 0): {
  address: string;
  privateKey: string;
  publicKey: string;
} => {
  // Use ethers for HD derivation
  const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
  const seed = mnemonicObj.computeSeed();
  const seedBuffer = hexToBytes(seed);
  
  // BIP44 path for Tron: m/44'/195'/0'/0/accountIndex
  const masterNode = ethers.HDNodeWallet.fromSeed(seedBuffer);
  const path = `m/44'/195'/0'/0/${accountIndex}`;
  const child = masterNode.derivePath(path);
  
  // Get private key (remove 0x)
  const privateKey = child.privateKey.slice(2);
  
  // Derive uncompressed public key from private key
  const privKeyBytes = hexToBytes(privateKey);
  const pubKeyPoint = secp256k1.ProjectivePoint.fromPrivateKey(privKeyBytes);
  const publicKeyUncompressed = pubKeyPoint.toRawBytes(false); // false = uncompressed
  
  // Create Tron address
  const address = publicKeyToTronAddress(publicKeyUncompressed);
  
  return {
    address,
    privateKey,
    publicKey: bytesToHex(publicKeyUncompressed),
  };
};

// Get TRX balance
export const getTronBalance = async (address: string): Promise<TronBalance> => {
  try {
    const response = await fetch(`${TRONGRID_API}/v1/accounts/${address}`);
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return {
        trx: 0,
        trxFormatted: '0',
        bandwidth: 0,
        energy: 0,
        tokens: [],
      };
    }
    
    const account = data.data[0];
    const trxBalance = account.balance || 0;
    
    // Parse TRC20 tokens
    const tokens: TRC20Balance[] = [];
    if (account.trc20) {
      for (const entry of account.trc20) {
        // TronGrid returns either an object keyed by contract address OR a flat object with fields
        // Try flat object shape first: { contract_address, name, symbol, decimals, balance }
        let contractAddress = (entry.contract_address || entry.contractAddress) as string | undefined;
        let symbol = (entry.symbol as string | undefined) || undefined;
        let name = (entry.name as string | undefined) || undefined;
        let decimals: number | undefined = undefined;
        if (typeof entry.decimals === 'number') decimals = entry.decimals;
        if (typeof entry.decimals === 'string') {
          const parsed = parseInt(entry.decimals, 10);
          if (!Number.isNaN(parsed)) decimals = parsed;
        }
        let balance: string | undefined = (entry.balance as string | undefined);

        // If not present, fallback to legacy keyed format: { [contractAddress]: balance }
        if (!contractAddress) {
          const keys = Object.keys(entry);
          if (keys.length === 1) {
            contractAddress = keys[0];
            balance = entry[contractAddress] as string | undefined;
          }
        }

        if (!contractAddress || balance === undefined) continue;

        // Try to enrich from known token list if symbol/decimals missing
        const known = TRON_TOKENS.find(t => t.address === contractAddress);
        if (known) {
          symbol = symbol || known.symbol;
          name = name || known.name;
          decimals = decimals ?? known.decimals;
        }

        // As a last resort, assume 6 decimals when unknown
        const tokenDecimals = typeof decimals === 'number' && decimals >= 0 ? decimals : 6;

        // Compute formatted balance using BigInt math
        let formatted = '0';
        try {
          const amount = BigInt(balance);
          const divisor = (BigInt(10) ** BigInt(tokenDecimals));
          // Convert to Number only for display; very large numbers will be capped
          formatted = (Number(amount) / Number(divisor)).toString();
        } catch {
          formatted = '0';
        }

        tokens.push({
          contractAddress,
          symbol: symbol || contractAddress.slice(0, 4),
          name: name || 'TRC20 Token',
          decimals: tokenDecimals,
          balance: balance,
          balanceFormatted: formatted,
        });
      }
    }

    // Ensure popular TRC20 tokens (e.g., USDT) appear even with zero balance
    for (const t of TRON_TOKENS) {
      if (!tokens.find(tok => tok.contractAddress === t.address)) {
        tokens.push({
          contractAddress: t.address,
          symbol: t.symbol,
          name: t.name,
          decimals: t.decimals,
          balance: '0',
          balanceFormatted: '0',
        });
      }
    }
    
    return {
      trx: trxBalance,
      trxFormatted: (trxBalance / 1_000_000).toFixed(6),
      bandwidth: account.bandwidth?.freeNetUsed || 0,
      energy: account.account_resource?.energy_usage || 0,
      tokens,
    };
  } catch (error) {
    console.error('Failed to fetch Tron balance:', error);
    return {
      trx: 0,
      trxFormatted: '0',
      bandwidth: 0,
      energy: 0,
      tokens: [],
    };
  }
};

// Get TRX price
export const getTronPrice = async (): Promise<number> => {
  try {
    // Use our API proxy to avoid CORS issues
    const response = await fetch('/api/prices?ids=tron&vs_currencies=usd');
    const data = await response.json();
    return data.tron?.usd || 0;
  } catch (error) {
    console.error('Failed to fetch TRX price:', error);
    return 0;
  }
};

// Get transaction history
export const getTronTransactions = async (address: string): Promise<TronTransaction[]> => {
  try {
    const response = await fetch(
      `${TRONGRID_API}/v1/accounts/${address}/transactions?limit=50`
    );
    const data = await response.json();
    
    if (!data.data) return [];
    
    return data.data
      .filter((tx: any) => tx.raw_data?.contract?.[0]?.type === 'TransferContract')
      .map((tx: any) => {
        const contract = tx.raw_data.contract[0].parameter.value;
        const from = hexToTronAddress(contract.owner_address);
        const to = hexToTronAddress(contract.to_address);
        const amount = contract.amount || 0;
        
        return {
          txID: tx.txID,
          blockNumber: tx.blockNumber || 0,
          timestamp: tx.block_timestamp || 0,
          from,
          to,
          amount: amount / 1_000_000,
          type: from === address ? 'send' : 'receive',
          confirmed: tx.ret?.[0]?.contractRet === 'SUCCESS',
        };
      });
  } catch (error) {
    console.error('Failed to fetch Tron transactions:', error);
    return [];
  }
};

// Create unsigned TRX transfer transaction
const createTrxTransfer = async (
  fromAddress: string,
  toAddress: string,
  amountSun: number
): Promise<TronUnsignedTx> => {
  const response = await fetch(`${TRONGRID_API}/wallet/createtransaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_address: tronAddressToHex(fromAddress),
      to_address: tronAddressToHex(toAddress),
      amount: amountSun,
    }),
  });
  
  const data = await response.json();
  if (data.Error) throw new Error(data.Error);
  return data;
};

// Create unsigned TRC20 transfer transaction
const createTrc20Transfer = async (
  fromAddress: string,
  toAddress: string,
  contractAddress: string,
  amount: string,
  decimals: number
): Promise<TronUnsignedTx> => {
  // Convert amount to smallest unit
  const amountBigInt = BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)));
  
  // Encode transfer function call
  // transfer(address,uint256) = a9059cbb
  const toHex = tronAddressToHex(toAddress).slice(2).padStart(64, '0');
  const amountHex = amountBigInt.toString(16).padStart(64, '0');
  
  const response = await fetch(`${TRONGRID_API}/wallet/triggersmartcontract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_address: tronAddressToHex(fromAddress),
      contract_address: tronAddressToHex(contractAddress),
      function_selector: 'transfer(address,uint256)',
      parameter: toHex + amountHex,
      fee_limit: 100_000_000, // 100 TRX max fee
      call_value: 0,
    }),
  });
  
  const result = await response.json();
  if (!result.result?.result) {
    throw new Error(result.result?.message || 'Failed to create TRC20 transfer');
  }
  
  return result.transaction;
};

// Sign transaction
const signTransaction = (transaction: TronUnsignedTx, privateKey: string): string => {
  const txID = transaction.txID;
  const txIDBytes = hexToBytes(txID);
  
  // Sign with secp256k1
  const privKeyBytes = hexToBytes(privateKey);
  const signature = secp256k1.sign(txIDBytes, privKeyBytes);
  
  // Get r, s, v
  const r = signature.r.toString(16).padStart(64, '0');
  const s = signature.s.toString(16).padStart(64, '0');
  const v = (signature.recovery + 27).toString(16).padStart(2, '0');
  
  return r + s + v;
};

// Broadcast signed transaction
const broadcastTransaction = async (
  transaction: TronUnsignedTx,
  signature: string
): Promise<{ success: boolean; txid: string; message?: string }> => {
  const signedTx = {
    ...transaction,
    signature: [signature],
  };
  
  const response = await fetch(`${TRONGRID_API}/wallet/broadcasttransaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedTx),
  });
  
  const result = await response.json();
  
  if (result.result) {
    return { success: true, txid: result.txid || transaction.txID };
  } else {
    return { 
      success: false, 
      txid: '', 
      message: result.message || 'Broadcast failed' 
    };
  }
};

// Send TRX
export const sendTrx = async (
  mnemonic: string,
  toAddress: string,
  amountTrx: number,
  accountIndex: number = 0
): Promise<{ success: boolean; txid: string; message?: string }> => {
  try {
    // Validate address
    if (!isValidTronAddress(toAddress)) {
      return { success: false, txid: '', message: 'Invalid Tron address' };
    }
    
    // Derive keys
    const { address: fromAddress, privateKey } = deriveTronAddress(mnemonic, accountIndex);
    
    // Convert to SUN (1 TRX = 1,000,000 SUN)
    const amountSun = Math.floor(amountTrx * 1_000_000);
    
    // Create transaction
    const unsignedTx = await createTrxTransfer(fromAddress, toAddress, amountSun);
    
    // Sign transaction
    const signature = signTransaction(unsignedTx, privateKey);
    
    // Broadcast
    return await broadcastTransaction(unsignedTx, signature);
  } catch (error: any) {
    console.error('Failed to send TRX:', error);
    return { success: false, txid: '', message: error.message || 'Transaction failed' };
  }
};

// Send TRC20 token
export const sendTrc20 = async (
  mnemonic: string,
  toAddress: string,
  contractAddress: string,
  amount: string,
  decimals: number,
  accountIndex: number = 0
): Promise<{ success: boolean; txid: string; message?: string }> => {
  try {
    // Validate address
    if (!isValidTronAddress(toAddress)) {
      return { success: false, txid: '', message: 'Invalid Tron address' };
    }
    
    // Derive keys
    const { address: fromAddress, privateKey } = deriveTronAddress(mnemonic, accountIndex);
    
    // Create transaction
    const unsignedTx = await createTrc20Transfer(
      fromAddress,
      toAddress,
      contractAddress,
      amount,
      decimals
    );
    
    // Sign transaction
    const signature = signTransaction(unsignedTx, privateKey);
    
    // Broadcast
    return await broadcastTransaction(unsignedTx, signature);
  } catch (error: any) {
    console.error('Failed to send TRC20:', error);
    return { success: false, txid: '', message: error.message || 'Transaction failed' };
  }
};

// Estimate bandwidth needed for TRX transfer
export const estimateBandwidth = async (
  fromAddress: string,
  _toAddress: string,
  _amountTrx: number
): Promise<{ bandwidth: number; fee: number }> => {
  try {
    // A simple TRX transfer uses about 200-300 bandwidth
    // If no free bandwidth, 1 bandwidth = 1000 SUN = 0.001 TRX
    const bandwidthNeeded = 300;
    
    // Check account resources
    const response = await fetch(`${TRONGRID_API}/wallet/getaccountresource`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: tronAddressToHex(fromAddress),
      }),
    });
    
    const data = await response.json();
    const freeBandwidth = (data.freeNetLimit || 1500) - (data.freeNetUsed || 0);
    
    if (freeBandwidth >= bandwidthNeeded) {
      return { bandwidth: bandwidthNeeded, fee: 0 };
    } else {
      // Need to burn TRX for bandwidth
      const feeSun = bandwidthNeeded * 1000;
      return { bandwidth: bandwidthNeeded, fee: feeSun / 1_000_000 };
    }
  } catch (error) {
    console.error('Failed to estimate bandwidth:', error);
    return { bandwidth: 300, fee: 0.3 };
  }
};

// Get account resources (bandwidth, energy)
export const getAccountResources = async (address: string): Promise<{
  freeBandwidth: number;
  totalBandwidth: number;
  energy: number;
  totalEnergy: number;
}> => {
  try {
    const response = await fetch(`${TRONGRID_API}/wallet/getaccountresource`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: tronAddressToHex(address),
      }),
    });
    
    const data = await response.json();
    
    return {
      freeBandwidth: (data.freeNetLimit || 1500) - (data.freeNetUsed || 0),
      totalBandwidth: data.freeNetLimit || 1500,
      energy: (data.EnergyLimit || 0) - (data.EnergyUsed || 0),
      totalEnergy: data.EnergyLimit || 0,
    };
  } catch (error) {
    console.error('Failed to get account resources:', error);
    return { freeBandwidth: 0, totalBandwidth: 1500, energy: 0, totalEnergy: 0 };
  }
};
