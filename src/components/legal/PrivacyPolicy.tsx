import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6 pb-20">
        <p className="text-gray-400 mb-8">Last updated: February 18, 2026</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="mb-3">
              4ortin-X ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, and safeguard your information when you use our non-custodial 
              cryptocurrency wallet service.
            </p>
            <p>
              <strong className="text-white">Key Point:</strong> As a non-custodial wallet, we do not have access to 
              your private keys, recovery phrase, or the funds in your wallet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Do NOT Collect</h2>
            <p className="mb-3">
              Due to our non-custodial architecture, we <strong className="text-white">never</strong> collect or have access to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your private keys</li>
              <li>Your recovery phrase (seed phrase)</li>
              <li>Your wallet password</li>
              <li>Your cryptocurrency holdings or balances (these are public on the blockchain)</li>
              <li>The ability to move or access your funds</li>
            </ul>
            <p className="mt-3">
              Your recovery phrase is generated and stored locally on your device. It is never transmitted 
              to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Information We May Collect</h2>
            <p className="mb-3">We may collect limited information to provide and improve our services:</p>
            
            <h3 className="text-lg font-medium text-white mt-4 mb-2">a) Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Device type and operating system</li>
              <li>Browser type and version</li>
              <li>IP address (anonymized where possible)</li>
              <li>General location (country/region level)</li>
              <li>App usage statistics and crash reports</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">b) Transaction Metadata</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Public wallet addresses used for swaps (already public on blockchain)</li>
              <li>Transaction hashes (already public on blockchain)</li>
              <li>Fee amounts paid through our service</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">c) Optional Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Email address (only if you contact support)</li>
              <li>Feedback and survey responses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. How We Use Information</h2>
            <p className="mb-3">We use collected information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide and maintain the Service</li>
              <li>Improve user experience and fix bugs</li>
              <li>Process swap transactions and calculate fees</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
              <li>Respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Third-Party Services</h2>
            <p className="mb-3">
              Our Service integrates with third parties who have their own privacy policies:
            </p>
            
            <h3 className="text-lg font-medium text-white mt-4 mb-2">Fiat On-Ramp Providers</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li><strong>MoonPay</strong> — Collects identity verification (KYC) data for fiat purchases</li>
              <li><strong>Transak</strong> — Collects identity verification (KYC) data for fiat purchases</li>
              <li><strong>Simplex</strong> — Collects identity verification (KYC) data for fiat purchases</li>
            </ul>
            <p className="mb-3">
              When you use these services, you are subject to their privacy policies. We do not receive 
              or store your KYC documents or payment card information.
            </p>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">DEX Aggregators</h3>
            <p>
              1inch and similar services may collect transaction data. Swap transactions are executed 
              on-chain and are publicly visible on blockchain explorers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Data Storage and Security</h2>
            <p className="mb-3">
              <strong className="text-white">Local Storage:</strong> Your wallet data (encrypted private keys) is stored 
              locally on your device using browser storage. We recommend:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Using a secure device with up-to-date software</li>
              <li>Not using public or shared computers</li>
              <li>Keeping a secure backup of your recovery phrase offline</li>
            </ul>
            <p>
              <strong className="text-white">Server Storage:</strong> Any data we collect is stored on secure servers with 
              encryption at rest and in transit. We implement industry-standard security measures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Data Sharing</h2>
            <p className="mb-3">We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Service Providers:</strong> Companies that help us operate (hosting, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger or acquisition</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Blockchain Transparency</h2>
            <p className="mb-3">
              Please note that blockchain transactions are:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Public:</strong> Anyone can view transactions on block explorers</li>
              <li><strong>Permanent:</strong> Transactions cannot be deleted from the blockchain</li>
              <li><strong>Pseudonymous:</strong> Addresses are not directly linked to identity, but activity can be analyzed</li>
            </ul>
            <p className="mt-3">
              This is inherent to blockchain technology and not within our control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Your Rights</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at the email below. Note that we cannot delete 
              blockchain transaction data as it is not within our control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Cookies and Tracking</h2>
            <p className="mb-3">
              We may use cookies and similar technologies for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Session management</li>
              <li>Remembering preferences</li>
              <li>Analytics (anonymized)</li>
            </ul>
            <p className="mt-3">
              You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Children's Privacy</h2>
            <p>
              Our Service is not intended for users under 18 years of age. We do not knowingly 
              collect information from children. If you believe a child has provided us with 
              personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. International Users</h2>
            <p>
              If you access our Service from outside the United States, your information may be 
              transferred to, stored, and processed in countries with different data protection 
              laws. By using the Service, you consent to such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this 
              page with an updated "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">14. Contact Us</h2>
            <p className="mb-3">
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <p className="text-[#F0B90B]">privacy@4ortin-x.com</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
