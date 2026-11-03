import React from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import { X, CheckCircle, AlertTriangle, Bell, Clock } from 'lucide-react';

export const CorbelNotificationsModal: React.FC = () => {
  const { theme, isNotificationsOpen, setNotificationsOpen } = useCorbelStore();

  if (!isNotificationsOpen) return null;

  const isDark = theme === 'dark';

  const notifications = [
    { id: '1', title: 'New Online Order #ORD-8821', desc: 'Sophia Bennett placed order for $245.00', time: '12m ago', type: 'order' },
    { id: '2', title: 'Review Card Overdue Alert', desc: 'Packaging inserts, print proof is due tomorrow', time: '1h ago', type: 'urgent' },
    { id: '3', title: 'Daily Cash Reconciled', desc: 'Closing drawer balanced at $1,420.00', time: '4h ago', type: 'success' },
    { id: '4', title: 'Stock Threshold Warning', desc: 'Brushed Brass Taper Candle Holders at 38 units', time: '6h ago', type: 'stock' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-6 bg-black/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-sm rounded-3xl border shadow-2xl p-4 select-none transition-all duration-200 ${
          isDark
            ? 'bg-[#15181D] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Bell size={15} />
            <h3 className="text-xs font-bold tracking-tight">Activity & Alerts</h3>
          </div>
          <button
            onClick={() => setNotificationsOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-2 mt-3 max-h-96 overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-2xl border transition-colors ${
                isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-slate-900 dark:text-white">{n.title}</span>
                <span className="text-[10px] text-slate-400">{n.time}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{n.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

