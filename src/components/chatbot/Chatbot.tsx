import React, { useState, useEffect, useRef } from 'react';
import XMarkIcon from '../icons/XMarkIcon';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

interface ChatbotProps {
  onClose: () => void;
}

// FAQ knowledge base for rule-based responses
const faqResponses: { keywords: string[]; response: string }[] = [
  {
    keywords: ['what is', '4ortin', 'wallet', 'about'],
    response: "4ortin-X is a non-custodial, multi-chain cryptocurrency wallet. You have full control of your private keys and funds. We support Ethereum, Bitcoin, Tron, and many other networks."
  },
  {
    keywords: ['recovery', 'phrase', 'seed', 'backup', 'restore'],
    response: "Your recovery phrase (seed phrase) is a 12 or 24-word phrase that gives you access to your wallet. To back it up: Go to Settings → Recovery Phrase → enter your password. Write it down on paper and store it securely. NEVER share it with anyone!"
  },
  {
    keywords: ['lost', 'forgot', 'password', 'reset'],
    response: "If you forgot your password but have your recovery phrase, you can reset your wallet and import it again using the phrase. If you've lost both your password AND recovery phrase, unfortunately your funds cannot be recovered. This is why backing up your recovery phrase is crucial."
  },
  {
    keywords: ['network', 'chain', 'supported', 'ethereum', 'bitcoin', 'tron'],
    response: "4ortin-X supports multiple networks including: Ethereum, BNB Smart Chain, Polygon, Arbitrum, Optimism, Base, Avalanche, Fantom, zkSync Era, Bitcoin (Native SegWit), and Tron. You can switch networks using the network selector in the app."
  },
  {
    keywords: ['token', 'add', 'custom', 'import'],
    response: "To add a custom token: Go to your wallet home → tap '+' or 'Add Token' → paste the token contract address. You can also select from popular tokens in the list."
  },
  {
    keywords: ['safe', 'secure', 'security', 'hack'],
    response: "4ortin-X is a non-custodial wallet - only YOU have access to your funds through your recovery phrase. We never store your private keys. To stay safe: Never share your recovery phrase, beware of phishing sites, and enable biometric authentication in Settings."
  },
  {
    keywords: ['gas', 'fee', 'transaction fee', 'cost'],
    response: "Gas fees are paid to blockchain validators to process your transactions - they don't go to 4ortin-X. Fee amounts vary based on network congestion. You can see estimated fees before confirming any transaction."
  },
  {
    keywords: ['pending', 'stuck', 'transaction', 'slow'],
    response: "Transactions can be pending due to network congestion or low gas fees. Most confirm within a few minutes, but during high activity it may take longer. Check your transaction status on the blockchain explorer linked in the app."
  },
  {
    keywords: ['swap', 'exchange', 'trade', 'convert'],
    response: "To swap tokens: Go to the Swap tab → select tokens → enter amount → confirm. Swaps are processed through decentralized exchanges directly on the blockchain. A small fee applies to swaps."
  },
  {
    keywords: ['send', 'transfer', 'withdraw'],
    response: "To send crypto: Go to Wallet → tap 'Send' → enter recipient address → enter amount → confirm. Always double-check the address before sending - blockchain transactions are irreversible!"
  },
  {
    keywords: ['receive', 'deposit', 'address'],
    response: "To receive crypto: Go to Wallet → tap 'Receive' → copy your wallet address or show the QR code to the sender. Make sure the sender uses the correct network!"
  },
  {
    keywords: ['biometric', 'face id', 'touch id', 'fingerprint'],
    response: "To enable biometric unlock: Go to Settings → Authentication Method → select 'Biometric' → enter your wallet password → authenticate with Face ID/Touch ID. This lets you unlock your wallet faster while keeping it secure."
  },
  {
    keywords: ['contact', 'support', 'help', 'email', 'telegram'],
    response: "You can reach our support team via:\n• Email: support@4ortin-x.com\n• Telegram: @4ortinxsupport\n\n⚠️ Warning: 4ortin-X support will NEVER ask for your recovery phrase or private keys. Anyone asking for these is a scammer."
  },
  {
    keywords: ['scam', 'phishing', 'fraud', 'fake'],
    response: "⚠️ Beware of scams! 4ortin-X will NEVER:\n• Ask for your recovery phrase\n• Ask for your private keys\n• Send you DMs asking for funds\n• Promise free crypto giveaways\n\nOnly use our official website and apps. Report suspicious activity to support@4ortin-x.com"
  },
];

// Quick reply suggestions
const quickReplies = [
  "What is 4ortin-X?",
  "How do I backup my wallet?",
  "Which networks are supported?",
  "How do I swap tokens?",
  "Contact support"
];

const findBestResponse = (userInput: string): string => {
  const input = userInput.toLowerCase();
  
  // Find the FAQ with the most keyword matches
  let bestMatch = { score: 0, response: '' };
  
  for (const faq of faqResponses) {
    const matchCount = faq.keywords.filter(keyword => input.includes(keyword)).length;
    if (matchCount > bestMatch.score) {
      bestMatch = { score: matchCount, response: faq.response };
    }
  }
  
  if (bestMatch.score > 0) {
    return bestMatch.response;
  }
  
  // Default response if no match found
  return "I'm not sure about that specific question. Here are some things I can help with:\n\n• Wallet setup and backup\n• Supported networks\n• Sending and receiving crypto\n• Swapping tokens\n• Security tips\n\nOr contact our support team at support@4ortin-x.com for personalized assistance.";
};

const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hello! I'm the 4ortin-X support assistant. How can I help you today?\n\nTap a quick question below or type your own:" }
  ]);
  const [input, setInput] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMessage: Message = { text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowQuickReplies(false);

    // Simulate brief typing delay for natural feel
    setTimeout(() => {
      const botResponseText = findBestResponse(text);
      const botMessage: Message = { text: botResponseText, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="absolute bottom-20 right-0 w-80 sm:w-96 h-[500px] bg-[#1A1A2E] border border-gray-700 rounded-xl shadow-2xl flex flex-col transition-all">
      <header className="flex items-center justify-between p-3 border-b border-gray-700 bg-[#0D1117] rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F0B90B] flex items-center justify-center">
            <span className="text-black font-bold text-sm">4X</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Support Assistant</h3>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </header>
      
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'bot' && (
              <div className="w-7 h-7 rounded-full bg-[#F0B90B] text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
                4X
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender === 'user'
                  ? 'bg-[#F0B90B] text-black rounded-br-sm'
                  : 'bg-[#252542] text-white rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        
        {/* Quick reply buttons */}
        {showQuickReplies && (
          <div className="flex flex-wrap gap-2 pt-2">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleSend(reply)}
                className="px-3 py-1.5 bg-[#252542] hover:bg-[#353560] text-white text-xs rounded-full border border-gray-600 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-3 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-[#0D1117] border border-gray-600 rounded-full py-2.5 px-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#F0B90B]"
          />
          <button 
            type="submit" 
            disabled={!input.trim()} 
            className="bg-[#F0B90B] text-black p-2.5 rounded-full disabled:opacity-50 hover:bg-[#F0B90B]/90 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086L2.279 16.76a.75.75 0 0 0 .95.826l16-5.333a.75.75 0 0 0 0-1.418l-16-5.333Z" />
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-gray-500 text-center mt-2">
          For complex issues, email support@4ortin-x.com
        </p>
      </footer>
    </div>
  );
};

export default Chatbot;
