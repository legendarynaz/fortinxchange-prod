import React from 'react';
import { ArrowLeft, FileText, CheckCircle, Mail } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-app-bg text-white">
      {/* Header */}
      <div className="sticky top-0 bg-app-bg/95 backdrop-blur-lg border-b border-gray-800 p-4 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-card-bg rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent" />
            <h1 className="text-xl font-bold">Terms of Service</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6 pb-20">
        {/* Hero Section */}
        <div className="bg-card-bg rounded-2xl p-6 mb-8 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Agreement to Terms</h2>
              <p className="text-gray-400 text-sm">Last updated: April 26, 2026</p>
            </div>
          </div>
          <p className="text-gray-300">
            By using 4ortin-X, you agree to these terms. Please read them carefully before using our 
            <strong className="text-accent"> non-custodial cryptocurrency wallet</strong> service.
          </p>
        </div>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="mb-3">
              By accessing or using 4ortin-X Wallet ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, do not use the Service.
            </p>
            <p>
              4ortin-X is a non-custodial cryptocurrency wallet. This means you are solely responsible for 
              maintaining the security of your wallet and recovery phrase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="mb-3">4ortin-X provides:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Non-custodial cryptocurrency wallet services</li>
              <li>Decentralized token swap functionality via third-party DEX aggregators</li>
              <li>Fiat-to-crypto purchase services via third-party providers (MoonPay, Transak, Simplex)</li>
              <li>Portfolio tracking and analytics tools</li>
              <li>Token security scanning features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Non-Custodial Nature</h2>
            <p className="mb-3">
              <strong className="text-white">4ortin-X does not store, hold, or have access to your private keys or recovery phrase.</strong>
            </p>
            <p className="mb-3">
              Your recovery phrase (seed phrase) is generated locally on your device and is never transmitted to our servers. 
              You are solely responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Securely storing your recovery phrase</li>
              <li>Never sharing your recovery phrase with anyone</li>
              <li>Understanding that loss of your recovery phrase means permanent loss of access to your funds</li>
              <li>All transactions made from your wallet</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. User Responsibilities</h2>
            <p className="mb-3">You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the Service in compliance with all applicable laws and regulations</li>
              <li>Not use the Service for illegal activities including money laundering or terrorist financing</li>
              <li>Not attempt to hack, exploit, or disrupt the Service</li>
              <li>Verify all transaction details before confirming</li>
              <li>Understand the risks associated with cryptocurrency trading and storage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Third-Party Services</h2>
            <p className="mb-3">
              4ortin-X integrates with third-party services including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>1inch Network (DEX aggregation)</li>
              <li>MoonPay, Transak, Simplex (fiat on-ramps)</li>
              <li>Various blockchain networks</li>
            </ul>
            <p>
              These services have their own terms and privacy policies. 4ortin-X is not responsible for the 
              operation, availability, or actions of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Fees</h2>
            <p className="mb-3">
              4ortin-X may charge fees for certain services:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Swap fees: A percentage of each token swap transaction</li>
              <li>Network fees: Blockchain gas fees (paid to network validators, not 4ortin-X)</li>
              <li>Third-party fees: On-ramp providers charge their own fees</li>
            </ul>
            <p className="mt-3">
              All applicable fees will be displayed before you confirm any transaction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Risks</h2>
            <p className="mb-3">
              Cryptocurrency involves significant risks including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Price volatility — values can decrease rapidly</li>
              <li>Smart contract risks — bugs or exploits in DeFi protocols</li>
              <li>Regulatory risks — laws may change affecting cryptocurrency use</li>
              <li>Irreversibility — blockchain transactions cannot be reversed</li>
              <li>Scams and fraud — malicious tokens, phishing, and social engineering</li>
            </ul>
            <p className="mt-3">
              You acknowledge that you understand these risks and use the Service at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
            <p className="mb-3">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, secure, or error-free, 
              or that any defects will be corrected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p className="mb-3">
TO THE MAXIMUM EXTENT PERMITTED BY LAW, 4ORTIN-X SHALL NOT BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING 
              LOSS OF PROFITS, DATA, OR CRYPTOCURRENCY, REGARDLESS OF THE CAUSE OF ACTION.
            </p>
            <p>
              Our total liability shall not exceed the amount of fees you have paid to us in 
              the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless 4ortin-X, its affiliates, and their respective 
              officers, directors, employees, and agents from any claims, damages, losses, or expenses 
              arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Modifications</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be posted on this page 
              with an updated "Last updated" date. Your continued use of the Service after changes 
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time for any reason. 
              Since 4ortin-X is non-custodial, termination does not affect your ability to access 
              your funds using your recovery phrase with any compatible wallet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law principles. Any disputes shall be resolved through 
              binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">14. Contact</h2>
            <p className="mb-3">
              For questions about these Terms, please contact us at:
            </p>
            <div className="flex items-center gap-2 text-accent">
              <Mail className="w-5 h-5" />
              <a href="mailto:support@4ortin-x.com" className="hover:underline">support@4ortin-x.com</a>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-6 border-t border-gray-800 text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/" className="hover:text-accent transition-colors">Back to Wallet</Link>
          </div>
          <p className="text-gray-600 text-sm mt-4">© 2026 4ortin-X. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
