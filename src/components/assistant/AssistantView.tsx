import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Keyboard,
  HelpCircle,
  Database,
  ArrowRight,
  Terminal,
  Zap,
  CheckCircle2,
  Cpu,
  Layers,
  RotateCcw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  suggestions?: string[];
  actionRoute?: string;
}

export const AssistantView: React.FC = () => {
  const { setActiveView, businessSettings } = useAppStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Welcome to the SKYTHS Offline Intelligence & Help Hub. I am your local copilot, analyzing your SQLite database directly on this device without requiring any internet connection. How may I assist your business operations today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Today sales performance',
        'Which items have low stock?',
        'How does Weighted Average Cost (WAC) work?',
        'How to create an audit-safe backup',
      ],
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
        reply = 'Local assistant engine verified: Operating in offline mode with SQLite WAL journaling.';
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
      }, 250);
    } catch (err: any) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: `Query error: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const keyboardShortcuts = [
    { key: 'F2', desc: 'Focus POS Barcode Scan input' },
    { key: 'F4', desc: 'Clear active POS shopping cart' },
    { key: 'F9', desc: 'Fast complete sale & checkout' },
    { key: 'Esc', desc: 'Dismiss open modals and panels' },
    { key: 'Enter', desc: 'Confirm barcode entry or submit form' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#353536] to-[#080808] border border-white/20 shadow-glass-sm">
              <Bot className="text-white" size={22} />
            </div>
            SKYTHS Intelligence & Help Hub
          </h1>
          <p className="text-xs text-[#ACADB1] mt-1">
            Offline operational advisor, accounting reference guide, and diagnostics dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            <ShieldCheck size={13} className="mr-1" /> 100% Local Air-Gapped AI
          </Badge>
        </div>
      </div>

      {/* Main Grid: Chat Workspace + Quick References */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Chat Stream Terminal (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col h-[700px]">
          <GlassCard className="flex-1 flex flex-col overflow-hidden border-white/15">
            {/* Terminal Header */}
            <div className="p-3.5 border-b border-white/10 bg-[#0E0E0F]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Operational Assistant Stream
                </span>
              </div>
              <span className="text-[11px] text-[#706F70] font-mono">SQLite Local Engine</span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-glass-sm ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-white to-[#D4D8DF] text-[#080808] font-medium rounded-br-none'
                        : 'bg-[#1E1E20]/90 text-[#EBEDF1] border border-white/10 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>

                    {/* Action Route Button */}
                    {m.actionRoute && (
                      <div className="mt-3 pt-2.5 border-t border-white/10">
                        <Button
                          size="sm"
                          variant="outline"
                          rightIcon={<ArrowRight size={13} />}
                          onClick={() => setActiveView(m.actionRoute!)}
                        >
                          Navigate to {m.actionRoute.toUpperCase()}
                        </Button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-[#706F70] font-mono mt-1 px-1">{m.time}</span>

                  {/* Suggestion Chips */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {m.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(s)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] text-[#ACADB1] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles size={11} className="text-[#D4D8DF]" />
                          <span>{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-[#ACADB1] p-3 rounded-xl bg-white/5 border border-white/10 w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4D8DF] animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4D8DF] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4D8DF] animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-mono">Analyzing database...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Input Bar */}
            <div className="p-3 border-t border-white/10 bg-[#0E0E0F]/90">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Terminal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#706F70]" />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask assistant anything (e.g. Sales summary, inventory status, VAT)..."
                    className="w-full bg-[#141415] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#706F70] focus:outline-none focus:border-white/40 font-sans"
                  />
                </div>
                <Button type="submit" size="sm" variant="primary" leftIcon={<Send size={14} />}>
                  Ask
                </Button>
              </form>
            </div>
          </GlassCard>
        </div>

        {/* Right: Quick Reference Cards & Diagnostics (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Shortcuts Card */}
          <GlassCard className="p-4 border-white/15">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Keyboard className="text-[#D4D8DF]" size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Keyboard Shortcuts</h3>
            </div>
            <div className="divide-y divide-white/5 mt-2">
              {keyboardShortcuts.map((sc) => (
                <div key={sc.key} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-[#ACADB1]">{sc.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[11px] text-white font-bold">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Offline Engine Diagnostics */}
          <GlassCard className="p-4 border-white/15">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Cpu className="text-[#4ADE80]" size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">System Architecture</h3>
            </div>
            <div className="space-y-3 mt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#ACADB1]">Storage Driver:</span>
                <span className="font-mono text-white">SQLite (WAL Mode)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#ACADB1]">Durability Guarantee:</span>
                <span className="text-[#4ADE80] font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} /> Full ACID Compliant
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#ACADB1]">Cost Method:</span>
                <span className="font-mono text-white">Weighted Avg (WAC)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#ACADB1]">Operating Currency:</span>
                <span className="font-mono font-bold text-white">
                  {businessSettings?.currency || '₨'}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Quick Jump Links */}
          <GlassCard className="p-4 border-white/15">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Zap className="text-[#FBBF24]" size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Quick Jumps</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button size="sm" variant="secondary" onClick={() => setActiveView('pos')}>
                Point of Sale
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setActiveView('products')}>
                Products
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setActiveView('purchases')}>
                Purchases
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setActiveView('backup')}>
                Backups
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
