import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Bot, X, Send, Sparkles, CornerDownLeft, ShieldCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  suggestions?: string[];
  actionRoute?: string;
}

export const SkythsAssistant: React.FC = () => {
  const { isAssistantOpen, setAssistantOpen, setActiveView } = useAppStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Hello! I am your SKYTHS Assistant, operating 100% locally on your computer. How can I help you manage your business today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: ['Today sales', 'Low stock products', 'How to process a sale', 'How to backup database'],
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsTyping(true);

    try {
      let reply = '';
      let suggestions: string[] | undefined = undefined;
      let actionRoute: string | undefined = undefined;

      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const res = await (window as any).skythsAPI.queryAssistant(textToSend);
        reply = res.reply;
        suggestions = res.suggestions;
        actionRoute = res.actionRoute;
      } else {
        reply = 'Assistant is active. All business modules are functioning in offline mode.';
      }

      setTimeout(() => {
        setIsTyping(false);
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions,
          actionRoute,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }, 300);
    } catch (err: any) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: `Error processing query: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isAssistantOpen && (
        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-white text-[#080808] shadow-glass-lg hover:shadow-glass-xl hover:scale-105 transition-all duration-200 cursor-pointer flex items-center gap-2 group"
          title="Open SKYTHS Assistant"
        >
          <Bot size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-semibold pr-1">Assistant</span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isAssistantOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[520px] flex flex-col rounded-2xl bg-[#141415] border border-white/15 shadow-glass-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 bg-[#0E0E0F] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-white/10 text-white">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  SKYTHS Assistant
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-[#4ADE80] font-mono">
                    Offline
                  </span>
                </h3>
                <p className="text-[10px] text-[#ACADB1]">Instant Local Guidance & Live Query Engine</p>
              </div>
            </div>

            <button
              onClick={() => setAssistantOpen(false)}
              className="p-1 text-[#ACADB1] hover:text-white rounded-md hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-white text-[#080808] font-medium rounded-tr-sm'
                      : 'bg-[#1E1E20] text-[#EBEDF1] border border-white/10 rounded-tl-sm'
                  }`}
                >
                  {msg.text}

                  {msg.actionRoute && (
                    <div className="mt-2.5 pt-2 border-t border-white/10">
                      <button
                        onClick={() => {
                          setActiveView(msg.actionRoute!);
                          setAssistantOpen(false);
                        }}
                        className="text-[11px] underline underline-offset-2 text-[#4ADE80] hover:text-white"
                      >
                        → Open {msg.actionRoute.toUpperCase()} screen
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-[#706F70] mt-1 px-1">{msg.time}</span>

                {/* Suggestions chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#D4D8DF] hover:bg-white/15 hover:text-white transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-xs text-[#ACADB1] p-2 bg-[#1E1E20] rounded-xl w-24">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-white/10 bg-[#0E0E0F]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything or request live statistics..."
                className="flex-1 bg-[#141415] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#706F70] focus:outline-none focus:border-white/30"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 rounded-xl bg-white text-[#080808] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-all"
              >
                <CornerDownLeft size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
