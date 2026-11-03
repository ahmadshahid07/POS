import React, { useState, useEffect } from 'react';
import { useCorbelStore, CorbelView } from '../../store/useCorbelStore';
import { Bell, ChevronDown, Check } from 'lucide-react';

export const CorbelHeader: React.FC = () => {
  const {
    theme,
    activeView,
    setActiveView,
    liveUsersCount,
    setNotificationsOpen,
  } = useCorbelStore();

  const [currentLive, setCurrentLive] = useState(liveUsersCount);
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('Corbel Supply Co.');

  const isDark = theme === 'dark';

  // Subtle live user fluctuation effect like in video (1284 -> 1290)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLive((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(Math.max(prev + delta, 1280), 1298);
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: CorbelView; label: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'pos', label: 'POS Register' },
    { id: 'products', label: 'Products & Stock' },
    { id: 'purchases', label: 'Purchases' },
    { id: 'orders', label: 'Orders & Sales', badge: 14 },
    { id: 'customers', label: 'Customers' },
    { id: 'finance', label: 'Finance & Cash' },
    { id: 'analytics', label: 'Analytics & P&L' },
    { id: 'messages', label: 'AI Copilot', badge: 3 },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="relative w-full z-40 px-6 py-4 flex items-center justify-between select-none">
      {/* 1. Brand Logo & Switcher */}
      <div className="relative">
        <button
          onClick={() => setIsBrandMenuOpen(!isBrandMenuOpen)}
          className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all ${
            isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
          }`}
        >
          {/* Geometric Monogram Icon */}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black transition-all ${
              isDark
                ? 'bg-white text-black shadow-md'
                : 'bg-[#121316] text-white shadow-sm'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm4 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <span
            className={`font-bold tracking-tight text-sm font-sans ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {selectedBrand}
          </span>
          <ChevronDown size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
        </button>

        {/* Brand Dropdown Menu */}
        {isBrandMenuOpen && (
          <div
            className={`absolute left-0 mt-2 w-56 rounded-2xl p-1.5 shadow-2xl border backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150 ${
              isDark
                ? 'bg-[#181C23]/95 border-white/10 text-white'
                : 'bg-white/95 border-slate-200 text-slate-800'
            }`}
          >
            {['Corbel Supply Co.', 'SKYTHS Enterprise POS', 'Corbel Flagship Store'].map((b) => (
              <button
                key={b}
                onClick={() => {
                  setSelectedBrand(b);
                  setIsBrandMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedBrand === b
                    ? isDark
                      ? 'bg-white/10 text-white font-semibold'
                      : 'bg-slate-100 text-black font-semibold'
                    : isDark
                    ? 'hover:bg-white/5 text-slate-300'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span>{b}</span>
                {selectedBrand === b && <Check size={14} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Centered Floating Pill Navigation */}
      <nav
        className={`hidden md:flex items-center p-1 rounded-full border transition-all duration-300 ${
          isDark
            ? 'bg-[#15181D]/90 border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
        }`}
      >
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`relative px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                isActive
                  ? isDark
                    ? 'bg-white text-black shadow-md font-bold scale-[1.02]'
                    : 'bg-[#121316] text-white shadow-md font-bold scale-[1.02]'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-none ${
                    isActive
                      ? isDark
                        ? 'bg-slate-200 text-black'
                        : 'bg-slate-800 text-white'
                      : isDark
                      ? 'bg-[#22272F] text-slate-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Right Status & User Actions */}
      <div className="flex items-center gap-3">
        {/* Live Now Indicator Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
            isDark
              ? 'bg-[#15181D]/90 border-white/10 text-slate-300'
              : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono font-bold tracking-tight text-[11px]">
            {currentLive.toLocaleString()}
          </span>
          <span className="text-slate-400 text-[11px]">live now</span>
        </div>

        {/* Notifications Bell */}
        <button
          onClick={() => setNotificationsOpen(true)}
          className={`relative w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
            isDark
              ? 'bg-[#15181D] border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
          }`}
          title="Notifications"
        >
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-black" />
        </button>

        {/* User Profile Avatar (MR) */}
        <div
          className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${
            isDark
              ? 'bg-[#22272F] border-white/10 text-white hover:ring-2 hover:ring-white/20'
              : 'bg-slate-100 border-slate-200 text-slate-900 hover:ring-2 hover:ring-black/10'
          }`}
          title="Marcus Rivera (Admin)"
        >
          MR
        </div>
      </div>
    </header>
  );
};

