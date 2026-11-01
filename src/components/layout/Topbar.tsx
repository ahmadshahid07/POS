import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Search,
  Bell,
  HelpCircle,
  User,
  Minus,
  Square,
  X,
  ShieldAlert,
} from 'lucide-react';

interface TopbarProps {
  currentViewTitle: string;
}

export const Topbar: React.FC<TopbarProps> = ({ currentViewTitle }) => {
  const { user, globalSearch, setGlobalSearch, toggleAssistant, notifications, setActiveView } = useAppStore();

  const handleMinimize = () => {
    if (typeof window !== 'undefined' && (window as any).skythsAPI) {
      (window as any).skythsAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (typeof window !== 'undefined' && (window as any).skythsAPI) {
      (window as any).skythsAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && (window as any).skythsAPI) {
      (window as any).skythsAPI.closeWindow();
    }
  };

  const unreadCount = notifications.length;

  return (
    <header className="h-14 border-b border-white/10 bg-[#0E0E0F]/80 backdrop-blur-md px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Breadcrumbs & View Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-[#706F70]">
          <span>SKYTHS</span>
          <span>/</span>
          <span className="text-[#D4D8DF] font-medium uppercase tracking-wider">{currentViewTitle}</span>
        </div>
      </div>

      {/* Center: Global Quick Search */}
      <div className="relative w-72 max-w-sm hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#706F70]" />
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Global search (Product, SKU, Invoice)..."
          className="w-full bg-[#141415] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#EBEDF1] placeholder-[#706F70] focus:outline-none focus:border-white/30 transition-all"
        />
      </div>

      {/* Right: Actions, Profile, Window Controls */}
      <div className="flex items-center gap-3">
        {/* Help Chatbot Trigger */}
        <button
          onClick={toggleAssistant}
          title="Open SKYTHS Assistant"
          className="p-1.5 rounded-lg text-[#ACADB1] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs"
        >
          <HelpCircle size={16} />
          <span className="hidden sm:inline">Assistant</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => setActiveView('notifications')}
          title="Notifications"
          className="relative p-1.5 rounded-lg text-[#ACADB1] hover:text-white hover:bg-white/10 transition-colors"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#DC2626]" />
          )}
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white/5 border border-white/10">
          <div className="w-6 h-6 rounded-full bg-[#353536] flex items-center justify-center text-xs text-white font-medium">
            <User size={13} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-medium text-white leading-tight">{user?.username || 'User'}</span>
            <span className="text-[10px] text-[#ACADB1] leading-tight uppercase font-mono">{user?.role || 'cashier'}</span>
          </div>
        </div>

        {/* Window controls for desktop */}
        <div className="flex items-center pl-2 ml-1 border-l border-white/10 gap-1">
          <button
            onClick={handleMinimize}
            className="p-1.5 rounded hover:bg-white/10 text-[#ACADB1] hover:text-white"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1.5 rounded hover:bg-white/10 text-[#ACADB1] hover:text-white"
            title="Maximize"
          >
            <Square size={12} />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-[#DC2626]/40 text-[#ACADB1] hover:text-white"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
