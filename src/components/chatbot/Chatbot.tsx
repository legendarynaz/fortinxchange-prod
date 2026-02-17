import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../../services/geminiService';
import XMarkIcon from '../icons/XMarkIcon';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

interface ChatbotProps {
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hello! I'm the FortinXchange support assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const botResponseText = await sendChatMessage(input);
    const botMessage: Message = { text: botResponseText, sender: 'bot' };
    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  return (
    <div className="absolute bottom-20 right-0 w-80 sm:w-96 h-[500px] bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col transition-all">
      <header className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
        <h3 className="text-base font-bold text-slate-900">Support Chat</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </header>
      
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'bot' && <div className="w-7 h-7 rounded-full bg-sky-200 text-sky-700 text-sm font-bold flex items-center justify-center flex-shrink-0">B</div>}
            <div
              className={`max-w-xs sm:max-w-sm rounded-lg px-3 py-2 text-sm ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-200 text-sky-700 text-sm font-bold flex items-center justify-center flex-shrink-0">B</div>
                <div className="bg-slate-100 text-slate-800 rounded-lg px-3 py-2 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-3 border-t border-slate-200">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full bg-slate-100 border border-slate-300 rounded-lg py-2 px-3 text-sm placeholder:text-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="bg-sky-600 text-white p-2 rounded-lg disabled:opacity-50 hover:bg-sky-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086L2.279 16.76a.75.75 0 0 0 .95.826l16-5.333a.75.75 0 0 0 0-1.418l-16-5.333Z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default Chatbot;
