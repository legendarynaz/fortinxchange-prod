// Bitcoin Service - Native Bitcoin support for 4ortin-X Wallet
// Uses Noble crypto and @scure/btc-signer (pure JS, no WASM - iOS/Android compatible)
import { ethers } from 'ethers';
import { sha256 } from '@noble/hashes/sha2.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { bech32, hex } from '@scure/base';
import * as btc from '@scure/btc-signer';

// Blockstream API for mainnet
const BLOCKSTREAM_API = 'https://blockstream.info/api';

export interface BitcoinBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
  totalBTC: string;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
    block_height?: number;
  };
}

export interface BitcoinTransaction {
  txid: string;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
  };
  fee: number;
  value: number;
}

// Helper: Convert bytes to bech32 address (Native SegWit P2WPKH)
const pubkeyToBech32Address = (pubkey: Uint8Array): string => {
  // Step 1: SHA256 of public key
  const sha256Hash = sha256(pubkey);
  
  // Step 2: RIPEMD160 of SHA256 hash (this is the "hash160")
  const hash160 = ripemd160(sha256Hash);
  
  // Step 3: Create witness program (version 0 + hash160)
  // For P2WPKH, witness version is 0
  const words = bech32.toWords(hash160);
  words.unshift(0); // Witness version 0
  
  // Step 4: Encode as bech32 with 'bc' prefix for mainnet
  return bech32.encode('bc', words);
};

// Helper: Convert hex string to Uint8Array
const hexToBytes = (hexStr: string): Uint8Array => {
  const cleanHex = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
};

// Derive Bitcoin address from mnemonic (BIP84 - Native SegWit) - SYNCHRONOUS
export const deriveBitcoinAddress = (mnemonic: string, accountIndex: number = 0): {
  address: string;
  publicKey: Uint8Array;
} => {
  // Use ethers to derive the key - all sync operations
  const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
  const seed = mnemonicObj.computeSeed();
  const seedBuffer = hexToBytes(seed);
  
  // BIP84 path: m/84'/0'/0'/0/accountIndex
  const masterNode = ethers.HDNodeWallet.fromSeed(seedBuffer);
  const path = `m/84'/0'/0'/0/${accountIndex}`;
  const child = masterNode.derivePath(path);
  
  // Get the compressed public key (33 bytes)
  const publicKey = hexToBytes(child.publicKey);
  
  // Create native SegWit (bech32) address
  const address = pubkeyToBech32Address(publicKey);
  
  return {
    address,
    publicKey,
  };
};

// Get Bitcoin balance from Blockstream API
export const getBitcoinBalance = async (address: string): Promise<BitcoinBalance> => {
  try {
    const response = await fetch(`${BLOCKSTREAM_API}/address/${address}`);
    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }
    
    const data = await response.json();
    const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    const unconfirmed = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
    const total = confirmed + unconfirmed;
    
    return {
      confirmed,
      unconfirmed,
      total,
      totalBTC: satoshiToBTC(total),
    };
  } catch (error) {
    console.error('Error fetching Bitcoin balance:', error);
    return {
      confirmed: 0,
      unconfirmed: 0,
      total: 0,
      totalBTC: '0',
    };
  }
};

// Get UTXOs for an address
export const getUTXOs = async (address: string): Promise<UTXO[]> => {
  try {
    const response = await fetch(`${BLOCKSTREAM_API}/address/${address}/utxo`);
    if (!response.ok) {
      throw new Error('Failed to fetch UTXOs');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching UTXOs:', error);
    return [];
  }
};

// Get transaction history
export const getBitcoinTransactions = async (address: string): Promise<BitcoinTransaction[]> => {
  try {
    const response = await fetch(`${BLOCKSTREAM_API}/address/${address}/txs`);
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    
    const txs = await response.json();
    
    return txs.slice(0, 50).map((tx: any) => {
      let received = 0;
      let sent = 0;
      
      tx.vout.forEach((output: any) => {
        if (output.scriptpubkey_address === address) {
          received += output.value;
        }
      });
      
      tx.vin.forEach((input: any) => {
        if (input.prevout?.scriptpubkey_address === address) {
          sent += input.prevout.value;
        }
      });
      
      return {
        txid: tx.txid,
        status: tx.status,
        fee: tx.fee,
        value: received - sent,
      };
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

// Get current fee rates (sat/vB)
export const getFeeRates = async (): Promise<{ fast: number; medium: number; slow: number }> => {
  try {
    const response = await fetch(`${BLOCKSTREAM_API}/fee-estimates`);
    if (!response.ok) {
      throw new Error('Failed to fetch fee rates');
    }
    
    const data = await response.json();
    return {
      fast: Math.ceil(data['1'] || 20),
      medium: Math.ceil(data['6'] || 10),
      slow: Math.ceil(data['144'] || 5),
    };
  } catch (error) {
    console.error('Error fetching fee rates:', error);
    return { fast: 20, medium: 10, slow: 5 };
  }
};

// Utility functions
export const satoshiToBTC = (satoshi: number): string => {
  return (satoshi / 100000000).toFixed(8);
};

export const btcToSatoshi = (btc: number): number => {
  return Math.round(btc * 100000000);
};

export const formatBTC = (satoshi: number): string => {
  const btc = satoshi / 100000000;
  if (btc === 0) return '0 BTC';
  if (btc < 0.00001) return `${satoshi} sats`;
  return `${btc.toFixed(8)} BTC`;
};

// Validate Bitcoin address
export const isValidBitcoinAddress = (address: string): boolean => {
  try {
    // Check bech32 addresses (bc1...)
    if (address.startsWith('bc1')) {
      const decoded = bech32.decode(address as `bc1${string}`);
      return decoded.prefix === 'bc' && decoded.words.length > 0;
    }
    // Check legacy addresses (1... or 3...)
    if (address.startsWith('1') || address.startsWith('3')) {
      return address.length >= 26 && address.length <= 35;
    }
    return false;
  } catch {
    return false;
  }
};

// Get Bitcoin price in USD
export const getBitcoinPrice = async (): Promise<number> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await response.json();
    return data.bitcoin?.usd || 0;
  } catch {
    // Fallback to Blockchain.info API
    try {
      const response = await fetch('https://blockchain.info/ticker');
      const data = await response.json();
      return data.USD?.last || 0;
    } catch {
      return 0;
    }
  }
};

// ============================================
// BITCOIN SENDING FUNCTIONALITY
// Pure JS - Compatible with iOS/Android
// ============================================

export interface BitcoinKeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  address: string;
}

export interface SendBitcoinParams {
  mnemonic: string;
  toAddress: string;
  amountSatoshi: number;
  feeRate: number; // sat/vB
}

export interface SendBitcoinResult {
  success: boolean;
  txid?: string;
  error?: string;
  fee?: number;
}

// Derive Bitcoin private key from mnemonic (BIP84 - Native SegWit)
export const deriveBitcoinKeyPair = async (mnemonic: string, accountIndex: number = 0): Promise<BitcoinKeyPair> => {
  console.log('[Bitcoin] Deriving key pair...');
  
  try {
    // Use ethers to derive the key
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const seed = mnemonicObj.computeSeed();
    const seedBuffer = new Uint8Array(Buffer.from(seed.slice(2), 'hex'));
    
    // BIP84 path: m/84'/0'/0'/0/accountIndex
    const masterNode = ethers.HDNodeWallet.fromSeed(seedBuffer);
    const path = `m/84'/0'/0'/0/${accountIndex}`;
    const child = masterNode.derivePath(path);
    
    // Get the private key (32 bytes)
    const privateKeyHex = child.privateKey.slice(2); // Remove '0x' prefix
    const privateKey = new Uint8Array(Buffer.from(privateKeyHex, 'hex'));
    
    // Get the compressed public key (33 bytes)
    const publicKeyHex = child.publicKey.slice(2); // Remove '0x' prefix
    const publicKey = new Uint8Array(Buffer.from(publicKeyHex, 'hex'));
    
    // Create native SegWit (bech32) address
    const address = pubkeyToBech32Address(publicKey);
    
    console.log('[Bitcoin] Key pair derived for address:', address);
    
    return {
      privateKey,
      publicKey,
      address,
    };
  } catch (error) {
    console.error('[Bitcoin] Error deriving key pair:', error);
    throw error;
  }
};

// Estimate transaction size for fee calculation
export const estimateTransactionSize = (inputCount: number, outputCount: number): number => {
  // P2WPKH transaction size estimation
  // Base: 10.5 vBytes (version + locktime + witness overhead)
  // Per input: 68 vBytes (outpoint + sequence + witness)
  // Per output: 31 vBytes (value + scriptPubKey)
  return Math.ceil(10.5 + (inputCount * 68) + (outputCount * 31));
};

// Select UTXOs for transaction (simple largest-first algorithm)
const selectUTXOs = (utxos: UTXO[], targetAmount: number, feeRate: number): { selected: UTXO[], fee: number } | null => {
  // Sort by value descending (use largest UTXOs first to minimize inputs)
  const sorted = [...utxos].sort((a, b) => b.value - a.value);
  
  const selected: UTXO[] = [];
  let totalInput = 0;
  
  for (const utxo of sorted) {
    selected.push(utxo);
    totalInput += utxo.value;
    
    // Estimate fee with current selection (2 outputs: recipient + change)
    const estimatedSize = estimateTransactionSize(selected.length, 2);
    const fee = estimatedSize * feeRate;
    
    // Check if we have enough (amount + fee)
    if (totalInput >= targetAmount + fee) {
      return { selected, fee };
    }
  }
  
  // Not enough funds
  return null;
};

// Get raw transaction hex for a UTXO
const getRawTransaction = async (txid: string): Promise<string> => {
  const response = await fetch(`${BLOCKSTREAM_API}/tx/${txid}/hex`);
  if (!response.ok) {
    throw new Error(`Failed to fetch raw transaction: ${txid}`);
  }
  return await response.text();
};

// Create and sign a Bitcoin transaction
export const createBitcoinTransaction = async (
  keyPair: BitcoinKeyPair,
  toAddress: string,
  amountSatoshi: number,
  feeRate: number
): Promise<{ txHex: string; fee: number }> => {
  console.log('[Bitcoin] Creating transaction...');
  console.log('[Bitcoin] To:', toAddress, 'Amount:', amountSatoshi, 'sats, Fee rate:', feeRate, 'sat/vB');
  
  // Validate recipient address
  if (!isValidBitcoinAddress(toAddress)) {
    throw new Error('Invalid recipient Bitcoin address');
  }
  
  // Get UTXOs
  const utxos = await getUTXOs(keyPair.address);
  if (utxos.length === 0) {
    throw new Error('No UTXOs available');
  }
  
  console.log('[Bitcoin] Found', utxos.length, 'UTXOs');
  
  // Select UTXOs
  const selection = selectUTXOs(utxos, amountSatoshi, feeRate);
  if (!selection) {
    throw new Error('Insufficient funds');
  }
  
  const { selected, fee } = selection;
  const totalInput = selected.reduce((sum, utxo) => sum + utxo.value, 0);
  const change = totalInput - amountSatoshi - fee;
  
  console.log('[Bitcoin] Selected', selected.length, 'UTXOs, total:', totalInput, 'sats');
  console.log('[Bitcoin] Fee:', fee, 'sats, Change:', change, 'sats');
  
  // Build transaction using @scure/btc-signer
  const tx = new btc.Transaction();
  
  // Add inputs
  for (const utxo of selected) {
    // Get the raw transaction to extract the witness UTXO
    const rawTxHex = await getRawTransaction(utxo.txid);
    const rawTx = btc.Transaction.fromRaw(hex.decode(rawTxHex));
    const prevOut = rawTx.getOutput(utxo.vout);
    
    if (!prevOut) {
      throw new Error(`Could not find output ${utxo.vout} in transaction ${utxo.txid}`);
    }
    
    tx.addInput({
      txid: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: prevOut.script!,
        amount: BigInt(utxo.value),
      },
    });
  }
  
  // Add recipient output
  tx.addOutputAddress(toAddress, BigInt(amountSatoshi));
  
  // Add change output if there's change
  if (change > 546) { // Dust limit
    tx.addOutputAddress(keyPair.address, BigInt(change));
  }
  
  // Sign all inputs
  for (let i = 0; i < selected.length; i++) {
    tx.signIdx(keyPair.privateKey, i);
  }
  
  // Finalize transaction
  tx.finalize();
  
  // Get hex
  const txHex = hex.encode(tx.extract());
  
  console.log('[Bitcoin] Transaction created, size:', txHex.length / 2, 'bytes');
  
  return { txHex, fee };
};

// Broadcast transaction to the Bitcoin network
export const broadcastTransaction = async (txHex: string): Promise<string> => {
  console.log('[Bitcoin] Broadcasting transaction...');
  
  const response = await fetch(`${BLOCKSTREAM_API}/tx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: txHex,
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('[Bitcoin] Broadcast failed:', error);
    throw new Error(`Broadcast failed: ${error}`);
  }
  
  const txid = await response.text();
  console.log('[Bitcoin] Transaction broadcast successful, txid:', txid);
  
  return txid;
};

// High-level function to send Bitcoin
export const sendBitcoin = async (params: SendBitcoinParams): Promise<SendBitcoinResult> => {
  try {
    console.log('[Bitcoin] Starting send...');
    
    // Derive key pair
    const keyPair = await deriveBitcoinKeyPair(params.mnemonic);
    
    // Create and sign transaction
    const { txHex, fee } = await createBitcoinTransaction(
      keyPair,
      params.toAddress,
      params.amountSatoshi,
      params.feeRate
    );
    
    // Broadcast
    const txid = await broadcastTransaction(txHex);
    
    return {
      success: true,
      txid,
      fee,
    };
  } catch (error) {
    console.error('[Bitcoin] Send failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Get maximum sendable amount (balance minus estimated fee)
export const getMaxSendableAmount = async (
  address: string,
  feeRate: number
): Promise<{ maxAmount: number; fee: number }> => {
  const utxos = await getUTXOs(address);
  if (utxos.length === 0) {
    return { maxAmount: 0, fee: 0 };
  }
  
  const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
  
  // Estimate fee for spending all UTXOs (1 output, no change)
  const estimatedSize = estimateTransactionSize(utxos.length, 1);
  const fee = estimatedSize * feeRate;
  
  const maxAmount = Math.max(0, totalBalance - fee);
  
  return { maxAmount, fee };
};
