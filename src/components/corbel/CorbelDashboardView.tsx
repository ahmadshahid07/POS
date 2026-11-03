import React, { useState, useEffect } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import { useCounterAnimation } from '../../utils/useCounterAnimation';
import { GaugeMeter } from './GaugeMeter';
import { AnnualRevenueBarChart } from './AnnualRevenueBarChart';
import {
  Clock,
  BarChart2,
  Download,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';

export const CorbelDashboardView: React.FC = () => {
  const {
    theme,
    setActiveView,
    dashboardSubTab,
    setDashboardSubTab,
  } = useCorbelStore();

  const isDark = theme === 'dark';
  const [liveMetrics, setLiveMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        if (window.skythsAPI && typeof window.skythsAPI.getDashboardMetrics === 'function') {
          const m = await window.skythsAPI.getDashboardMetrics();
          if (m) setLiveMetrics(m);
        }
      } catch (err) {
        console.warn('Dashboard metrics fallback to video baseline:', err);
      }
    };
    fetchMetrics();
  }, []);

  const targetSales = liveMetrics && liveMetrics.sales_this_month > 0 ? liveMetrics.sales_this_month : 48320;
  const targetRevenue = liveMetrics && liveMetrics.net_profit_month > 0 ? liveMetrics.net_profit_month : 39500;
  const targetUnits = liveMetrics && liveMetrics.total_inventory_quantity > 0 ? liveMetrics.total_inventory_quantity : 3842;

  // Animated Counter Values matching video transition ($25,018 -> $48,320, etc.)
  const activeSalesDisplay = useCounterAnimation(targetSales, Math.round(targetSales * 0.52), { prefix: '$', duration: 1100 });
  const revenueDisplay = useCounterAnimation(targetRevenue, Math.round(targetRevenue * 0.52), { prefix: '$', duration: 1100 });
  const unitsSoldDisplay = useCounterAnimation(targetUnits, Math.round(targetUnits * 0.52), { duration: 1100 });
  const conversionRateDisplay = useCounterAnimation(4.8, 2.5, { decimals: 1, suffix: '%', duration: 1100 });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Subheader Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <h1 className={`text-3xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Dashboard
          </h1>

          {/* Subtab Segmented Pill */}
          <div
            className={`flex items-center p-1 rounded-full border transition-all ${isDark
              ? 'bg-[#15181D] border-white/10'
              : 'bg-slate-200/70 border-slate-300/40'
              }`}
          >
            {(['overview', 'online', 'instore'] as const).map((tab) => {
              const active = dashboardSubTab === tab;
              const labels = {
                overview: 'Overview',
                online: 'Online',
                instore: 'In store',
              };
              return (
                <button
                  key={tab}
                  onClick={() => setDashboardSubTab(tab)}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold capitalize transition-all duration-150 ${active
                    ? isDark
                      ? 'bg-white text-black shadow-sm font-bold'
                      : 'bg-white text-slate-900 shadow-sm font-bold'
                    : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date and Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Date range indicator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mr-1">
            <Clock size={13} />
            <span>October 2026, month to date</span>
          </div>

          {/* Full Analytics Button */}
          <button
            onClick={() => setActiveView('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${isDark
              ? 'bg-[#15181D] border-white/10 text-slate-200 hover:bg-white/10 shadow-sm'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm'
              }`}
          >
            <BarChart2 size={13} />
            <span>Full analytics</span>
          </button>

          {/* Export Button */}
          <button
            onClick={() => alert('Exporting dashboard report as CSV/PDF...')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-md ${isDark
              ? 'bg-white text-black hover:bg-slate-100 font-bold'
              : 'bg-[#121316] text-white hover:bg-black font-bold'
              }`}
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active sales (Dark High-Contrast Card) */}
        <div
          className={`relative p-5 rounded-3xl transition-all duration-200 flex flex-col justify-between ${isDark
            ? 'bg-[#15181D] border border-white/10 shadow-lg text-white'
            : 'bg-[#121316] text-white shadow-xl'
            }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                Active sales
                <Info size={11} className="opacity-70" />
              </span>
            </div>

            <div className="text-3xl font-black tracking-tight mt-2 font-mono">
              {activeSalesDisplay}
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                + 14.2%
              </span>
              <span className="text-[11px] text-slate-400">vs last month</span>
            </div>
          </div>

          {/* Mini Chart Graphic: 4 rounded pill vertical bars */}
          <div className="absolute right-5 top-8 flex items-end gap-1.5 h-10">
            <div className="w-2.5 h-4 bg-slate-600 rounded-full" />
            <div className="w-2.5 h-7 bg-slate-500 rounded-full" />
            <div className="w-2.5 h-5 bg-slate-400 rounded-full" />
            <div className="w-2.5 h-10 bg-white rounded-full animate-pulse" />
          </div>

          <button
            onClick={() => setActiveView('orders')}
            className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400 hover:text-white flex items-center justify-between group transition-colors"
          >
            <span>See orders</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Card 2: Revenue */}
        <div
          className={`relative p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
            }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                Revenue
                <Info size={11} className="opacity-70" />
              </span>
            </div>

            <div className="text-3xl font-black tracking-tight mt-2 font-mono">
              {revenueDisplay}
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold text-emerald-500">
                + 7.6%
              </span>
              <span className="text-[11px] text-slate-400">vs last month</span>
            </div>
          </div>

          {/* Mini Sparkline Curve */}
          <div className="absolute right-5 top-8 w-16 h-8">
            <svg viewBox="0 0 60 30" className="w-full h-full overflow-visible">
              <path
                d="M 2 24 Q 15 22, 25 12 T 45 18 T 58 4"
                fill="none"
                stroke={isDark ? '#FFFFFF' : '#0F172A'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="58" cy="4" r="2.5" fill={isDark ? '#FFFFFF' : '#0F172A'} />
            </svg>
          </div>

          <button
            onClick={() => setActiveView('analytics')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-between group transition-colors"
          >
            <span>See analytics</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Card 3: Units sold */}
        <div
          className={`relative p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
            }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                Units sold
                <Info size={11} className="opacity-70" />
              </span>
            </div>

            <div className="text-3xl font-black tracking-tight mt-2 font-mono">
              {unitsSoldDisplay}
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold text-emerald-500">
                + 8.4%
              </span>
              <span className="text-[11px] text-slate-400">vs last month</span>
            </div>
          </div>

          {/* Mini Circular Progress Ring 78% */}
          <div className="absolute right-5 top-8 w-10 h-10 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="20" cy="20" r="14" fill="none" stroke={isDark ? '#262D38' : '#E2E8F0'} strokeWidth="3" />
              <circle
                cx="20"
                cy="20"
                r="14"
                fill="none"
                stroke={isDark ? '#FFFFFF' : '#0F172A'}
                strokeWidth="3"
                strokeDasharray="88"
                strokeDashoffset="20"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[9px] font-bold font-mono">78%</span>
          </div>

          <button
            onClick={() => setActiveView('products')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-between group transition-colors"
          >
            <span>See products</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Card 4: Conversion rate */}
        <div
          className={`relative p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
            }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                Conversion rate
                <Info size={11} className="opacity-70" />
              </span>
            </div>

            <div className="text-3xl font-black tracking-tight mt-2 font-mono">
              {conversionRateDisplay}
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold text-slate-500">
                - 0.2 pt
              </span>
              <span className="text-[11px] text-slate-400">vs last month</span>
            </div>
          </div>

          {/* Mini 7-Bar Chart */}
          <div className="absolute right-5 top-8 flex items-end gap-1 h-8">
            {[10, 14, 18, 12, 22, 16, 26].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full ${i === 6
                  ? isDark ? 'bg-white' : 'bg-slate-900'
                  : isDark ? 'bg-slate-700' : 'bg-slate-300'
                  }`}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>

          <button
            onClick={() => setActiveView('analytics')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-between group transition-colors"
          >
            <span>See funnel</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 3. Lower Asymmetric Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Sales performance Radial Gauge Card (38% width -> col-span-5) */}
        <div
          className={`lg:col-span-5 p-6 rounded-3xl flex flex-col justify-between transition-all duration-200 ${isDark
            ? 'bg-[#15181D] border border-white/10 shadow-lg text-white'
            : 'bg-[#121316] text-white shadow-xl'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-bold tracking-tight text-white text-sm">
                Sales performance
              </span>
              <Info size={12} className="opacity-70 cursor-pointer" />
            </div>
          </div>

          {/* The Speedometer Radial Gauge */}
          <div className="flex-1 flex items-center justify-center py-2">
            <GaugeMeter
              value={86}
              maxValue={100}
              delta={3}
              statusText="Ahead of plan"
              subText="Both channels beat last month. Online did most of the lifting."
              isDark={true}
            />
          </div>
        </div>

        {/* Right: Revenue Annual 12-Month Bar Chart Card (62% width -> col-span-7) */}
        <div
          className={`lg:col-span-7 p-6 rounded-3xl border flex flex-col justify-between transition-all duration-200 ${isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
            }`}
        >
          <AnnualRevenueBarChart isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

