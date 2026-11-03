import React, { useState } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import { Send, Bot, Check, CheckCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'customer' | 'assistant' | 'user';
  name: string;
  avatar: string;
  text: string;
  time: string;
}

export const CorbelMessagesView: React.FC = () => {
  const { theme } = useCorbelStore();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'customer',
      name: 'Sophia Bennett',
      avatar: 'SB',
      text: 'Hi Corbel team, will the sage towel colourway be restocked before November 10th?',
      time: '10:24 AM',
    },
    {
      id: '2',
      sender: 'assistant',
      name: 'Corbel Copilot',
      avatar: 'AI',
      text: 'Checking supplier order PO-2026-92... Estimated delivery to warehouse is Nov 4th. 80 units reserved.',
      time: '10:25 AM',
    },
    {
      id: '3',
      sender: 'user',
      name: 'Marcus Rivera',
      avatar: 'MR',
      text: 'Confirmed with Lucas in logistics. Sophia, we have pre-allocated your set!',
      time: '10:28 AM',
    },
  ]);

  const isDark = theme === 'dark';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      name: 'Marcus Rivera',
      avatar: 'MR',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    try {
      if (window.skythsAPI && typeof window.skythsAPI.askAssistant === 'function') {
        const response = await window.skythsAPI.askAssistant(userText);
        if (response && response.reply) {
          const aiMsg: ChatMessage = {
            id: String(Date.now() + 1),
            sender: 'assistant',
            name: 'Corbel Copilot',
            avatar: 'AI',
            text: response.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, aiMsg]);
        }
      }
    } catch (err) {
      console.warn('AI copilot offline query fallback:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div>
        <h1 className={`text-3xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Messages & AI Copilot
        </h1>
        <p className="text-xs text-slate-400 mt-1">Direct inquiries, order notifications and team notes</p>
      </div>

      <div
        className={`p-6 rounded-3xl border flex flex-col h-[520px] transition-all duration-200 ${
          isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
        }`}
      >
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">
          {messages.map((m) => {
            const isMe = m.sender === 'user';
            const isAI = m.sender === 'assistant';

            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isAI
                      ? 'bg-gradient-to-tr from-indigo-500 to-sky-400 text-white'
                      : isMe
                      ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                      : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isAI ? <Bot size={13} /> : m.avatar}
                </div>

                <div>
                  <div className={`flex items-center gap-2 mb-1 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                    <span className="font-semibold text-slate-400">{m.name}</span>
                    <span className="text-[9px] text-slate-500">{m.time}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? isDark
                          ? 'bg-white text-black rounded-tr-sm shadow-md'
                          : 'bg-[#121316] text-white rounded-tr-sm shadow-md'
                        : isAI
                        ? isDark
                          ? 'bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 rounded-tl-sm'
                          : 'bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-tl-sm'
                        : isDark
                        ? 'bg-[#1C2028] border border-white/5 text-slate-200 rounded-tl-sm'
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or ask AI Copilot..."
            className={`flex-1 px-4 py-2.5 rounded-full text-xs border outline-none ${
              isDark
                ? 'bg-slate-900 border-white/10 text-white focus:border-white/30'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
            }`}
          />
          <button
            type="submit"
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
              isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-[#121316] text-white hover:bg-black'
            }`}
          >
            <span>Send</span>
            <Send size={12} />
          </button>
        </form>
      </div>
    </div>
  );
};

