// 4ortin-X Wallet Service - HD Wallet Generation and Management
// Supports multi-chain derivation: ETH/EVM, BTC, TRON
import { ethers } from 'ethers';
import { sha256 } from '@noble/hashes/sha2.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { secp256k1 } from '@noble/curves/secp256k1';
import { bech32, base58 } from '@scure/base';
import { CHAINS, DEFAULT_CHAIN_ID } from '../config/chains';
import { DERIVATION_PATHS, getChain } from '../domain/registry';
import type { ChainAddress, AccountType } from '../domain/types';

// ============================================================================
// Interfaces
// ============================================================================

export interface WalletAccount {
  id: string;                    // UUID
  address: string;               // Primary EVM address (for backwards compat)
  name: string;
  index: number;
  type: AccountType;
  chainAddresses: ChainAddress[];// Multi-chain addresses
}

export interface StoredWallet {
  id: string;
  encryptedMnemonic: string;
  accounts: WalletAccount[];
  activeAccountIndex: number;
  createdAt: number;
  backedUp: boolean;
  version: number;               // For migrations
}

const WALLET_STORAGE_KEY = 'x4ortinx_wallet';
const WALLET_LOCK_KEY = 'x4ortinx_locked';
const WALLET_VERSION = 2;

// Simple encryption for demo - in production use proper encryption with user PIN/biometrics
const encrypt = (data: string, password: string): string => {
  // In production, use proper AES encryption
  // For now, base64 encode with a simple XOR
  const encoded = btoa(data);
  let result = '';
  for (let i = 0; i < encoded.length; i++) {
    result += String.fromCharCode(encoded.charCodeAt(i) ^ password.charCodeAt(i % password.length));
  }
  return btoa(result);
};

const decrypt = (encrypted: string, password: string): string => {
  try {
    const decoded = atob(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length));
    }
    return atob(result);
  } catch {
    throw new Error('Invalid password');
  }
};

// ============================================================================
// Helper Functions for Multi-Chain Address Derivation
// ============================================================================

const hexToBytes = (hex: string): Uint8Array => {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
};

// Bitcoin:
const pubkeyToBech32Address = (pubkey: Uint8Array): string => {
  const sha256Hash = sha256(pubkey);
  const hash160 = ripemd160(sha256Hash);
  const words = bech32.toWords(hash160);
  words.unshift(0); // Witness version 0
  return bech32.encode('bc', words);
};

// TRON: Address from public key
const publicKeyToTronAddress = (publicKey: Uint8Array): string => {
  const pubKeyNoPrefix = publicKey.length === 65 ? publicKey.slice(1) : publicKey;
  const hash = keccak_256(pubKeyNoPrefix);
  const addressBytes = hash.slice(-20);
  
  const addressWithPrefix = new Uint8Array(21);
  addressWithPrefix[0] = 0x41; // Tron mainnet prefix
  addressWithPrefix.set(addressBytes, 1);
  
  const hash1 = sha256(addressWithPrefix);
  const hash2 = sha256(hash1);
  const checksum = hash2.slice(0, 4);
  
  const addressWithChecksum = new Uint8Array(25);
  addressWithChecksum.set(addressWithPrefix);
  addressWithChecksum.set(checksum, 21);
  
  return base58.encode(addressWithChecksum);
};

// ============================================================================
// Multi-Chain Address Derivation
// ============================================================================

export interface DerivedAddresses {
  ethereum: string;  // Also used for all EVM chains
  bitcoin: string;   // Native SegWit (bc1...)
  tron: string;      // T...
}

// Derive addresses for all supported chain types from mnemonic
export const deriveMultiChainAddresses = (mnemonic: string, accountIndex: number = 0): DerivedAddresses => {
  const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
  const seed = mnemonicObj.computeSeed();
  const seedBytes = hexToBytes(seed);
  const masterNode = ethers.HDNodeWallet.fromSeed(seedBytes);
  
  // Ethereum/EVM: m/44'/60'/0'/0/index
  const ethPath = `${DERIVATION_PATHS.ethereum}/${accountIndex}`;
  const ethChild = masterNode.derivePath(ethPath);
  const ethereumAddress = ethChild.address;
  
  // Bitcoin: m/84'/0'/0'/0/index (Native SegWit)
  const btcPath = `${DERIVATION_PATHS.bitcoin}/${accountIndex}`;
  const btcChild = masterNode.derivePath(btcPath);
  const btcPubKey = hexToBytes(btcChild.publicKey);
  const bitcoinAddress = pubkeyToBech32Address(btcPubKey);
  
  // TRON: m/44'/195'/0'/0/index
  const tronPath = `${DERIVATION_PATHS.tron}/${accountIndex}`;
  const tronChild = masterNode.derivePath(tronPath);
  const tronPrivKey = hexToBytes(tronChild.privateKey);
  const tronPubKeyPoint = secp256k1.ProjectivePoint.fromPrivateKey(tronPrivKey);
  const tronPubKeyUncompressed = tronPubKeyPoint.toRawBytes(false);
  const tronAddress = publicKeyToTronAddress(tronPubKeyUncompressed);
  
  return {
    ethereum: ethereumAddress,
    bitcoin: bitcoinAddress,
    tron: tronAddress,
  };
};

// Get chain-specific address for a given chain ID
export const getAddressForChain = (mnemonic: string, chainId: string, accountIndex: number = 0): string => {
  const chain = getChain(chainId);
  if (!chain) throw new Error(`Unknown chain: ${chainId}`);
  
  const addresses = deriveMultiChainAddresses(mnemonic, accountIndex);
  
  switch (chain.type) {
    case 'btc':
      return addresses.bitcoin;
    case 'tron':
      return addresses.tron;
    case 'evm':
    default:
      return addresses.ethereum;
  }
};

// Build ChainAddress array for an account
export const buildChainAddresses = (mnemonic: string, accountIndex: number = 0): ChainAddress[] => {
  const addresses = deriveMultiChainAddresses(mnemonic, accountIndex);
  
  return [
    // EVM chains all share the same address
    { chainId: 'ethereum', address: addresses.ethereum, derivationPath: `${DERIVATION_PATHS.ethereum}/${accountIndex}` },
    { chainId: 'bsc', address: addresses.ethereum, derivationPath: `${DERIVATION_PATHS.ethereum}/${accountIndex}` },
    { chainId: 'polygon', address: addresses.ethereum, derivationPath: `${DERIVATION_PATHS.ethereum}/${accountIndex}` },
    { chainId: 'arbitrum', address: addresses.ethereum, derivationPath: `${DERIVATION_PATHS.ethereum}/${accountIndex}` },
    { chainId: 'optimism', address: addresses.ethereum, derivationPath: `${DERIVATION_PATHS.ethereum}/${accountIndex}` },
    { chainId: 'avalanche', address: addresses.ethereum, derivationPath: `${DERIVATION_PATHS.ethereum}/${accountIndex}` },
    { chainId: 'base', address: addresses.ethereum, derivationPath: `${DERIVATION_PATHS.ethereum}/${accountIndex}` },
    // Bitcoin
    { chainId: 'bitcoin', address: addresses.bitcoin, derivationPath: `${DERIVATION_PATHS.bitcoin}/${accountIndex}` },
    // TRON
    { chainId: 'tron', address: addresses.tron, derivationPath: `${DERIVATION_PATHS.tron}/${accountIndex}` },
  ];
};

// ============================================================================
// Mnemonic Generation and Validation
// ============================================================================

// Generate a new mnemonic phrase using ethers.js
export const generateMnemonic = (_wordCount: 12 | 24 = 12): string => {
  // ethers.js Wallet.createRandom generates a 12-word mnemonic by default
  // Note: _wordCount is kept for API compatibility but ethers.js only supports 12 words
  const wallet = ethers.Wallet.createRandom();
  if (wallet.mnemonic) {
    return wallet.mnemonic.phrase;
  }
  throw new Error('Failed to generate mnemonic');
};

// Validate a mnemonic phrase using ethers.js
export const validateMnemonic = (mnemonic: string): boolean => {
  try {
    const normalized = mnemonic.trim().toLowerCase();
    ethers.Mnemonic.fromPhrase(normalized);
    return true;
  } catch {
    return false;
  }
};

// Derive wallet from mnemonic
export const deriveWallet = (mnemonic: string, accountIndex: number = 0): ethers.HDNodeWallet => {
  // BIP-44 path: m/44'/60'/0'/0/index
  const path = `m/44'/60'/0'/0/${accountIndex}`;
  // Use fromPhrase with the full path to derive directly
  return ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);
};

// Get wallet address from mnemonic
export const getAddressFromMnemonic = (mnemonic: string, accountIndex: number = 0): string => {
  const wallet = deriveWallet(mnemonic, accountIndex);
  return wallet.address;
};

// Create and store a new wallet with multi-chain addresses
export const createWallet = async (
  mnemonic: string,
  password: string,
  walletName: string = 'Main Wallet'
): Promise<StoredWallet> => {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  const addresses = deriveMultiChainAddresses(mnemonic, 0);
  const chainAddresses = buildChainAddresses(mnemonic, 0);
  
  const storedWallet: StoredWallet = {
    id: crypto.randomUUID(),
    encryptedMnemonic: encrypt(mnemonic, password),
    accounts: [{
      id: crypto.randomUUID(),
      address: addresses.ethereum, // Primary address for backwards compat
      name: walletName,
      index: 0,
      type: 'software',
      chainAddresses,
    }],
    activeAccountIndex: 0,
    createdAt: Date.now(),
    backedUp: false,
    version: WALLET_VERSION,
  };

  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(storedWallet));
  localStorage.removeItem(WALLET_LOCK_KEY);
  
  return storedWallet;
};

// Load wallet from storage
export const loadWallet = (): StoredWallet | null => {
  const stored = localStorage.getItem(WALLET_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as StoredWallet;
  } catch {
    return null;
  }
};

// Check if wallet exists
export const hasWallet = (): boolean => {
  return localStorage.getItem(WALLET_STORAGE_KEY) !== null;
};

// Check if wallet is locked
export const isWalletLocked = (): boolean => {
  return localStorage.getItem(WALLET_LOCK_KEY) === 'true';
};

// Lock wallet
export const lockWallet = (): void => {
  localStorage.setItem(WALLET_LOCK_KEY, 'true');
};

// Unlock wallet and get mnemonic
export const unlockWallet = (password: string): string => {
  const wallet = loadWallet();
  if (!wallet) throw new Error('No wallet found');
  
  const mnemonic = decrypt(wallet.encryptedMnemonic, password);
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid password');
  }
  
  localStorage.removeItem(WALLET_LOCK_KEY);
  return mnemonic;
};

// Get signer for transactions
export const getSigner = (
  mnemonic: string,
  chainId: number = DEFAULT_CHAIN_ID,
  accountIndex: number = 0
): ethers.HDNodeWallet => {
  const wallet = deriveWallet(mnemonic, accountIndex);
  const chain = CHAINS[chainId];
  
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);
  
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  return wallet.connect(provider);
};

// Get provider for a chain
export const getProvider = (chainId: number): ethers.JsonRpcProvider => {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);
  return new ethers.JsonRpcProvider(chain.rpcUrl);
};

// Add new account to wallet with multi-chain addresses
export const addAccount = async (
  password: string,
  accountName: string
): Promise<WalletAccount> => {
  const wallet = loadWallet();
  if (!wallet) throw new Error('No wallet found');
  
  const mnemonic = decrypt(wallet.encryptedMnemonic, password);
  const newIndex = wallet.accounts.length;
  const addresses = deriveMultiChainAddresses(mnemonic, newIndex);
  const chainAddresses = buildChainAddresses(mnemonic, newIndex);
  
  const newAccount: WalletAccount = {
    id: crypto.randomUUID(),
    address: addresses.ethereum,
    name: accountName,
    index: newIndex,
    type: 'software',
    chainAddresses,
  };
  
  wallet.accounts.push(newAccount);
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
  
  return newAccount;
};

// Set active account
export const setActiveAccount = (accountIndex: number): void => {
  const wallet = loadWallet();
  if (!wallet) throw new Error('No wallet found');
  
  if (accountIndex < 0 || accountIndex >= wallet.accounts.length) {
    throw new Error('Invalid account index');
  }
  
  wallet.activeAccountIndex = accountIndex;
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
};

// Get active account
export const getActiveAccount = (): WalletAccount | null => {
  const wallet = loadWallet();
  if (!wallet) return null;
  return wallet.accounts[wallet.activeAccountIndex] || null;
};

// Mark wallet as backed up
export const markWalletBackedUp = (): void => {
  const wallet = loadWallet();
  if (!wallet) return;
  
  wallet.backedUp = true;
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
};

// Delete wallet (danger!)
export const deleteWallet = (): void => {
  localStorage.removeItem(WALLET_STORAGE_KEY);
  localStorage.removeItem(WALLET_LOCK_KEY);
};

// Export mnemonic (requires password)
export const exportMnemonic = (password: string): string => {
  const wallet = loadWallet();
  if (!wallet) throw new Error('No wallet found');
  return decrypt(wallet.encryptedMnemonic, password);
};

// Get stored mnemonic (same as exportMnemonic but returns null on error)
export const getStoredMnemonic = (password: string): string | null => {
  try {
    return exportMnemonic(password);
  } catch {
    return null;
  }
};

// Verify password is correct
export const verifyPassword = (password: string): boolean => {
  try {
    const wallet = loadWallet();
    if (!wallet) return false;
    const mnemonic = decrypt(wallet.encryptedMnemonic, password);
    return validateMnemonic(mnemonic);
  } catch {
    return false;
  }
};

// Change wallet password
export const changePassword = (currentPassword: string, newPassword: string): boolean => {
  try {
    const wallet = loadWallet();
    if (!wallet) return false;
    
    // Decrypt with current password
    const mnemonic = decrypt(wallet.encryptedMnemonic, currentPassword);
    if (!validateMnemonic(mnemonic)) return false;
    
    // Re-encrypt with new password
    wallet.encryptedMnemonic = encrypt(mnemonic, newPassword);
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
    
    return true;
  } catch {
    return false;
  }
};

// Format address for display
export const formatAddress = (address: string, chars: number = 6): string => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

// Validate Ethereum address
export const isValidAddress = (address: string): boolean => {
  return ethers.isAddress(address);
};

// ============================================================================
// Wallet Migration
// ============================================================================

const LEGACY_WALLET_KEY = '4ortinx_wallet';
const LEGACY_FORTINX_KEY = 'fortinXchange_wallet';

// Migrate wallet from legacy storage keys and format
export const migrateWallet = (): boolean => {
  // Check if already migrated
  const current = localStorage.getItem(WALLET_STORAGE_KEY);
  if (current) {
    // Check if needs version upgrade
    try {
      const wallet = JSON.parse(current) as StoredWallet;
      if (!wallet.version || wallet.version < WALLET_VERSION) {
        // Would need to upgrade wallet structure
        // For now, just mark version
        wallet.version = WALLET_VERSION;
        wallet.id = wallet.id || crypto.randomUUID();
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
        return true;
      }
    } catch {
      // Invalid JSON, ignore
    }
    return false; // Already migrated
  }

  // Try legacy keys in order
  const legacyKeys = [LEGACY_WALLET_KEY, LEGACY_FORTINX_KEY];
  
  for (const key of legacyKeys) {
    const legacy = localStorage.getItem(key);
    if (legacy) {
      try {
        const oldWallet = JSON.parse(legacy);
        // Migrate to new format
        const migratedWallet: StoredWallet = {
          id: crypto.randomUUID(),
          encryptedMnemonic: oldWallet.encryptedMnemonic,
          accounts: oldWallet.accounts.map((acc: any, index: number) => ({
            id: acc.id || crypto.randomUUID(),
            address: acc.address,
            name: acc.name || `Account ${index + 1}`,
            index: acc.index ?? index,
            type: 'software' as AccountType,
            chainAddresses: acc.chainAddresses || [],
          })),
          activeAccountIndex: oldWallet.activeAccountIndex || 0,
          createdAt: oldWallet.createdAt || Date.now(),
          backedUp: oldWallet.backedUp || false,
          version: WALLET_VERSION,
        };
        
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(migratedWallet));
        console.log(`[Wallet] Migrated from ${key} to ${WALLET_STORAGE_KEY}`);
        return true;
      } catch (e) {
        console.error(`[Wallet] Failed to migrate from ${key}:`, e);
      }
    }
  }
  
  return false;
};

// Get address for a specific chain from active account
export const getActiveAddressForChain = (chainId: string): string | null => {
  const account = getActiveAccount();
  if (!account) return null;
  
  // If chainAddresses exist, find the specific chain
  if (account.chainAddresses && account.chainAddresses.length > 0) {
    const chainAddr = account.chainAddresses.find(ca => ca.chainId === chainId);
    if (chainAddr) return chainAddr.address;
  }
  
  // Fallback to primary address (EVM compatible)
  return account.address;
};

// Get all addresses for the active account
export const getActiveAccountAddresses = (): Record<string, string> => {
  const account = getActiveAccount();
  if (!account) return {};
  
  const addresses: Record<string, string> = {};
  
  if (account.chainAddresses && account.chainAddresses.length > 0) {
    for (const ca of account.chainAddresses) {
      addresses[ca.chainId] = ca.address;
    }
  } else {
    // Legacy: only EVM address available
    addresses['ethereum'] = account.address;
  }
  
  return addresses;
};

// Initialize wallet service (call on app start)
export const initWalletService = (): void => {
  migrateWallet();
};
