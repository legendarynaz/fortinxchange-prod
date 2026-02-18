import React from 'react';
import Card from '../ui/Card';

const SecurityPage: React.FC = () => {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Security</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Learn how we protect your account and assets
        </p>

        {/* Security Overview */}
        <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Bank-Grade Security</h2>
              <p className="text-slate-600 dark:text-slate-300">
                FortinXchange employs multiple layers of security to protect your assets and personal information. We use industry-standard encryption and security practices.
              </p>
            </div>
          </div>
        </Card>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Encryption */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">End-to-End Encryption</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              All data transmitted between your device and our servers is encrypted using TLS 1.3. Your sensitive information is never exposed.
            </p>
          </Card>

          {/* 2FA */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Add an extra layer of security with TOTP-based 2FA using apps like Google Authenticator or Authy. Backup codes provided for account recovery.
            </p>
          </Card>

          {/* Cold Storage */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Cold Storage</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              The majority of user funds are stored in air-gapped cold wallets with multi-signature protection, keeping them safe from online threats.
            </p>
          </Card>

          {/* Rate Limiting */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Rate Limiting</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Protection against brute force attacks with intelligent rate limiting on login attempts, API calls, and sensitive operations.
            </p>
          </Card>

          {/* Security Headers */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Security Headers</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Comprehensive HTTP security headers including CSP, HSTS, X-Frame-Options to prevent XSS, clickjacking, and other web vulnerabilities.
            </p>
          </Card>

          {/* Input Validation */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Input Sanitization</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              All user inputs are validated and sanitized to prevent injection attacks, XSS, and other malicious input exploits.
            </p>
          </Card>
        </div>

        {/* Security Best Practices */}
        <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Protect Your Account</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Enable Two-Factor Authentication</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Go to Settings → Security to enable 2FA with your authenticator app.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Use a Strong, Unique Password</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create a password with at least 12 characters including uppercase, lowercase, numbers, and symbols.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Keep Backup Codes Safe</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Store your 2FA backup codes in a secure location like a password manager or safe.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">4</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Beware of Phishing</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Always verify you're on the official FortinXchange website. We will never ask for your password via email.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">5</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Monitor Your Account</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Regularly check your transaction history and enable email notifications for account activity.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Bug Bounty */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Security Bug Bounty</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Found a security vulnerability? We reward responsible disclosure. Contact our security team at <a href="mailto:security@fortinxchange.com" className="text-sky-600 dark:text-sky-400 hover:underline">security@fortinxchange.com</a>
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Please do not disclose vulnerabilities publicly before they have been addressed.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default SecurityPage;
