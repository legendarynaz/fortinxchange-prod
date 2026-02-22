import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: Array<{ symbol: string; balance: number; value: number }>;
  totalValue: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  holdings,
  totalValue,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! 👋 I'm your 4ortin-X AI assistant. Ask me about your portfolio, gas fees, security tips, or trading guidance!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatUSD = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

  const getResponse = (query: string): string => {
    const q = query.toLowerCase();
    const topHoldings = [...holdings].sort((a, b) => b.value - a.value);
    
    // Portfolio
    if (q.includes('portfolio') || q.includes('analyze') || q.includes('holdings') || q.includes('balance')) {
      if (holdings.length === 0) {
        return "Your wallet is empty! Tap Buy or Receive to get started.";
      }
      let resp = `📊 Portfolio: ${formatUSD(totalValue)}\n\nYour tokens:\n`;
      topHoldings.slice(0, 5).forEach((h, i) => {
        const pct = ((h.value / totalValue) * 100).toFixed(1);
        resp += `${i + 1}. ${h.symbol}: ${formatUSD(h.value)} (${pct}%)\n`;
      });
      return resp;
    }
    
    // Gas
    if (q.includes('gas') || q.includes('fee')) {
      return "⛽ Gas Tips:\n\n• Trade on weekends for lower fees\n• Use Layer 2s (Arbitrum, Base) for 10-100x cheaper\n• Check the gas widget on home screen";
    }
    
    // Security
    if (q.includes('safe') || q.includes('secure') || q.includes('scam') || q.includes('security')) {
      return "🔒 Security Tips:\n\n✅ Never share your seed phrase\n✅ Verify contract addresses\n✅ Use Token Scanner before buying\n❌ Don't click DM links\n❌ Don't rush into \"urgent\" deals";
    }
    
    // Swap
    if (q.includes('swap') || q.includes('trade') || q.includes('when')) {
      if (holdings.length === 0) {
        return "You need tokens first! Tap Buy or Receive to get started.";
      }
      return "💱 Swap Tips:\n\n• Go to Swap tab to exchange tokens\n• We find the best rates across DEXes\n• Keep 10-20% in stablecoins for dips";
    }
    
    // Stablecoins
    if (q.includes('stable') || q.includes('usdt') || q.includes('usdc')) {
      const stables = holdings.filter(h => ['USDT', 'USDC', 'DAI', 'BUSD'].includes(h.symbol.toUpperCase()));
      const stableVal = stables.reduce((s, h) => s + h.value, 0);
      return `💵 Stablecoins: ${formatUSD(stableVal)}\n\nKeeping 10-20% in stables lets you buy dips!`;
    }
    
    // Help
    if (q.includes('help') || q.includes('what can')) {
      return "I can help with:\n\n📊 \"Analyze my portfolio\"\n⛽ \"Gas tips\"\n🔒 \"Security tips\"\n💱 \"When to swap?\"\n💵 \"Stablecoin info\"";
    }
    
    // Greeting
    if (q.match(/^(hi|hello|hey|gm)/)) {
      return `Hey! 👋 You have ${formatUSD(totalValue)} in ${holdings.length} tokens. How can I help?`;
    }
    
    // Default
    return `I can help with:\n• Portfolio analysis\n• Gas optimization\n• Security tips\n• Swap guidance\n\nTry: "Analyze my portfolio"`;
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || loading) return;
    
    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    
    setTimeout(() => {
      const response = getResponse(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setLoading(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0D1117] z-[100] flex flex-col">
      {/* Header */}
      <div className="bg-[#1A1A2E] px-4 py-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold">AI Assistant</h2>
            <p className="text-gray-400 text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 4ortin-X
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg bg-gray-800">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-[#F0B90B]' : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-black" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' ? 'bg-[#F0B90B] text-black' : 'bg-[#1A1A2E] text-white'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[#1A1A2E] rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length < 3 && !loading && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {["Analyze my portfolio", "Gas tips", "Security tips", "When to swap?"].map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="bg-[#252542] text-gray-300 text-sm px-3 py-2 rounded-lg whitespace-nowrap border border-gray-700"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div 
        className="bg-[#1A1A2E] border-t border-gray-800 p-4"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask me anything..."
            className="flex-1 bg-[#252542] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 text-[16px]"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;
