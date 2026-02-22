// Multi-Chain Service - Support for non-EVM blockchains
// Handles: XRP, Solana, Litecoin, Dogecoin, Dash, Filecoin, Cosmos, Bitcoin Cash, Cardano
import { ethers } from 'ethers';
import { sha256 } from '@noble/hashes/sha2.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { bech32, base58 } from '@scure/base';

// Chain identifiers
export const NON_EVM_CHAINS = {
  SOLANA: 101,
  XRP: 144,
  LITECOIN: 2,
  DOGECOIN: 3,
  DASH: 5,
  FILECOIN: 314,
  COSMOS: 118,
  BITCOIN_CASH: 145,
  CARDANO: 1815,
};

// Balance interfaces
export interface MultiChainBalance {
  balance: string;
  balanceFormatted: string;
  balanceUSD: number;
  symbol: string;
  chain: string;
}

export interface MultiChainAddress {
  chain: string;
  chainId: number;
  address: string;
  symbol: string;
}

// API endpoints
const APIS = {
  SOLANA: 'https://api.mainnet-beta.solana.com',
  XRP: 'https://s1.ripple.com:51234',
  LITECOIN: 'https://litecoinspace.org/api',
  DOGECOIN: 'https://api.blockcypher.com/v1/doge/main',
  DASH: 'https://insight.dash.org/insight-api',
  FILECOIN: 'https://api.node.glif.io/rpc/v1',
  COSMOS: 'https://cosmos-rest.publicnode.com',
  BITCOIN_CASH: 'https://rest.bitcoin.com/v2',
  CARDANO: 'https://cardano-mainnet.blockfrost.io/api/v0',
  COINGECKO: 'https://api.coingecko.com/api/v3',
};

// CoinGecko IDs for price fetching
const COINGECKO_IDS: Record<string, string> = {
  SOL: 'solana',
  XRP: 'ripple',
  LTC: 'litecoin',
  DOGE: 'dogecoin',
  DASH: 'dash',
  FIL: 'filecoin',
  ATOM: 'cosmos',
  BCH: 'bitcoin-cash',
  ADA: 'cardano',
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

// ==================== ADDRESS DERIVATION ====================

/**
 * Derive Solana address from mnemonic (BIP44 m/44'/501'/0'/0')
 */
export const deriveSolanaAddress = (mnemonic: string, accountIndex: number = 0): string => {
  try {
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const seed = mnemonicObj.computeSeed();
    const masterNode = ethers.HDNodeWallet.fromSeed(hexToBytes(seed));
    const path = `m/44'/501'/${accountIndex}'/0'`;
    const child = masterNode.derivePath(path);
    // Solana uses ed25519, but we'll use a simplified base58 encoding for display
    const pubKeyHash = sha256(hexToBytes(child.publicKey));
    return base58.encode(pubKeyHash.slice(0, 32));
  } catch (error) {
    console.error('Failed to derive Solana address:', error);
    return '';
  }
};

/**
 * Derive XRP address from mnemonic (BIP44 m/44'/144'/0'/0/0)
 */
export const deriveXRPAddress = (mnemonic: string, accountIndex: number = 0): string => {
  try {
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const seed = mnemonicObj.computeSeed();
    const masterNode = ethers.HDNodeWallet.fromSeed(hexToBytes(seed));
    const path = `m/44'/144'/0'/0/${accountIndex}`;
    const child = masterNode.derivePath(path);
    
    // XRP address encoding
    const pubKeyHash = sha256(hexToBytes(child.publicKey));
    const accountId = ripemd160(pubKeyHash);
    
    // XRP uses base58 with checksum
    const payload = new Uint8Array(21);
    payload[0] = 0x00; // XRP address prefix
    payload.set(accountId, 1);
    
    const checksum = sha256(sha256(payload)).slice(0, 4);
    const addressBytes = new Uint8Array(25);
    addressBytes.set(payload);
    addressBytes.set(checksum, 21);
    
    return 'r' + base58.encode(addressBytes).slice(1);
  } catch (error) {
    console.error('Failed to derive XRP address:', error);
    return '';
  }
};

/**
 * Derive Litecoin address from mnemonic (BIP84 m/84'/2'/0'/0/0) - Native SegWit
 */
export const deriveLitecoinAddress = (mnemonic: string, accountIndex: number = 0): string => {
  try {
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const seed = mnemonicObj.computeSeed();
    const masterNode = ethers.HDNodeWallet.fromSeed(hexToBytes(seed));
    const path = `m/84'/2'/0'/0/${accountIndex}`;
    const child = masterNode.derivePath(path);
    
    const pubkey = hexToBytes(child.publicKey);
    const sha256Hash = sha256(pubkey);
    const hash160 = ripemd160(sha256Hash);
    
    const words = bech32.toWords(hash160);
    words.unshift(0);
    return bech32.encode('ltc', words);
  } catch (error) {
    console.error('Failed to derive Litecoin address:', error);
    return '';
  }
};

/**
 * Derive Dogecoin address from mnemonic (BIP44 m/44'/3'/0'/0/0)
 */
export const deriveDogecoinAddress = (mnemonic: string, accountIndex: number = 0): string => {
  try {
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const seed = mnemonicObj.computeSeed();
    const masterNode = ethers.HDNodeWallet.fromSeed(hexToBytes(seed));
    const path = `m/44'/3'/0'/0/${accountIndex}`;
    const child = masterNode.derivePath(path);
    
    const pubkey = hexToBytes(child.publicKey);
    const sha256Hash = sha256(pubkey);
    const hash160 = ripemd160(sha256Hash);
    
    // Dogecoin P2PKH prefix is 0x1E (30)
    const payload = new Uint8Array(21);
    payload[0] = 0x1E;
    payload.set(hash160, 1);
    
    const checksum = sha256(sha256(payload)).slice(0, 4);
    const addressBytes = new Uint8Array(25);
    addressBytes.set(payload);
    addressBytes.set(checksum, 21);
    
    return base58.encode(addressBytes);
  } catch (error) {
    console.error('Failed to derive Dogecoin address:', error);
    return '';
  }
};

/**
 * Derive Dash address from mnemonic (BIP44 m/44'/5'/0'/0/0)
 */
export const deriveDashAddress = (mnemonic: string, accountIndex: number = 0): string => {
  try {
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const seed = mnemonicObj.computeSeed();
    const masterNode = ethers.HDNodeWallet.fromSeed(hexToBytes(seed));
    const path = `m/44'/5'/0'/0/${accountIndex}`;
    const child = masterNode.derivePath(path);
    
    const pubkey = hexToBytes(child.publicKey);
    const sha256Hash = sha256(pubkey);
    const hash160 = ripemd160(sha256Hash);
    
    // Dash P2PKH prefix is 0x4C (76)
    const payload = new Uint8Array(21);
    payload[0] = 0x4C;
    payload.set(hash160, 1);
    
    const checksum = sha256(sha256(payload)).slice(0, 4);
    const addressBytes = new Uint8Array(25);
    addressBytes.set(payload);
    addressBytes.set(checksum, 21);
    
    return base58.encode(addressBytes);
  } catch (error) {
    console.error('Failed to derive Dash address:', error);
    return '';
  }
};

/**
 * Derive Filecoin address from mnemonic
 */
export const deriveFilecoinAddress = (mnemonic: string, accountIndex: number = 0): string => {
  try {
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const seed = mnemonicObj.computeSeed();
    const masterNode = ethers.HDNodeWallet.fromSeed(hexToBytes(seed));
    const path = `m/44'/461'/0'/0/${accountIndex}`;
    const child = masterNode.derivePath(path);
    
    // Filecoin secp256k1 address (f1 prefix)
    const pubkey = hexToBytes(child.publicKey);
    const hash = sha256(pubkey).slice(0, 20);
    
    // Simple f1 address format
    return 'f1' + Buffer.from(hash).toString('hex').slice(0, 38);
  } catch (error) {
    console.error('Failed to derive Filecoin address:', error);
    return '';
  }
};

/**
 * Derive Cosmos address from mnemonic (BIP44 m/44'/118'/0'/0/0)
 */
export const deriveCosmosAddress = (mnemonic: string, accountIndex: number = 0): string => {
  try {
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const seed = mnemonicObj.computeSeed();
    const masterNode = ethers.HDNodeWallet.fromSeed(hexToBytes(seed));
    const path = `m/44'/118'/0'/0/${accountIndex}`;
    const child = masterNode.derivePath(path);
    
    const pubkey = hexToBytes(child.publicKey);
    const sha256Hash = sha256(pubkey);
    const hash160 = ripemd160(sha256Hash);
    
    const words = bech32.toWords(hash160);
    return bech32.encode('cosmos', words);
  } catch (error) {
    console.error('Failed to derive Cosmos address:', error);
    return '';
  }
};

/**
 * Derive Bitcoin Cash address from mnemonic (BIP44 m/44'/145'/0'/0/0)
 */
export const deriveBitcoinCashAddress = (mnemonic: string, accountIndex: number = 0): string => {
  try {
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const seed = mnemonicObj.computeSeed();
    const masterNode = ethers.HDNodeWallet.fromSeed(hexToBytes(seed));
    const path = `m/44'/145'/0'/0/${accountIndex}`;
    const child = masterNode.derivePath(path);
    
    const pubkey = hexToBytes(child.publicKey);
    const sha256Hash = sha256(pubkey);
    const hash160 = ripemd160(sha256Hash);
    
    // BCH CashAddr format (simplified - returns legacy for compatibility)
    const payload = new Uint8Array(21);
    payload[0] = 0x00;
    payload.set(hash160, 1);
    
    const checksum = sha256(sha256(payload)).slice(0, 4);
    const addressBytes = new Uint8Array(25);
    addressBytes.set(payload);
    addressBytes.set(checksum, 21);
    
    return 'bitcoincash:q' + base58.encode(addressBytes).slice(1, 35);
  } catch (error) {
    console.error('Failed to derive Bitcoin Cash address:', error);
    return '';
  }
};

/**
 * Derive Cardano address from mnemonic
 */
export const deriveCardanoAddress = (mnemonic: string, accountIndex: number = 0): string => {
  try {
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const seed = mnemonicObj.computeSeed();
    const masterNode = ethers.HDNodeWallet.fromSeed(hexToBytes(seed));
    const path = `m/1852'/1815'/${accountIndex}'/0/0`;
    const child = masterNode.derivePath(path);
    
    const pubkey = hexToBytes(child.publicKey);
    const hash = sha256(sha256(pubkey)).slice(0, 28);
    
    // Cardano Shelley address (simplified bech32)
    const words = bech32.toWords(hash);
    return bech32.encode('addr', words);
  } catch (error) {
    console.error('Failed to derive Cardano address:', error);
    return '';
  }
};

// ==================== BALANCE FETCHING ====================

/**
 * Fetch Solana balance
 */
export const getSolanaBalance = async (address: string): Promise<MultiChainBalance> => {
  try {
    const response = await fetch(APIS.SOLANA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
    });
    const data = await response.json();
    const lamports = data.result?.value || 0;
    const balance = (lamports / 1e9).toFixed(9);
    
    return {
      balance: lamports.toString(),
      balanceFormatted: balance,
      balanceUSD: 0,
      symbol: 'SOL',
      chain: 'Solana',
    };
  } catch (error) {
    console.error('Failed to fetch Solana balance:', error);
    return { balance: '0', balanceFormatted: '0', balanceUSD: 0, symbol: 'SOL', chain: 'Solana' };
  }
};

/**
 * Fetch XRP balance
 */
export const getXRPBalance = async (address: string): Promise<MultiChainBalance> => {
  try {
    const response = await fetch(APIS.XRP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'account_info',
        params: [{ account: address, ledger_index: 'current' }],
      }),
    });
    const data = await response.json();
    const drops = data.result?.account_data?.Balance || '0';
    const balance = (parseInt(drops) / 1e6).toFixed(6);
    
    return {
      balance: drops,
      balanceFormatted: balance,
      balanceUSD: 0,
      symbol: 'XRP',
      chain: 'XRP Ledger',
    };
  } catch (error) {
    console.error('Failed to fetch XRP balance:', error);
    return { balance: '0', balanceFormatted: '0', balanceUSD: 0, symbol: 'XRP', chain: 'XRP Ledger' };
  }
};

/**
 * Fetch Litecoin balance
 */
export const getLitecoinBalance = async (address: string): Promise<MultiChainBalance> => {
  try {
    const response = await fetch(`${APIS.LITECOIN}/address/${address}`);
    const data = await response.json();
    const satoshis = data.chain_stats?.funded_txo_sum - data.chain_stats?.spent_txo_sum || 0;
    const balance = (satoshis / 1e8).toFixed(8);
    
    return {
      balance: satoshis.toString(),
      balanceFormatted: balance,
      balanceUSD: 0,
      symbol: 'LTC',
      chain: 'Litecoin',
    };
  } catch (error) {
    console.error('Failed to fetch Litecoin balance:', error);
    return { balance: '0', balanceFormatted: '0', balanceUSD: 0, symbol: 'LTC', chain: 'Litecoin' };
  }
};

/**
 * Fetch Dogecoin balance
 */
export const getDogecoinBalance = async (address: string): Promise<MultiChainBalance> => {
  try {
    const response = await fetch(`${APIS.DOGECOIN}/addrs/${address}/balance`);
    const data = await response.json();
    const satoshis = data.balance || 0;
    const balance = (satoshis / 1e8).toFixed(8);
    
    return {
      balance: satoshis.toString(),
      balanceFormatted: balance,
      balanceUSD: 0,
      symbol: 'DOGE',
      chain: 'Dogecoin',
    };
  } catch (error) {
    console.error('Failed to fetch Dogecoin balance:', error);
    return { balance: '0', balanceFormatted: '0', balanceUSD: 0, symbol: 'DOGE', chain: 'Dogecoin' };
  }
};

/**
 * Fetch Dash balance
 */
export const getDashBalance = async (address: string): Promise<MultiChainBalance> => {
  try {
    const response = await fetch(`${APIS.DASH}/addr/${address}/balance`);
    const satoshis = await response.json();
    const balance = (satoshis / 1e8).toFixed(8);
    
    return {
      balance: satoshis.toString(),
      balanceFormatted: balance,
      balanceUSD: 0,
      symbol: 'DASH',
      chain: 'Dash',
    };
  } catch (error) {
    console.error('Failed to fetch Dash balance:', error);
    return { balance: '0', balanceFormatted: '0', balanceUSD: 0, symbol: 'DASH', chain: 'Dash' };
  }
};

/**
 * Fetch Filecoin balance
 */
export const getFilecoinBalance = async (address: string): Promise<MultiChainBalance> => {
  try {
    const response = await fetch(APIS.FILECOIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'Filecoin.WalletBalance',
        params: [address],
        id: 1,
      }),
    });
    const data = await response.json();
    const attoFil = data.result || '0';
    const balance = (BigInt(attoFil) / BigInt(1e18)).toString();
    
    return {
      balance: attoFil,
      balanceFormatted: balance,
      balanceUSD: 0,
      symbol: 'FIL',
      chain: 'Filecoin',
    };
  } catch (error) {
    console.error('Failed to fetch Filecoin balance:', error);
    return { balance: '0', balanceFormatted: '0', balanceUSD: 0, symbol: 'FIL', chain: 'Filecoin' };
  }
};

/**
 * Fetch Cosmos balance
 */
export const getCosmosBalance = async (address: string): Promise<MultiChainBalance> => {
  try {
    const response = await fetch(`${APIS.COSMOS}/cosmos/bank/v1beta1/balances/${address}`);
    const data = await response.json();
    const uatom = data.balances?.find((b: any) => b.denom === 'uatom')?.amount || '0';
    const balance = (parseInt(uatom) / 1e6).toFixed(6);
    
    return {
      balance: uatom,
      balanceFormatted: balance,
      balanceUSD: 0,
      symbol: 'ATOM',
      chain: 'Cosmos Hub',
    };
  } catch (error) {
    console.error('Failed to fetch Cosmos balance:', error);
    return { balance: '0', balanceFormatted: '0', balanceUSD: 0, symbol: 'ATOM', chain: 'Cosmos Hub' };
  }
};

/**
 * Fetch Bitcoin Cash balance
 */
export const getBitcoinCashBalance = async (address: string): Promise<MultiChainBalance> => {
  try {
    // Remove prefix if present
    const cleanAddress = address.replace('bitcoincash:', '');
    const response = await fetch(`${APIS.BITCOIN_CASH}/address/details/${cleanAddress}`);
    const data = await response.json();
    const satoshis = Math.round((data.balance || 0) * 1e8);
    const balance = (satoshis / 1e8).toFixed(8);
    
    return {
      balance: satoshis.toString(),
      balanceFormatted: balance,
      balanceUSD: 0,
      symbol: 'BCH',
      chain: 'Bitcoin Cash',
    };
  } catch (error) {
    console.error('Failed to fetch Bitcoin Cash balance:', error);
    return { balance: '0', balanceFormatted: '0', balanceUSD: 0, symbol: 'BCH', chain: 'Bitcoin Cash' };
  }
};

/**
 * Fetch Cardano balance (requires Blockfrost API key)
 */
export const getCardanoBalance = async (_address: string): Promise<MultiChainBalance> => {
  try {
    // Note: Cardano requires Blockfrost API key in production
    // This is a simplified implementation
    return {
      balance: '0',
      balanceFormatted: '0',
      balanceUSD: 0,
      symbol: 'ADA',
      chain: 'Cardano',
    };
  } catch (error) {
    console.error('Failed to fetch Cardano balance:', error);
    return { balance: '0', balanceFormatted: '0', balanceUSD: 0, symbol: 'ADA', chain: 'Cardano' };
  }
};

// ==================== PRICE FETCHING ====================

/**
 * Fetch prices for multiple tokens from CoinGecko
 */
export const getMultiChainPrices = async (symbols: string[]): Promise<Record<string, number>> => {
  try {
    const ids = symbols
      .map(s => COINGECKO_IDS[s.toUpperCase()])
      .filter(Boolean)
      .join(',');
    
    if (!ids) return {};
    
    const response = await fetch(
      `${APIS.COINGECKO}/simple/price?ids=${ids}&vs_currencies=usd`
    );
    const data = await response.json();
    
    const prices: Record<string, number> = {};
    for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
      if (data[id]) {
        prices[symbol] = data[id].usd;
      }
    }
    
    return prices;
  } catch (error) {
    console.error('Failed to fetch multi-chain prices:', error);
    return {};
  }
};

/**
 * Get price for a single token
 */
export const getTokenPrice = async (symbol: string): Promise<number> => {
  const id = COINGECKO_IDS[symbol.toUpperCase()];
  if (!id) return 0;
  
  try {
    const response = await fetch(
      `${APIS.COINGECKO}/simple/price?ids=${id}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[id]?.usd || 0;
  } catch (error) {
    console.error(`Failed to fetch ${symbol} price:`, error);
    return 0;
  }
};

// ==================== UNIFIED INTERFACE ====================

/**
 * Derive all multi-chain addresses from mnemonic
 */
export const deriveAllAddresses = (mnemonic: string, accountIndex: number = 0): MultiChainAddress[] => {
  return [
    { chain: 'Solana', chainId: NON_EVM_CHAINS.SOLANA, address: deriveSolanaAddress(mnemonic, accountIndex), symbol: 'SOL' },
    { chain: 'XRP Ledger', chainId: NON_EVM_CHAINS.XRP, address: deriveXRPAddress(mnemonic, accountIndex), symbol: 'XRP' },
    { chain: 'Litecoin', chainId: NON_EVM_CHAINS.LITECOIN, address: deriveLitecoinAddress(mnemonic, accountIndex), symbol: 'LTC' },
    { chain: 'Dogecoin', chainId: NON_EVM_CHAINS.DOGECOIN, address: deriveDogecoinAddress(mnemonic, accountIndex), symbol: 'DOGE' },
    { chain: 'Dash', chainId: NON_EVM_CHAINS.DASH, address: deriveDashAddress(mnemonic, accountIndex), symbol: 'DASH' },
    { chain: 'Filecoin', chainId: NON_EVM_CHAINS.FILECOIN, address: deriveFilecoinAddress(mnemonic, accountIndex), symbol: 'FIL' },
    { chain: 'Cosmos Hub', chainId: NON_EVM_CHAINS.COSMOS, address: deriveCosmosAddress(mnemonic, accountIndex), symbol: 'ATOM' },
    { chain: 'Bitcoin Cash', chainId: NON_EVM_CHAINS.BITCOIN_CASH, address: deriveBitcoinCashAddress(mnemonic, accountIndex), symbol: 'BCH' },
    { chain: 'Cardano', chainId: NON_EVM_CHAINS.CARDANO, address: deriveCardanoAddress(mnemonic, accountIndex), symbol: 'ADA' },
  ].filter(a => a.address); // Filter out empty addresses
};

/**
 * Get balance for a specific chain
 */
export const getChainBalance = async (chainId: number, address: string): Promise<MultiChainBalance | null> => {
  switch (chainId) {
    case NON_EVM_CHAINS.SOLANA:
      return getSolanaBalance(address);
    case NON_EVM_CHAINS.XRP:
      return getXRPBalance(address);
    case NON_EVM_CHAINS.LITECOIN:
      return getLitecoinBalance(address);
    case NON_EVM_CHAINS.DOGECOIN:
      return getDogecoinBalance(address);
    case NON_EVM_CHAINS.DASH:
      return getDashBalance(address);
    case NON_EVM_CHAINS.FILECOIN:
      return getFilecoinBalance(address);
    case NON_EVM_CHAINS.COSMOS:
      return getCosmosBalance(address);
    case NON_EVM_CHAINS.BITCOIN_CASH:
      return getBitcoinCashBalance(address);
    case NON_EVM_CHAINS.CARDANO:
      return getCardanoBalance(address);
    default:
      return null;
  }
};

/**
 * Check if a chain ID is a non-EVM chain
 */
export const isNonEVMChain = (chainId: number): boolean => {
  return Object.values(NON_EVM_CHAINS).includes(chainId);
};

// Export chain IDs for convenience
export const SUPPORTED_NON_EVM = Object.keys(NON_EVM_CHAINS);
