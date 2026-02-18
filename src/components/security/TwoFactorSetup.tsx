import React, { useState } from 'react';
import { generateSecret, verifySync, generateURI } from 'otplib';
import QRCode from 'qrcode';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import LockClosedIcon from '../icons/LockClosedIcon';

const TWO_FA_STORAGE_KEY = 'fortinXchange_2fa';

// Generate cryptographically secure backup codes
const generateBackupCodes = (count: number = 8): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = array[0].toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
};

interface TwoFactorData {
  enabled: boolean;
  secret: string;
  verifiedAt?: string;
  backupCodes?: string[];
  usedBackupCodes?: string[];
}

const getStoredTwoFactor = (): TwoFactorData | null => {
  try {
    const stored = localStorage.getItem(TWO_FA_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveTwoFactor = (data: TwoFactorData | null) => {
  if (data) {
    localStorage.setItem(TWO_FA_STORAGE_KEY, JSON.stringify(data));
  } else {
    localStorage.removeItem(TWO_FA_STORAGE_KEY);
  }
};

interface TwoFactorSetupProps {
  userEmail: string;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ userEmail }) => {
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(getStoredTwoFactor);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [isBackupCodesModalOpen, setIsBackupCodesModalOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<'generate' | 'verify' | 'backup'>('generate');
  const [tempSecret, setTempSecret] = useState('');
  const [tempBackupCodes, setTempBackupCodes] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);

  const handleGenerateSecret = async () => {
    const secret = generateSecret();
    setTempSecret(secret);
    
    const otpauth = generateURI({
      secret,
      issuer: 'FortinXchange',
      label: userEmail,
    });
    const qrUrl = await QRCode.toDataURL(otpauth);
    setQrCodeUrl(qrUrl);
    setSetupStep('generate');
    setIsSetupModalOpen(true);
    setError('');
    setVerificationCode('');
  };

  const verifyAndEnable = () => {
    setError('');
    
    try {
      const result = verifySync({
        token: verificationCode,
        secret: tempSecret,
      });
      const isValid = result.valid;

      if (isValid) {
        // Generate backup codes
        const backupCodes = generateBackupCodes(8);
        setTempBackupCodes(backupCodes);
        
        const data: TwoFactorData = {
          enabled: true,
          secret: tempSecret,
          verifiedAt: new Date().toISOString(),
          backupCodes,
          usedBackupCodes: [],
        };
        setTwoFactorData(data);
        saveTwoFactor(data);
        setSetupStep('backup'); // Show backup codes
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch {
      setError('Invalid code format. Please enter a 6-digit code.');
    }
  };

  const disableTwoFactor = () => {
    setError('');
    
    if (!twoFactorData) return;

    try {
      const result = verifySync({
        token: disableCode,
        secret: twoFactorData.secret,
      });
      const isValid = result.valid;

      if (isValid) {
        setTwoFactorData(null);
        saveTwoFactor(null);
        setIsDisableModalOpen(false);
        setDisableCode('');
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch {
      setError('Invalid code format.');
    }
  };

  const isEnabled = twoFactorData?.enabled ?? false;
  const remainingBackupCodes = (twoFactorData?.backupCodes?.length || 0) - (twoFactorData?.usedBackupCodes?.length || 0);

  const copyBackupCodes = async () => {
    const codesText = tempBackupCodes.join('\n');
    await navigator.clipboard.writeText(codesText);
    setBackupCodesCopied(true);
    setTimeout(() => setBackupCodesCopied(false), 3000);
  };

  const downloadBackupCodes = () => {
    const content = `FortinXchange 2FA Backup Codes\n\nAccount: ${userEmail}\nGenerated: ${new Date().toISOString()}\n\n${tempBackupCodes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fortinxchange-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const finishSetup = () => {
    setIsSetupModalOpen(false);
    setTempSecret('');
    setTempBackupCodes([]);
    setQrCodeUrl('');
    setVerificationCode('');
    setSetupStep('generate');
  };

  const regenerateBackupCodes = () => {
    if (!twoFactorData) return;
    const newCodes = generateBackupCodes(8);
    const updatedData = {
      ...twoFactorData,
      backupCodes: newCodes,
      usedBackupCodes: [],
    };
    setTwoFactorData(updatedData);
    saveTwoFactor(updatedData);
    setTempBackupCodes(newCodes);
    setIsBackupCodesModalOpen(true);
  };

  return (
    <>
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${isEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
            <LockClosedIcon className={`w-6 h-6 ${isEnabled ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h3>
              {isEnabled && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  Enabled
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isEnabled 
                ? 'Your account is protected with 2FA. You\'ll need your authenticator app to log in.'
                : 'Add an extra layer of security to your account by requiring a code from your authenticator app.'
              }
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {isEnabled ? (
                <>
                  <Button 
                    variant="secondary" 
                    onClick={regenerateBackupCodes}
                  >
                    View Backup Codes ({remainingBackupCodes} left)
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => { setIsDisableModalOpen(true); setError(''); setDisableCode(''); }}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    Disable 2FA
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={handleGenerateSecret}>
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Setup Modal */}
      <Modal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} title="Set Up Two-Factor Authentication">
        {setupStep === 'generate' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              {qrCodeUrl && (
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Or enter this code manually:</p>
              <code className="text-sm font-mono text-slate-900 dark:text-white break-all select-all">
                {tempSecret}
              </code>
            </div>

            <Button 
              variant="primary" 
              className="w-full" 
              onClick={() => setSetupStep('verify')}
            >
              I've scanned the code
            </Button>
          </div>
        )}

        {setupStep === 'verify' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Enter the 6-digit code from your authenticator app to verify setup:
            </p>
            
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl font-mono tracking-widest bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg py-4 px-3 text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-sky-500"
              autoFocus
            />
            
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => setSetupStep('generate')}
              >
                Back
              </Button>
              <Button 
                variant="primary" 
                className="flex-1" 
                onClick={verifyAndEnable}
                disabled={verificationCode.length !== 6}
              >
                Verify & Enable
              </Button>
            </div>
          </div>
        )}

        {setupStep === 'backup' && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                <strong>2FA Successfully Enabled!</strong>
              </p>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong> Save these backup codes in a safe place. If you lose your authenticator, you'll need these to access your account.
              </p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2">
                {tempBackupCodes.map((code, index) => (
                  <code key={index} className="text-sm font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-600 px-3 py-2 rounded text-center">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={copyBackupCodes}
              >
                {backupCodesCopied ? '✓ Copied!' : 'Copy Codes'}
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={downloadBackupCodes}
              >
                Download
              </Button>
            </div>

            <Button 
              variant="primary" 
              className="w-full" 
              onClick={finishSetup}
            >
              I've saved my backup codes
            </Button>
          </div>
        )}
      </Modal>

      {/* View Backup Codes Modal */}
      <Modal isOpen={isBackupCodesModalOpen} onClose={() => setIsBackupCodesModalOpen(false)} title="Your Backup Codes">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Use these codes to log in if you lose access to your authenticator app. Each code can only be used once.
          </p>
          
          <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {(twoFactorData?.backupCodes || []).map((code, index) => {
                const isUsed = twoFactorData?.usedBackupCodes?.includes(code);
                return (
                  <code 
                    key={index} 
                    className={`text-sm font-mono px-3 py-2 rounded text-center ${
                      isUsed 
                        ? 'text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-600 line-through' 
                        : 'text-slate-900 dark:text-white bg-white dark:bg-slate-600'
                    }`}
                  >
                    {code}
                  </code>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {remainingBackupCodes} of {twoFactorData?.backupCodes?.length || 0} codes remaining
          </p>

          <Button 
            variant="primary" 
            className="w-full" 
            onClick={() => setIsBackupCodesModalOpen(false)}
          >
            Done
          </Button>
        </div>
      </Modal>

      {/* Disable Modal */}
      <Modal isOpen={isDisableModalOpen} onClose={() => setIsDisableModalOpen(false)} title="Disable Two-Factor Authentication">
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Warning:</strong> Disabling 2FA will make your account less secure.
            </p>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Enter your current 2FA code to confirm:
          </p>
          
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-3xl font-mono tracking-widest bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg py-4 px-3 text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-sky-500"
            autoFocus
          />
          
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={() => setIsDisableModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="sell" 
              className="flex-1" 
              onClick={disableTwoFactor}
              disabled={disableCode.length !== 6}
            >
              Disable 2FA
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TwoFactorSetup;

// Export helper for login verification
export const verifyTwoFactorCode = (code: string): boolean => {
  const stored = getStoredTwoFactor();
  if (!stored?.enabled) return true; // 2FA not enabled, skip

  try {
    const result = verifySync({
      token: code,
      secret: stored.secret,
    });
    return result.valid;
  } catch {
    return false;
  }
};

export const isTwoFactorEnabled = (): boolean => {
  const stored = getStoredTwoFactor();
  return stored?.enabled ?? false;
};
