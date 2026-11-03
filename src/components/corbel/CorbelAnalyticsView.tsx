import React, { useState, useEffect } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import { useCounterAnimation } from '../../utils/useCounterAnimation';
import { AnalyticsRevenueChart } from './AnalyticsRevenueChart';
import { ProfitAndLossReport } from '../../types';
import { Download, ToggleLeft, ToggleRight, ArrowUpRight, DollarSign, TrendingUp, TrendingDown, FileText } from 'lucide-react';

export const CorbelAnalyticsView: React.FC = () => {
  const {
    theme,
    analyticsRange,
    setAnalyticsRange,
    analyticsChannel,
    setAnalyticsChannel,
    analyticsVsPrevious,
    toggleAnalyticsVsPrevious,
  } = useCorbelStore();

  const isDark = theme === 'dark';
  const [pnl, setPnl] = useState<ProfitAndLossReport | null>(null);

  useEffect(() => {
    const fetchPnl = async () => {
      try {
        if (window.skythsAPI && typeof window.skythsAPI.getProfitAndLoss === 'function') {
          const today = new Date().toISOString().split('T')[0];
          const firstDay = today.slice(0, 7) + '-01';
          const res = await window.skythsAPI.getProfitAndLoss(firstDay, today);
          if (res) setPnl(res);
        }
      } catch (err) {
        console.warn('P&L fetch fallback:', err);
      }
    };
    fetchPnl();
  }, [analyticsRange]);

  // Smooth counter animations for the 5 cards ($30,467 -> $37,163, 400 -> 532, etc.)
  const revenueVal = useCounterAnimation(37163, 30467, { prefix: '$', duration: 1000 });
  const ordersVal = useCounterAnimation(532, 400, { duration: 1000 });
  const aovVal = useCounterAnimation(69.87, 46.49, { prefix: '$', decimals: 2, duration: 1000 });
  const conversionVal = useCounterAnimation(4.53, 2.53, { decimals: 2, suffix: '%', duration: 1000 });
  const returningVal = useCounterAnimation(38.7, 16.6, { decimals: 1, suffix: '%', duration: 1000 });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Subheader Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className={`text-3xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Analytics
          </h1>

          {/* Time Range Pills: 7D | 30D | 90D | 12M */}
          <div
            className={`flex items-center p-1 rounded-full border transition-all ${isDark
              ? 'bg-[#15181D] border-white/10'
              : 'bg-slate-200/70 border-slate-300/40'
              }`}
          >
            {(['7D', '30D', '90D', '12M'] as const).map((r) => {
              const active = analyticsRange === r;
              return (
                <button
                  key={r}
                  onClick={() => setAnalyticsRange(r)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${active
                    ? isDark
                      ? 'bg-white text-black shadow-sm font-bold'
                      : 'bg-white text-slate-900 shadow-sm font-bold'
                    : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {r}
                </button>
              );
            })}
          </div>

          {/* Channel Filter Pills: All | Online | In store */}
          <div
            className={`flex items-center p-1 rounded-full border transition-all ${isDark
              ? 'bg-[#15181D] border-white/10'
              : 'bg-slate-200/70 border-slate-300/40'
              }`}
          >
            {(['all', 'online', 'instore'] as const).map((ch) => {
              const active = analyticsChannel === ch;
              const labels = { all: 'All', online: 'Online', instore: 'In store' };
              return (
                <button
                  key={ch}
                  onClick={() => setAnalyticsChannel(ch)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all duration-150 ${active
                    ? isDark
                      ? 'bg-white text-black shadow-sm font-bold'
                      : 'bg-white text-slate-900 shadow-sm font-bold'
                    : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {labels[ch]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Controls: vs previous period toggle & Export CSV */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleAnalyticsVsPrevious}
            className="flex items-center gap-2 text-xs font-medium cursor-pointer"
          >
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${analyticsVsPrevious
                ? isDark ? 'bg-white' : 'bg-slate-900'
                : isDark ? 'bg-slate-700' : 'bg-slate-300'
                }`}
            >
              <div
                className={`w-4 h-4 rounded-full transition-transform ${analyticsVsPrevious
                  ? isDark ? 'bg-black translate-x-4' : 'bg-white translate-x-4'
                  : isDark ? 'bg-slate-400 translate-x-0' : 'bg-white translate-x-0'
                  }`}
              />
            </div>
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              vs previous period
            </span>
          </button>

          <button
            onClick={() => alert('Exporting Analytics CSV...')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${isDark
              ? 'bg-[#15181D] border-white/10 text-slate-200 hover:bg-white/10 shadow-sm'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm'
              }`}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Row of 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Revenue (Dark High-Contrast Card) */}
        <div
          className={`relative p-4 rounded-3xl transition-all duration-200 flex flex-col justify-between ${isDark
            ? 'bg-[#15181D] border border-white/10 shadow-lg text-white'
            : 'bg-[#121316] text-white shadow-xl'
            }`}
        >
          <div>
            <div className="text-xs text-slate-400 font-medium">Revenue</div>
            <div className="text-2xl font-black tracking-tight mt-1.5 font-mono">
              {revenueVal}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[10px] font-bold text-emerald-400">+ 8.1%</span>
              <span className="text-[10px] text-slate-400">vs previous</span>
            </div>
          </div>
          {/* Animated Wave Sparkline */}
          <div className="mt-3 w-full h-7 overflow-hidden">
            <svg viewBox="0 0 100 25" className="w-full h-full">
              <path
                d="M 0 15 Q 25 5, 50 16 T 100 10"
                fill="none"
                stroke={isDark ? '#FFFFFF' : '#CBD5E1'}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div
          className={`relative p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
            }`}
        >
          <div>
            <div className="text-xs text-slate-400 font-medium">Orders</div>
            <div className="text-2xl font-black tracking-tight mt-1.5 font-mono">
              {ordersVal}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[10px] font-bold text-emerald-500">+ 7.8%</span>
              <span className="text-[10px] text-slate-400">vs previous</span>
            </div>
          </div>
          <div className="mt-3 w-full h-7 overflow-hidden">
            <svg viewBox="0 0 100 25" className="w-full h-full">
              <path
                d="M 0 18 Q 20 8, 45 15 T 70 8 T 100 16"
                fill="none"
                stroke={isDark ? '#64748B' : '#94A3B8'}
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Average order value */}
        <div
          className={`relative p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
            }`}
        >
          <div>
            <div className="text-xs text-slate-400 font-medium">Average order value</div>
            <div className="text-2xl font-black tracking-tight mt-1.5 font-mono">
              {aovVal}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[10px] font-bold text-emerald-500">+ 0.3%</span>
              <span className="text-[10px] text-slate-400">vs previous</span>
            </div>
          </div>
          <div className="mt-3 w-full h-7 overflow-hidden">
            <svg viewBox="0 0 100 25" className="w-full h-full">
              <path
                d="M 0 14 Q 25 20, 50 10 T 75 16 T 100 12"
                fill="none"
                stroke={isDark ? '#64748B' : '#94A3B8'}
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Conversion */}
        <div
          className={`relative p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
            }`}
        >
          <div>
            <div className="text-xs text-slate-400 font-medium">Conversion</div>
            <div className="text-2xl font-black tracking-tight mt-1.5 font-mono">
              {conversionVal}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[10px] font-bold text-slate-400">+ 0.0 pt</span>
              <span className="text-[10px] text-slate-400">vs previous</span>
            </div>
          </div>
          <div className="mt-3 w-full h-7 overflow-hidden">
            <svg viewBox="0 0 100 25" className="w-full h-full">
              <path
                d="M 0 16 Q 30 14, 60 16 T 100 12"
                fill="none"
                stroke={isDark ? '#64748B' : '#94A3B8'}
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 5: Returning customers */}
        <div
          className={`relative p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
            }`}
        >
          <div>
            <div className="text-xs text-slate-400 font-medium">Returning customers</div>
            <div className="text-2xl font-black tracking-tight mt-1.5 font-mono">
              {returningVal}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[10px] font-bold text-emerald-500">+ 0.3 pt</span>
              <span className="text-[10px] text-slate-400">vs previous</span>
            </div>
          </div>
          <div className="mt-3 w-full h-7 overflow-hidden">
            <svg viewBox="0 0 100 25" className="w-full h-full">
              <path
                d="M 0 20 Q 20 8, 45 16 T 80 10 T 100 14"
                fill="none"
                stroke={isDark ? '#64748B' : '#94A3B8'}
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Lower Section: Revenue Over Time + Online vs in Store */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Revenue Over Time Chart Card (col-span-8 / 65% width) */}
        <div
          className={`lg:col-span-8 p-6 rounded-3xl border flex flex-col justify-between transition-all duration-200 ${isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
            }`}
        >
          <AnalyticsRevenueChart isDark={isDark} />
        </div>

        {/* Right: Online vs in Store Breakdown Card (col-span-4 / 35% width) */}
        <div
          className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-all duration-200 ${isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
            }`}
        >
          <div>
            <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Online vs in store
            </h3>

            {/* Split Percentages Row */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  65%
                </span>
                <span className="text-xs text-slate-400 font-medium">online</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  34%
                </span>
                <span className="text-xs text-slate-400 font-medium">in store</span>
              </div>
            </div>

            {/* Two-Tone Segmented Progress Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex mt-2 bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-l-full transition-all duration-500 ${isDark ? 'bg-white' : 'bg-[#121316]'
                  }`}
                style={{ width: '65%' }}
              />
              <div
                className={`h-full rounded-r-full transition-all duration-500 ${isDark ? 'bg-slate-600' : 'bg-slate-300'
                  }`}
                style={{ width: '35%' }}
              />
            </div>

            {/* Breakdown Items List */}
            <div className="flex flex-col gap-4 mt-6">
              {/* Item 1: Online shop */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-sm mt-1 shrink-0 ${isDark ? 'bg-white' : 'bg-[#121316]'}`} />
                  <div>
                    <h5 className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Online shop
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      382 orders, $63.78 average
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    $24,226
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-500">
                    + 8.8%
                  </span>
                </div>
              </div>

              {/* Item 2: Main St + Harbor */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-sm mt-1 shrink-0 ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`} />
                  <div>
                    <h5 className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Main St + Harbor
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      150 orders, $85.35 average
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    $12,757
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-500">
                    + 6.6%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-white/10 mt-6 flex justify-between items-center text-xs text-slate-400">
            <span>Synchronized across POS registers</span>
            <span className="font-mono text-[11px]">Just now</span>
          </div>
        </div>
      </div>

      {/* 3. Live Profit & Loss Financial Statement */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-4 ${
        isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-emerald-500" />
            <h3 className="font-bold text-base">Profit & Loss Accounting Statement</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Current Accounting Period</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#1D2128] border-white/5' : 'bg-slate-50 border-slate-150'}`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Gross Sales</span>
            <span className="text-xl font-black font-mono text-current">${pnl?.gross_sales?.toFixed(2) || '48,320.00'}</span>
          </div>
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#1D2128] border-white/5' : 'bg-slate-50 border-slate-150'}`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Cost of Goods (COGS)</span>
            <span className="text-xl font-black font-mono text-slate-400">${pnl?.cost_of_goods_sold?.toFixed(2) || '14,210.00'}</span>
          </div>
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#1D2128] border-white/5' : 'bg-slate-50 border-slate-150'}`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Operating Expenses</span>
            <span className="text-xl font-black font-mono text-red-400">-${pnl?.operating_expenses?.toFixed(2) || '2,450.00'}</span>
          </div>
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#1D2128] border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-500/30'}`}>
            <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold block">Net Operating Profit</span>
            <span className="text-xl font-black font-mono text-emerald-500">${pnl?.net_operating_profit?.toFixed(2) || '31,660.00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

