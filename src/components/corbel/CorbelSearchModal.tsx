import React, { useState, useEffect } from 'react';
import { useCorbelStore, CorbelView } from '../../store/useCorbelStore';
import { Search, X, ArrowRight, Package, ShoppingCart, Users, Kanban, Zap, Wallet, Truck, Settings, Sparkles } from 'lucide-react';

export const CorbelSearchModal: React.FC = () => {
  const { theme, isSearchOpen, setSearchOpen, setActiveView } = useCorbelStore();
  const [query, setQuery] = useState('');

  const isDark = theme === 'dark';

  // Close on Escape, Open on Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  if (!isSearchOpen) return null;

  const quickLinks: { title: string; category: string; view: CorbelView; icon: any }[] = [
    { title: 'POS Billing & Quick Register', category: 'POS', view: 'pos', icon: ShoppingCart },
    { title: 'Catalog Items & Stock Movements', category: 'Products', view: 'products', icon: Package },
    { title: 'Purchase Orders & Supplier Directory', category: 'Purchases', view: 'purchases', icon: Truck },
    { title: 'Customer Directory & Credit Ledgers', category: 'Customers', view: 'customers', icon: Users },
    { title: 'Cash Drawer Shifts & Operating Expenses', category: 'Finance', view: 'finance', icon: Wallet },
    { title: 'Profit & Loss and Revenue Analytics', category: 'Analytics', view: 'analytics', icon: Zap },
    { title: 'System Settings, Thermal Printers & Backups', category: 'Settings', view: 'settings', icon: Settings },
    { title: 'AI Copilot & Business Assistant', category: 'Assistant', view: 'messages', icon: Sparkles },
    { title: 'Spring Launch Workspace Board', category: 'Workspace', view: 'workspace', icon: Kanban },
  ];

  const filtered = query.trim()
    ? quickLinks.filter((q) => q.title.toLowerCase().includes(query.toLowerCase()) || q.category.toLowerCase().includes(query.toLowerCase()))
    : quickLinks;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden select-none transition-all duration-200 ${isDark
          ? 'bg-[#15181D] border-white/10 text-white'
          : 'bg-white border-slate-200 text-slate-900'
          }`}
      >
        <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search orders, products, customers or spring launch..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-3 max-h-80 overflow-y-auto flex flex-col gap-1">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Suggested Navigation
          </div>
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveView(item.view);
                  setSearchOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-800'
                      }`}
                  >
                    <Icon size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{item.title}</div>
                    <div className="text-[10px] text-slate-400">{item.category}</div>
                  </div>
                </div>
                <ArrowRight size={13} className="text-slate-400" />
              </button>
            );
          })}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↓</kbd></span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};

