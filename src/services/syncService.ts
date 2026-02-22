/**
 * Sync Service - Encrypted cross-device wallet backup
 * 
 * IMPORTANT: Never sync raw seed phrases. Only sync encrypted vaults.
 */

const SYNC_SETTINGS_KEY = '4ortinx_sync_settings';
const LAST_SYNC_KEY = '4ortinx_last_sync';

export interface SyncSettings {
  enabled: boolean;
  autoSync: boolean;
  lastSyncAt?: number;
  syncId?: string;
}

export interface SyncData {
  version: number;
  encryptedVault: string;
  settings: {
    chainId: number;
    theme: string;
    currency: string;
  };
  alerts: string; // Encrypted
  customTokens: string; // Encrypted
  createdAt: number;
  updatedAt: number;
}

/**
 * Get sync settings
 */
export function getSyncSettings(): SyncSettings {
  try {
    const stored = localStorage.getItem(SYNC_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : { enabled: false, autoSync: false };
  } catch {
    return { enabled: false, autoSync: false };
  }
}

/**
 * Save sync settings
 */
export function saveSyncSettings(settings: SyncSettings): void {
  localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Encrypt data with password
 */
export async function encryptData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );
  
  // Combine salt + iv + encrypted data
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  return btoa(String.fromCharCode(...result));
}

/**
 * Decrypt data with password
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const encrypted = data.slice(28);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  return decoder.decode(decrypted);
}

/**
 * Generate a unique sync ID
 */
export function generateSyncId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate QR code data for device sync
 * Contains encrypted sync payload
 */
export async function generateSyncQRData(password: string): Promise<string> {
  const syncData = await prepareSyncData(password);
  return JSON.stringify({
    type: '4ortinx_sync',
    version: 1,
    data: syncData,
  });
}

/**
 * Prepare sync data payload
 */
async function prepareSyncData(password: string): Promise<SyncData> {
  // Get wallet data (encrypted)
  const walletData = localStorage.getItem('4ortinx_wallet') || '';
  
  // Get user settings
  const chainId = parseInt(localStorage.getItem('4ortinx_chainId') || '1');
  const theme = localStorage.getItem('4ortinx_theme') || 'dark';
  const currency = localStorage.getItem('4ortinx_currency') || 'USD';
  
  // Get alerts (encrypt them)
  const alerts = localStorage.getItem('4ortinx_price_alerts') || '[]';
  const encryptedAlerts = await encryptData(alerts, password);
  
  // Get custom tokens
  const customTokens = localStorage.getItem('4ortinx_custom_tokens') || '[]';
  const encryptedTokens = await encryptData(customTokens, password);
  
  return {
    version: 1,
    encryptedVault: walletData, // Already encrypted
    settings: { chainId, theme, currency },
    alerts: encryptedAlerts,
    customTokens: encryptedTokens,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Import sync data from another device
 */
export async function importSyncData(
  syncPayload: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = JSON.parse(syncPayload);
    
    if (parsed.type !== '4ortinx_sync') {
      return { success: false, error: 'Invalid sync data' };
    }
    
    const data = parsed.data as SyncData;
    
    // Restore wallet data
    if (data.encryptedVault) {
      localStorage.setItem('4ortinx_wallet', data.encryptedVault);
    }
    
    // Restore settings
    if (data.settings) {
      localStorage.setItem('4ortinx_chainId', data.settings.chainId.toString());
      localStorage.setItem('4ortinx_theme', data.settings.theme);
      localStorage.setItem('4ortinx_currency', data.settings.currency);
    }
    
    // Restore alerts (decrypt)
    if (data.alerts) {
      try {
        const decryptedAlerts = await decryptData(data.alerts, password);
        localStorage.setItem('4ortinx_price_alerts', decryptedAlerts);
      } catch {
        console.warn('Failed to decrypt alerts');
      }
    }
    
    // Restore custom tokens (decrypt)
    if (data.customTokens) {
      try {
        const decryptedTokens = await decryptData(data.customTokens, password);
        localStorage.setItem('4ortinx_custom_tokens', decryptedTokens);
      } catch {
        console.warn('Failed to decrypt custom tokens');
      }
    }
    
    // Update last sync time
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    
    return { success: true };
  } catch (error) {
    console.error('Failed to import sync data:', error);
    return { success: false, error: 'Failed to parse sync data' };
  }
}

/**
 * Export wallet backup as encrypted file
 */
export async function exportBackup(password: string): Promise<Blob> {
  const syncData = await prepareSyncData(password);
  const backup = {
    type: '4ortinx_backup',
    version: 1,
    data: syncData,
    exportedAt: new Date().toISOString(),
  };
  
  const encrypted = await encryptData(JSON.stringify(backup), password);
  return new Blob([encrypted], { type: 'application/octet-stream' });
}

/**
 * Import wallet backup from file
 */
export async function importBackup(
  fileContent: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const decrypted = await decryptData(fileContent, password);
    const backup = JSON.parse(decrypted);
    
    if (backup.type !== '4ortinx_backup') {
      return { success: false, error: 'Invalid backup file' };
    }
    
    // Use the same import logic
    return importSyncData(JSON.stringify({
      type: '4ortinx_sync',
      data: backup.data,
    }), password);
  } catch (error) {
    console.error('Failed to import backup:', error);
    return { success: false, error: 'Invalid password or corrupted file' };
  }
}

/**
 * Get last sync time
 */
export function getLastSyncTime(): number | null {
  const stored = localStorage.getItem(LAST_SYNC_KEY);
  return stored ? parseInt(stored) : null;
}

/**
 * Format last sync time for display
 */
export function formatLastSyncTime(): string {
  const lastSync = getLastSyncTime();
  if (!lastSync) return 'Never';
  
  const now = Date.now();
  const diff = now - lastSync;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  return new Date(lastSync).toLocaleDateString();
}

/**
 * Clear sync data
 */
export function clearSyncData(): void {
  localStorage.removeItem(SYNC_SETTINGS_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
}

/**
 * Get last backup date
 */
export function getLastBackupDate(): Date | null {
  const lastSync = getLastSyncTime();
  return lastSync ? new Date(lastSync) : null;
}

/**
 * Create a backup string for download
 */
export async function createBackup(password: string): Promise<string> {
  const blob = await exportBackup(password);
  const text = await blob.text();
  localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  return JSON.stringify({
    type: '4ortinx_backup',
    data: text,
    exportedAt: new Date().toISOString(),
  });
}

// Export a service object for convenience
export const syncService = {
  getSyncSettings,
  saveSyncSettings,
  encryptData,
  decryptData,
  generateSyncId,
  generateSyncQRData,
  importSyncData,
  exportBackup,
  importBackup,
  getLastSyncTime,
  formatLastSyncTime,
  clearSyncData,
  getLastBackupDate,
  createBackup,
};
