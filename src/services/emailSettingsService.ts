// Email Settings Service for 4ortin-X
// Manages user email preferences and verification
// Now connected to real backend APIs

const EMAIL_SETTINGS_KEY = '4ortinx_email_settings';
const API_BASE = '/api';

// API endpoints
const SEND_VERIFICATION_URL = `${API_BASE}/send-verification`;
const VERIFY_CODE_URL = `${API_BASE}/verify-code`;

export interface EmailSettings {
  email: string | null;
  isVerified: boolean;
  verificationPending?: boolean;
  notifications: {
    transactions: boolean;
    priceAlerts: boolean;
    security: boolean;
    marketing: boolean;
  };
}

const DEFAULT_SETTINGS: EmailSettings = {
  email: null,
  isVerified: false,
  verificationPending: false,
  notifications: {
    transactions: true,
    priceAlerts: true,
    security: true,
    marketing: false,
  },
};

export const getEmailSettings = (): EmailSettings => {
  try {
    const stored = localStorage.getItem(EMAIL_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load email settings:', e);
  }
  return DEFAULT_SETTINGS;
};

export const saveEmailSettings = (settings: Partial<EmailSettings>): EmailSettings => {
  const current = getEmailSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save email settings:', e);
  }
  return updated;
};

// Send verification email via real API
export const sendVerificationEmail = async (
  email: string, 
  userAddress?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(SEND_VERIFICATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userAddress }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || 'Failed to send verification email' };
    }

    // Save email locally as pending verification
    saveEmailSettings({
      email,
      isVerified: false,
      verificationPending: true,
    });

    return {
      success: true,
      message: data.message || `Verification code sent to ${email}`,
    };
  } catch (error) {
    console.error('Send verification error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
};

// Verify email code via real API
export const verifyEmail = async (
  code: string,
  userAddress?: string
): Promise<{ success: boolean; message: string }> => {
  const settings = getEmailSettings();

  if (!settings.email) {
    return { success: false, message: 'No email to verify' };
  }

  try {
    const response = await fetch(VERIFY_CODE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: settings.email, 
        code,
        userAddress,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || 'Invalid verification code' };
    }

    // Mark as verified locally
    saveEmailSettings({
      isVerified: true,
      verificationPending: false,
    });

    return { success: true, message: 'Email verified successfully!' };
  } catch (error) {
    console.error('Verify email error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
};

// Resend verification code
export const resendVerificationCode = async (
  userAddress?: string
): Promise<{ success: boolean; message: string }> => {
  const settings = getEmailSettings();

  if (!settings.email) {
    return { success: false, message: 'No email address found' };
  }

  return sendVerificationEmail(settings.email, userAddress);
};

export const removeEmail = (): void => {
  saveEmailSettings({
    email: null,
    isVerified: false,
    verificationPending: false,
  });
};

export const updateNotificationSettings = (
  notifications: Partial<EmailSettings['notifications']>
): EmailSettings => {
  const current = getEmailSettings();
  return saveEmailSettings({
    notifications: { ...current.notifications, ...notifications },
  });
};

// Legacy sync function for backward compatibility
export const setUserEmail = (email: string): EmailSettings => {
  return saveEmailSettings({
    email,
    isVerified: false,
    verificationPending: true,
  });
};
