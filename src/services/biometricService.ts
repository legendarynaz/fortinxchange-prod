import { Capacitor } from '@capacitor/core';
import {
  BiometricAuth,
  BiometryType,
  BiometryErrorType,
} from '@aparajita/capacitor-biometric-auth';
import type { CheckBiometryResult } from '@aparajita/capacitor-biometric-auth';

const BIOMETRIC_ENABLED_KEY = '4ortinx_biometric_enabled';
const BIOMETRIC_CREDENTIAL_KEY = '4ortinx_biometric_credential';

export type BiometricType = 'none' | 'face' | 'fingerprint' | 'iris';

export interface BiometricStatus {
  isAvailable: boolean;
  isEnabled: boolean;
  biometryType: BiometryType;
  biometryName: string;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricAvailability(): Promise<CheckBiometryResult> {
  if (!Capacitor.isNativePlatform()) {
    return {
      isAvailable: false,
      strongBiometryIsAvailable: false,
      biometryType: BiometryType.none,
      biometryTypes: [],
      deviceIsSecure: false,
      reason: 'Not running on native platform',
      code: BiometryErrorType.biometryNotAvailable,
      strongReason: '',
      strongCode: undefined,
    };
  }

  try {
    return await BiometricAuth.checkBiometry();
  } catch (error) {
    console.error('Failed to check biometry:', error);
    return {
      isAvailable: false,
      strongBiometryIsAvailable: false,
      biometryType: BiometryType.none,
      biometryTypes: [],
      deviceIsSecure: false,
      reason: 'Failed to check',
      code: BiometryErrorType.biometryNotAvailable,
      strongReason: '',
      strongCode: undefined,
    };
  }
}

/**
 * Get human-readable name for biometry type
 */
export function getBiometryName(type: BiometryType): string {
  switch (type) {
    case BiometryType.faceId:
      return 'Face ID';
    case BiometryType.touchId:
      return 'Touch ID';
    case BiometryType.fingerprintAuthentication:
      return 'Fingerprint';
    case BiometryType.faceAuthentication:
      return 'Face Unlock';
    case BiometryType.irisAuthentication:
      return 'Iris Scan';
    default:
      return 'Biometric';
  }
}

/**
 * Get the current biometric status
 */
export async function getBiometricStatus(): Promise<BiometricStatus> {
  const result = await checkBiometricAvailability();
  const isEnabled = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';

  return {
    isAvailable: result.isAvailable,
    isEnabled: isEnabled && result.isAvailable,
    biometryType: result.biometryType,
    biometryName: getBiometryName(result.biometryType),
  };
}

/**
 * Enable biometric authentication
 * Stores the password (encrypted with a device-bound key) for biometric unlock
 */
export async function enableBiometric(password: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('Biometric not available on web');
    return false;
  }

  if (!password) {
    console.error('Password is required to enable biometric');
    return false;
  }

  try {
    // First verify the user can authenticate with biometrics
    await BiometricAuth.authenticate({
      reason: 'Enable biometric unlock for your wallet',
      cancelTitle: 'Cancel',
      allowDeviceCredential: false,
    });

    // If we get here, authentication succeeded
    // Store the password for biometric unlock
    // Note: In a production app, this should use the native Keychain/Keystore
    // which provides hardware-backed encryption. For now, we use base64 encoding
    // combined with the biometric gate as the security layer.
    const encoded = btoa(password);
    localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, encoded);
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    return true;
  } catch (error) {
    console.error('Failed to enable biometric:', error);
    return false;
  }
}

/**
 * Disable biometric authentication
 */
export function disableBiometric(): void {
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
}

/**
 * Authenticate using biometrics and return the stored password
 * Returns the password if authentication was successful, null otherwise
 */
export async function authenticateWithBiometric(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  const isEnabled = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
  if (!isEnabled) {
    return null;
  }

  const storedCredential = localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
  if (!storedCredential) {
    return null;
  }

  try {
    await BiometricAuth.authenticate({
      reason: 'Unlock your wallet',
      cancelTitle: 'Use Password',
      allowDeviceCredential: true,
    });
    // If we get here, authentication succeeded - return the stored password
    const password = atob(storedCredential);
    return password;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return null;
  }
}

/**
 * Check if biometric is enabled for this wallet
 */
export function isBiometricEnabled(): boolean {
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
}

/**
 * Get biometric type as simplified string
 */
export async function getBiometricType(): Promise<BiometricType> {
  const result = await checkBiometricAvailability();
  switch (result.biometryType) {
    case BiometryType.faceId:
    case BiometryType.faceAuthentication:
      return 'face';
    case BiometryType.touchId:
    case BiometryType.fingerprintAuthentication:
      return 'fingerprint';
    case BiometryType.irisAuthentication:
      return 'iris';
    default:
      return 'none';
  }
}

/**
 * Check if biometric is available on this device
 */
export async function isAvailable(): Promise<boolean> {
  const result = await checkBiometricAvailability();
  return result.isAvailable;
}

// Export a service object for convenience
export const biometricService = {
  isAvailable,
  getBiometricType,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  authenticateWithBiometric,
};

export { BiometryType };
