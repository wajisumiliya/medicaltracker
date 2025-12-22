
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, Key, AlertCircle } from 'lucide-react';
import { GeminiService } from '../services/gemini';
import { StorageService } from '../services/storage';

interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello Sumaiya! I am your Koala AI medical assistant. How can I help you with your pregnancy journey today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyButton, setShowKeyButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setShowKeyButton(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    setShowKeyButton(false);

    // Get context from stored records (Async now)
    const records = await StorageService.getRecords();
    const recordsSummary = records.slice(0, 5).map(r => `${r.date}: ${r.title} (${r.details})`).join('\n');
    const context = `Recent medical history:\n${recordsSummary}`;

    const response = await GeminiService.askKoala(userMessage, context);

    if (response.includes('429')) {
      setShowKeyButton(true);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "The AI quota is currently resting. You can wait a bit or use your own API key to continue.",
        isError: true 
      }]);
    } else {
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm">
            <Bot size={24} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 font-heading text-lg flex items-center gap-2">
              Koala AI 
              <Sparkles size={14} className="text-emerald-400" />
            </h3>
            <p className="text-xs text-gray-400 font-medium">Always here to help</p>
          </div>
        </div>
        {showKeyButton && (
          <button 
            onClick={handleSelectKey}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-600 active:scale-95 transition-all"
          >
            <Key size={14} /> Use Personal Key
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm mt-1
              ${msg.role === 'user' ? 'bg-white border-gray-100 text-gray-600' : (msg.isError ? 'bg-rose-500 border-rose-500' : 'bg-emerald-500 border-emerald-500') + ' text-white'}
            `}>
              {msg.role === 'user' ? <UserIcon size={14} /> : (msg.isError ? <AlertCircle size={14} /> : <Bot size={14} />)}
            </div>
            
            <div className={`
              max-w-[75%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm
              ${msg.role === 'user' 
                ? 'bg-white text-gray-800 border border-gray-100 rounded-tr-sm' 
                : (msg.isError ? 'bg-rose-500' : 'bg-emerald-500') + ' text-white shadow-emerald-100 rounded-tl-sm'}
            `}>
              {msg.text.split('\n').map((line, i) => <p key={i} className="mb-2 last:mb-0">{line}</p>)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-1">
               <Bot size={14} />
             </div>
             <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
               <Loader2 className="animate-spin text-emerald-500" size={20} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 p-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all text-gray-700 placeholder-gray-400"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-200"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};
