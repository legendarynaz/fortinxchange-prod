import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, MessageCircle, Mail, ExternalLink } from 'lucide-react';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is 4ortin-X Wallet?",
    answer: "4ortin-X is a non-custodial, multi-chain cryptocurrency wallet that allows you to securely store, send, receive, and swap digital assets. You have full control of your private keys and funds."
  },
  {
    question: "What is a recovery phrase?",
    answer: "Your recovery phrase (also called seed phrase) is a 12 or 24-word phrase that gives you access to your wallet. It's the only way to recover your wallet if you lose access. Never share it with anyone and store it in a safe place offline."
  },
  {
    question: "How do I back up my wallet?",
    answer: "Go to Settings → Recovery Phrase → enter your password to view your recovery phrase. Write it down on paper (not digitally) and store it in multiple secure locations."
  },
  {
    question: "What happens if I lose my recovery phrase?",
    answer: "If you lose your recovery phrase and cannot access your wallet, your funds will be permanently lost. There is no way to recover a wallet without the recovery phrase. This is why it's crucial to back it up securely."
  },
  {
    question: "Which networks are supported?",
    answer: "4ortin-X supports multiple networks including Ethereum, BNB Smart Chain, Polygon, Arbitrum, Optimism, Base, Avalanche, Fantom, zkSync Era, and Bitcoin. You can switch networks using the network selector."
  },
  {
    question: "How do I add custom tokens?",
    answer: "Go to your wallet home screen and tap the '+' button or 'Add Token'. You can either select from popular tokens or paste a custom token contract address to add any ERC-20 compatible token."
  },
  {
    question: "Are my funds safe?",
    answer: "4ortin-X is a non-custodial wallet, meaning only you have access to your funds through your recovery phrase. We never store or have access to your private keys. However, always be careful of phishing attempts and never share your recovery phrase."
  },
  {
    question: "How do gas fees work?",
    answer: "Gas fees are required to process transactions on blockchain networks. They go to network validators/miners, not to 4ortin-X. Gas fees vary based on network congestion. You can see estimated gas before confirming transactions."
  },
  {
    question: "Why is my transaction pending?",
    answer: "Transactions can be pending due to network congestion or low gas fees. Most transactions confirm within a few minutes, but during high network activity, it may take longer. You can check transaction status on the blockchain explorer."
  },
  {
    question: "How do I swap tokens?",
    answer: "Go to the Swap tab, select the tokens you want to exchange, enter the amount, and confirm the swap. Swaps are processed through decentralized exchanges directly on the blockchain."
  },
  {
    question: "Can I use 4ortin-X with dApps?",
    answer: "Yes! 4ortin-X supports WalletConnect, allowing you to connect to thousands of decentralized applications (dApps) across supported networks."
  },
  {
    question: "How do I contact support?",
    answer: "You can reach our support team via email at support@4ortin-x.com or through our official social media channels. Never trust anyone claiming to be support who asks for your recovery phrase."
  },
];

const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0D1117]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 safe-area-top">
        <h1 className="text-xl font-semibold text-white">Help & FAQ</h1>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-safe">
        {/* Support Section */}
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Contact Support</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="mailto:support@4ortin-x.com"
              className="flex items-center gap-3 p-4 bg-[#1A1A2E] rounded-2xl hover:bg-[#252542] transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Email</p>
                <p className="text-gray-500 text-xs">Get help via email</p>
              </div>
            </a>
            <a
              href="https://t.me/4ortinxsupport"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-[#1A1A2E] rounded-2xl hover:bg-[#252542] transition-colors"
            >
              <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Telegram</p>
                <p className="text-gray-500 text-xs">Chat with us</p>
              </div>
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="p-4">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-[#1A1A2E] rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  {expandedIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedIndex === index && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="p-4 border-t border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Resources</h2>
          <div className="space-y-2">
            <a
              href="https://4ortin-x.com/guides"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-[#1A1A2E] rounded-2xl hover:bg-[#252542] transition-colors"
            >
              <span className="text-white">User Guides</span>
              <ExternalLink className="w-5 h-5 text-gray-500" />
            </a>
            <a
              href="https://4ortin-x.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-[#1A1A2E] rounded-2xl hover:bg-[#252542] transition-colors"
            >
              <span className="text-white">Security Tips</span>
              <ExternalLink className="w-5 h-5 text-gray-500" />
            </a>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <p className="text-red-400 text-sm">
              <strong>⚠️ Beware of scams:</strong> 4ortin-X support will NEVER ask for your recovery phrase or private keys. Anyone asking for these is a scammer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQModal;
