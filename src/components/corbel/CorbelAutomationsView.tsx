import React, { useState } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import { Zap, Play, CheckCircle2, Clock, Settings2 } from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  lastRun: string;
}

const DEMO_RULES: AutomationRule[] = [
  { id: '1', name: 'Low Stock Auto-Draft PO', trigger: 'Stock drops below 10 units', action: 'Draft purchase order to primary supplier', active: true, lastRun: '2 hours ago' },
  { id: '2', name: 'VIP Customer Thank You', trigger: 'Order total > $500', action: 'Send personalized loyalty note and 10% coupon', active: true, lastRun: 'Yesterday' },
  { id: '3', name: 'Daily P&L Ledger Sync', trigger: 'Every day at 11:59 PM', action: 'Calculate gross margins and close cash drawer', active: true, lastRun: '1 day ago' },
  { id: '4', name: 'Unfulfilled Order Alert', trigger: 'Order unfulfilled for > 48h', action: 'Notify fulfillment manager via SMS/Email', active: false, lastRun: '3 days ago' },
];

export const CorbelAutomationsView: React.FC = () => {
  const { theme } = useCorbelStore();
  const [rules, setRules] = useState(DEMO_RULES);

  const isDark = theme === 'dark';

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Automations & Workflows
          </h1>
          <p className="text-xs text-slate-400 mt-1">Event triggers, automated inventory sync and webhook rules</p>
        </div>

        <button
          onClick={() => alert('New automation rule...')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-md transition-all ${
            isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-[#121316] text-white hover:bg-black'
          }`}
        >
          <Zap size={14} />
          <span>New automation</span>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${
              isDark
                ? 'bg-[#15181D] border-white/10 text-white shadow-md'
                : 'bg-white border-slate-200/80 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  rule.active
                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                    : isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Zap size={18} />
              </div>

              <div>
                <h4 className="text-sm font-bold">{rule.name}</h4>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span><strong className="text-slate-600 dark:text-slate-300">When:</strong> {rule.trigger}</span>
                  <span>•</span>
                  <span><strong className="text-slate-600 dark:text-slate-300">Then:</strong> {rule.action}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Last run: {rule.lastRun}
              </span>

              {/* Active Toggle Switch */}
              <button
                onClick={() => toggleRule(rule.id)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  rule.active
                    ? isDark ? 'bg-white' : 'bg-slate-900'
                    : isDark ? 'bg-slate-800' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform ${
                    rule.active
                      ? isDark ? 'bg-black translate-x-5' : 'bg-white translate-x-5'
                      : isDark ? 'bg-slate-500 translate-x-0' : 'bg-white translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

