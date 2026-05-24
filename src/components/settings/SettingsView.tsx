import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TwoFactorSetup from '../security/TwoFactorSetup';
import Card from '../ui/Card';
import { useWallet } from '../../context/WalletContext';
import { canUseLedger, canUseTrezor, connectLedgerEvm, connectTrezorEvm, loadHardwareAccount, forgetHardwareAccount, type HardwareAccount } from '../../services/hardwareWalletService';
import { 
  getEmailSettings, 
  sendVerificationEmail, 
  verifyEmail, 
  resendVerificationCode,
  removeEmail,
  updateNotificationSettings,
  type EmailSettings 
} from '../../services/emailSettingsService';
import { Usb, PlugZap, Mail, CheckCircle, AlertCircle, Loader2, X, Copy, Check, Lock, LogOut, Shield, Key, Fingerprint, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SettingsViewProps {
  walletAddress: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ walletAddress }) => {
  const navigate = useNavigate();
  const { lock, resetWallet } = useWallet();
  
  const [ledgerAcc, setLedgerAcc] = useState<HardwareAccount | null>(null);
  const [trezorAcc, setTrezorAcc] = useState<HardwareAccount | null>(null);
  const [hwError, setHwError] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<'ledger' | 'trezor' | null>(null);
  
  // Email verification state
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(getEmailSettings());
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Security state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'biometric'>(
    localStorage.getItem('4ortinx_auth_method') as 'password' | 'biometric' || 'password'
  );

  useEffect(() => {
    setLedgerAcc(loadHardwareAccount('ledger'));
    setTrezorAcc(loadHardwareAccount('trezor'));
    setEmailSettings(getEmailSettings());
  }, []);

  const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendVerification = async () => {
    if (!validateEmail(emailInput)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setIsSendingCode(true);
    setEmailError('');
    setEmailSuccess('');
    
    try {
      const result = await sendVerificationEmail(emailInput, walletAddress);
      if (result.success) {
        setEmailSettings(getEmailSettings());
        setShowVerificationInput(true);
        setEmailSuccess('Verification code sent! Check your email.');
      } else {
        setEmailError(result.message);
      }
    } catch (e) {
      setEmailError('Failed to send verification code');
    }
    
    setIsSendingCode(false);
  };

  const handleVerifyCode = async () => {
    setIsVerifying(true);
    setEmailError('');
    setEmailSuccess('');
    
    try {
      const result = await verifyEmail(verificationCode, walletAddress);
      
      if (result.success) {
        setEmailSettings(getEmailSettings());
        setEmailSuccess(result.message);
        setShowEmailInput(false);
        setShowVerificationInput(false);
        setVerificationCode('');
        setEmailInput('');
      } else {
        setEmailError(result.message);
      }
    } catch (e) {
      setEmailError('Verification failed. Please try again.');
    }
    
    setIsVerifying(false);
  };

  const handleResendCode = async () => {
    setIsSendingCode(true);
    setEmailError('');
    setEmailSuccess('');
    
    try {
      const result = await resendVerificationCode(walletAddress);
      if (result.success) {
        setEmailSuccess('New verification code sent!');
      } else {
        setEmailError(result.message);
      }
    } catch (e) {
      setEmailError('Failed to resend code');
    }
    
    setIsSendingCode(false);
  };

  const handleRemoveEmail = () => {
    removeEmail();
    setEmailSettings(getEmailSettings());
    setEmailSuccess('Email removed successfully');
  };

  const handleNotificationChange = (key: keyof EmailSettings['notifications'], value: boolean) => {
    const updated = updateNotificationSettings({ [key]: value });
    setEmailSettings(updated);
  };

  const handleConnect = async (type: 'ledger' | 'trezor') => {
    setHwError('');
    setIsConnecting(type);
    try {
      if (type === 'ledger') {
        const acc = await connectLedgerEvm();
        setLedgerAcc(acc);
      } else {
        const acc = await connectTrezorEvm();
        setTrezorAcc(acc);
      }
    } catch (e: any) {
      setHwError(e?.message || 'Connection failed');
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = (type: 'ledger' | 'trezor') => {
    forgetHardwareAccount(type);
    if (type === 'ledger') setLedgerAcc(null); else setTrezorAcc(null);
  };

  const handleLockWallet = () => {
    lock();
    navigate('/wallet');
  };

  const handleLogout = () => {
    resetWallet();
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const handleAuthMethodChange = (method: 'password' | 'biometric') => {
    setAuthMethod(method);
    localStorage.setItem('4ortinx_auth_method', method);
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-app-bg">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
        
        {/* Wallet Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Wallet</h2>
          <Card className="bg-card-bg border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Wallet Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-white font-mono text-sm bg-app-bg px-3 py-2 rounded-lg flex-1 truncate">
                    {walletAddress}
                  </p>
                  <button
                    onClick={handleCopyAddress}
                    className="p-2 bg-app-bg hover:bg-card-hover rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Status</label>
                <p className="text-green-400 font-medium flex items-center gap-2 mt-1">
                  <CheckCircle className="w-4 h-4" />
                  Active
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Email Notifications Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Email Notifications</h2>
          <Card className="bg-card-bg border-gray-700">
            <div className="space-y-4">
              {/* Current Email Status */}
              {emailSettings.email ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      emailSettings.isVerified ? 'bg-green-500/20' : 'bg-yellow-500/20'
                    }`}>
                      <Mail className={`w-5 h-5 ${emailSettings.isVerified ? 'text-green-400' : 'text-yellow-400'}`} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{emailSettings.email}</p>
                      <p className={`text-sm flex items-center gap-1 ${
                        emailSettings.isVerified ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {emailSettings.isVerified ? (
                          <><CheckCircle className="w-3 h-3" /> Verified</>
                        ) : (
                          <><AlertCircle className="w-3 h-3" /> Pending verification</>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveEmail}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div>
                  {!showEmailInput ? (
                    <button
                      onClick={() => setShowEmailInput(true)}
                      className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-accent hover:text-accent transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      Add Email for Notifications
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-400 mb-1 block">Email Address</label>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full bg-app-bg border border-gray-600 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent"
                        />
                      </div>
                      
                      {showVerificationInput && (
                        <div>
                          <label className="text-sm font-medium text-gray-400 mb-1 block">Verification Code</label>
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            className="w-full bg-app-bg border border-gray-600 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent text-center text-xl tracking-widest"
                          />
                        </div>
                      )}
                      
                      {emailError && (
                        <p className="text-red-400 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {emailError}
                        </p>
                      )}
                      
                      {emailSuccess && (
                        <p className="text-green-400 text-sm flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {emailSuccess}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        {!showVerificationInput ? (
                          <>
                            <button
                              onClick={() => {
                                setShowEmailInput(false);
                                setEmailInput('');
                                setEmailError('');
                              }}
                              className="flex-1 px-4 py-3 border border-gray-600 rounded-xl text-gray-400 hover:bg-card-hover transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSendVerification}
                              disabled={isSendingCode || !emailInput}
                              className="flex-1 px-4 py-3 bg-accent text-black font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isSendingCode ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                              ) : (
                                'Send Code'
                              )}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={handleResendCode}
                              disabled={isSendingCode}
                              className="px-4 py-3 border border-gray-600 rounded-xl text-gray-400 hover:bg-card-hover transition-colors"
                            >
                              Resend
                            </button>
                            <button
                              onClick={handleVerifyCode}
                              disabled={isVerifying || verificationCode.length !== 6}
                              className="flex-1 px-4 py-3 bg-accent text-black font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isVerifying ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                              ) : (
                                'Verify Email'
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pending verification for existing email */}
              {emailSettings.email && !emailSettings.isVerified && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-400 text-sm mb-3">Please verify your email to receive notifications.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter code"
                      maxLength={6}
                      className="flex-1 bg-app-bg border border-gray-600 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent text-center tracking-widest"
                    />
                    <button
                      onClick={handleVerifyCode}
                      disabled={verificationCode.length !== 6}
                      className="px-4 py-2 bg-accent text-black font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50"
                    >
                      Verify
                    </button>
                    <button
                      onClick={handleResendCode}
                      disabled={isSendingCode}
                      className="px-4 py-2 border border-gray-600 text-gray-400 rounded-lg hover:bg-card-hover"
                    >
                      Resend
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Security Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Security</h2>
          
          {/* Wallet Access Controls */}
          <Card className="bg-card-bg border-gray-700 mb-4">
            <div className="space-y-4">
              {/* Lock Wallet */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Lock Wallet</p>
                    <p className="text-sm text-gray-400">Require password to access wallet</p>
                  </div>
                </div>
                <button
                  onClick={handleLockWallet}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
                >
                  Lock Now
                </button>
              </div>

              {/* Logout */}
              <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Logout</p>
                    <p className="text-sm text-gray-400">Sign out and clear all wallet data</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="px-4 py-2 border border-red-500 text-red-400 hover:bg-red-500/10 font-medium rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </Card>

          {/* Authentication Method */}
          <Card className="bg-card-bg border-gray-700 mb-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-accent" />
                <h3 className="text-white font-semibold">Authentication Method</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">Choose how you want to unlock your wallet</p>
              
              {/* Password Option */}
              <button
                onClick={() => handleAuthMethodChange('password')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  authMethod === 'password'
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  authMethod === 'password' ? 'bg-accent/20 text-accent' : 'bg-gray-700 text-gray-400'
                }`}>
                  <Key className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">Password</p>
                  <p className="text-sm text-gray-400">Use your wallet password to unlock</p>
                </div>
                {authMethod === 'password' && (
                  <CheckCircle className="w-6 h-6 text-accent" />
                )}
              </button>

              {/* Biometric Option */}
              <button
                onClick={() => handleAuthMethodChange('biometric')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  authMethod === 'biometric'
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  authMethod === 'biometric' ? 'bg-accent/20 text-accent' : 'bg-gray-700 text-gray-400'
                }`}>
                  <Fingerprint className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">Biometric / Device Security</p>
                  <p className="text-sm text-gray-400">Use Face ID, Touch ID, or device PIN</p>
                </div>
                {authMethod === 'biometric' && (
                  <CheckCircle className="w-6 h-6 text-accent" />
                )}
              </button>
            </div>
          </Card>

          {/* Two-Factor Authentication */}
          <TwoFactorSetup userEmail={emailSettings.email || walletAddress} />
        </section>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-card-bg rounded-2xl p-6 max-w-md w-full border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Confirm Logout</h3>
                  <p className="text-gray-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400 text-sm">
                  <strong>Warning:</strong> Logging out will delete your wallet from this device. 
                  Make sure you have backed up your recovery phrase before proceeding.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-600 rounded-xl text-gray-300 hover:bg-card-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Logout & Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hardware Wallets */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Hardware Wallets</h2>
          <Card className="bg-card-bg border-gray-700">
            <div className="space-y-4">
              {hwError && (
                <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-2">{hwError}</div>
              )}
              {/* Ledger */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Usb className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Ledger (Ethereum)</p>
                    <p className="text-sm text-gray-400">
                      {ledgerAcc ? `Connected: ${shorten(ledgerAcc.address)}` : canUseLedger() ? 'Connect via WebUSB (Chrome/Edge on HTTPS)' : 'Requires HTTPS + WebUSB support'}
                    </p>
                  </div>
                </div>
                {ledgerAcc ? (
                  <button onClick={() => handleDisconnect('ledger')} className="px-3 py-2 text-sm rounded-lg border border-gray-600 text-red-400 hover:bg-red-500/10">Disconnect</button>
                ) : (
                  <button onClick={() => handleConnect('ledger')} disabled={!canUseLedger() || isConnecting==='ledger'} className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">
                    {isConnecting==='ledger' ? 'Connecting…' : 'Connect'}
                  </button>
                )}
              </div>
              {/* Trezor */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <PlugZap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Trezor (Ethereum)</p>
                    <p className="text-sm text-gray-400">
                      {trezorAcc ? `Connected: ${shorten(trezorAcc.address)}` : canUseTrezor() ? 'Connect via Trezor Connect (HTTPS)' : 'Requires HTTPS'}
                    </p>
                  </div>
                </div>
                {trezorAcc ? (
                  <button onClick={() => handleDisconnect('trezor')} className="px-3 py-2 text-sm rounded-lg border border-gray-600 text-red-400 hover:bg-red-500/10">Disconnect</button>
                ) : (
                  <button onClick={() => handleConnect('trezor')} disabled={!canUseTrezor() || isConnecting==='trezor'} className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">
                    {isConnecting==='trezor' ? 'Connecting…' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Notification Preferences Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Notification Preferences</h2>
          <Card className="bg-card-bg border-gray-700">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Transaction Alerts</p>
                  <p className="text-sm text-gray-400">Get notified when you send or receive crypto</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailSettings.notifications.transactions}
                    onChange={(e) => handleNotificationChange('transactions', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Price Alerts</p>
                  <p className="text-sm text-gray-400">Notifications when your alerts are triggered</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailSettings.notifications.priceAlerts}
                    onChange={(e) => handleNotificationChange('priceAlerts', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Security Alerts</p>
                  <p className="text-sm text-gray-400">Important security notifications and login alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailSettings.notifications.security}
                    onChange={(e) => handleNotificationChange('security', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Marketing & Updates</p>
                  <p className="text-sm text-gray-400">News, features, and promotional offers</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailSettings.notifications.marketing}
                    onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
              
              {!emailSettings.email && (
                <p className="text-gray-500 text-sm text-center pt-2 border-t border-gray-700">
                  Add an email address above to receive notifications
                </p>
              )}
            </div>
          </Card>
        </section>

        {/* Legal Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Legal</h2>
          <Card className="bg-card-bg border-gray-700">
            <div className="space-y-3">
              <Link
                to="/privacy"
                className="flex items-center justify-between p-4 rounded-xl hover:bg-card-hover transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Privacy Policy</p>
                    <p className="text-sm text-gray-400">How we handle your data</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-accent transition-colors" />
              </Link>
              
              <Link
                to="/terms"
                className="flex items-center justify-between p-4 rounded-xl hover:bg-card-hover transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Terms of Service</p>
                    <p className="text-sm text-gray-400">Rules for using 4ortin-X</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-accent transition-colors" />
              </Link>
            </div>
          </Card>
        </section>

        {/* App Version */}
        <div className="text-center text-gray-600 text-sm pb-8">
          <p>4ortin-X Wallet v1.0.0</p>
          <p className="mt-1">© 2026 4ortin-X. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
};

export default SettingsView;
