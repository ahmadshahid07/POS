import React, { useState } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import {
  Search,
  Kanban,
  Settings,
  Clock,
  Sparkles,
  Moon,
  Sun,
  LayoutDashboard,
  ShoppingCart,
  Wallet,
} from 'lucide-react';

export const CorbelDock: React.FC = () => {
  const {
    theme,
    toggleTheme,
    activeView,
    setActiveView,
    setSearchOpen,
  } = useCorbelStore();

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isDark = theme === 'dark';

  return (
    <aside className="fixed left-5 top-1/2 -translate-y-1/2 z-50 select-none">
      <div
        className={`flex flex-col items-center gap-3 py-4 px-2 rounded-full transition-all duration-300 ${
          isDark
            ? 'bg-[#14171C]/90 backdrop-blur-xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.6)]'
            : 'bg-[#121316] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]'
        }`}
      >
        {/* 1. Quick Search */}
        <div className="relative group">
          <button
            onClick={() => setSearchOpen(true)}
            onMouseEnter={() => setHoveredItem('search')}
            onMouseLeave={() => setHoveredItem(null)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-150"
            title="Search"
          >
            <Search size={18} />
          </button>
          {hoveredItem === 'search' && (
            <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-medium bg-black text-white whitespace-nowrap shadow-md pointer-events-none z-50">
              Quick Search (Ctrl+K)
            </div>
          )}
        </div>

        {/* 2. Point of Sale Register */}
        <div className="relative group">
          <button
            onClick={() => setActiveView('pos')}
            onMouseEnter={() => setHoveredItem('pos')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${
              activeView === 'pos'
                ? 'bg-emerald-500 text-black shadow-lg font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShoppingCart size={18} />
          </button>
          {hoveredItem === 'pos' && (
            <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-medium bg-black text-white whitespace-nowrap shadow-md pointer-events-none z-50">
              POS Register & Billing
            </div>
          )}
        </div>

        {/* 3. Workspace / Kanban (With Badge '2') */}
        <div className="relative group">
          <button
            data-dock="workspace"
            onClick={() => setActiveView(activeView === 'workspace' ? 'dashboard' : 'workspace')}
            onMouseEnter={() => setHoveredItem('workspace')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${
              activeView === 'workspace'
                ? 'bg-white text-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Kanban size={18} />
            {/* Notification Badge '2' */}
            <span
              className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center transition-transform ${
                activeView === 'workspace'
                  ? 'bg-black text-white'
                  : 'bg-white text-black shadow-sm'
              }`}
            >
              2
            </span>
          </button>
          {hoveredItem === 'workspace' && (
            <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-medium bg-black text-white whitespace-nowrap shadow-md pointer-events-none z-50">
              Workspace (Spring Launch)
            </div>
          )}
        </div>

        {/* 4. Settings */}
        <div className="relative group">
          <button
            onClick={() => setActiveView('settings')}
            onMouseEnter={() => setHoveredItem('settings')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${
              activeView === 'settings'
                ? 'bg-white text-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings size={18} />
          </button>
          {hoveredItem === 'settings' && (
            <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-medium bg-black text-white whitespace-nowrap shadow-md pointer-events-none z-50">
              System Settings & Backups
            </div>
          )}
        </div>

        {/* 4. Timeline / Clock */}
        <div className="relative group">
          <button
            onClick={() => setActiveView('orders')}
            onMouseEnter={() => setHoveredItem('clock')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${
              activeView === 'orders'
                ? 'bg-white text-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Clock size={18} />
          </button>
          {hoveredItem === 'clock' && (
            <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-medium bg-black text-white whitespace-nowrap shadow-md pointer-events-none z-50">
              Order Timeline & Activity
            </div>
          )}
        </div>

        {/* 5. AI Sparkles Assistant */}
        <div className="relative group">
          <button
            onClick={() => setActiveView('messages')}
            onMouseEnter={() => setHoveredItem('ai')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${
              activeView === 'messages'
                ? 'bg-white text-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles size={18} />
          </button>
          {hoveredItem === 'ai' && (
            <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-medium bg-black text-white whitespace-nowrap shadow-md pointer-events-none z-50">
              AI Copilot & Messages
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-5 h-[1px] bg-white/15 my-0.5" />

        {/* 6. Theme Toggle (Moon / Sun) */}
        <div className="relative group">
          <button
            data-dock="theme"
            onClick={toggleTheme}
            onMouseEnter={() => setHoveredItem('theme')}
            onMouseLeave={() => setHoveredItem(null)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-150"
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {isDark ? (
              <Sun size={18} className="text-amber-300 transition-transform hover:rotate-45" />
            ) : (
              <Moon size={18} className="text-slate-300 transition-transform hover:-rotate-12" />
            )}
          </button>
          {hoveredItem === 'theme' && (
            <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-medium bg-black text-white whitespace-nowrap shadow-md pointer-events-none z-50">
              {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
