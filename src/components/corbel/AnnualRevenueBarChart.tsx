import React, { useState } from 'react';

interface MonthData {
  month: string;
  revenue: number;
  orders: number;
  vsLastYear: string;
  isProjected?: boolean;
}

const MONTHS_DATA_2026: MonthData[] = [
  { month: 'Jan', revenue: 18000, orders: 280, vsLastYear: '+12.4%' },
  { month: 'Feb', revenue: 22000, orders: 340, vsLastYear: '+15.1%' },
  { month: 'Mar', revenue: 27500, orders: 410, vsLastYear: '+18.8%' },
  { month: 'Apr', revenue: 25000, orders: 390, vsLastYear: '+9.2%' },
  { month: 'May', revenue: 29000, orders: 460, vsLastYear: '+21.0%' },
  { month: 'Jun', revenue: 38000, orders: 520, vsLastYear: '+28.4%' },
  { month: 'Jul', revenue: 35000, orders: 495, vsLastYear: '+19.6%' },
  { month: 'Aug', revenue: 32000, orders: 470, vsLastYear: '+14.3%' },
  { month: 'Sep', revenue: 36000, orders: 515, vsLastYear: '+22.7%' },
  { month: 'Oct', revenue: 39488, orders: 556, vsLastYear: '+29.5%' },
  { month: 'Nov', revenue: 42000, orders: 590, vsLastYear: '+31.0%', isProjected: true },
  { month: 'Dec', revenue: 48000, orders: 680, vsLastYear: '+35.2%', isProjected: true },
];

const MONTHS_DATA_2025: MonthData[] = [
  { month: 'Jan', revenue: 15000, orders: 240, vsLastYear: '+8.4%' },
  { month: 'Feb', revenue: 18000, orders: 290, vsLastYear: '+10.1%' },
  { month: 'Mar', revenue: 22000, orders: 330, vsLastYear: '+12.8%' },
  { month: 'Apr', revenue: 21000, orders: 320, vsLastYear: '+7.2%' },
  { month: 'May', revenue: 23000, orders: 360, vsLastYear: '+14.0%' },
  { month: 'Jun', revenue: 28000, orders: 410, vsLastYear: '+18.4%' },
  { month: 'Jul', revenue: 27000, orders: 395, vsLastYear: '+13.6%' },
  { month: 'Aug', revenue: 26000, orders: 380, vsLastYear: '+11.3%' },
  { month: 'Sep', revenue: 29000, orders: 420, vsLastYear: '+16.7%' },
  { month: 'Oct', revenue: 30500, orders: 440, vsLastYear: '+18.5%' },
  { month: 'Nov', revenue: 32000, orders: 460, vsLastYear: '+20.0%' },
  { month: 'Dec', revenue: 36000, orders: 510, vsLastYear: '+22.2%' },
];

interface AnnualRevenueBarChartProps {
  isDark?: boolean;
}

export const AnnualRevenueBarChart: React.FC<AnnualRevenueBarChartProps> = ({ isDark = false }) => {
  const [selectedYear, setSelectedYear] = useState<'2025' | '2026'>('2026');
  const [hoveredIndex, setHoveredIndex] = useState<number>(9); // default Oct selected like in video!

  const data = selectedYear === '2026' ? MONTHS_DATA_2026 : MONTHS_DATA_2025;
  const maxRevenue = 60000;
  const avgRevenue = 30000;
  const chartHeight = 170;

  const hoveredData = data[hoveredIndex];

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Revenue
            </span>
            <span className="text-xs text-slate-400 cursor-pointer" title="Annual revenue distribution">ⓘ</span>
          </div>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            ${selectedYear === '2026' ? '300,000' : '260,000'} so far this year
          </span>
        </div>

        {/* Year Toggle */}
        <div className={`flex items-center p-0.5 rounded-full ${isDark ? 'bg-[#22272E]' : 'bg-slate-100'}`}>
          <button
            onClick={() => setSelectedYear('2025')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${selectedYear === '2025'
              ? isDark
                ? 'bg-white text-black shadow-sm'
                : 'bg-white text-slate-900 shadow-sm'
              : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            2025
          </button>
          <button
            onClick={() => setSelectedYear('2026')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${selectedYear === '2026'
              ? isDark
                ? 'bg-white text-black shadow-sm'
                : 'bg-white text-slate-900 shadow-sm'
              : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            2026
          </button>
        </div>
      </div>

      {/* Interactive Chart Canvas Area */}
      <div className="relative flex-1 flex flex-col justify-end pt-12 pb-2">
        {/* Horizontal Grid lines & Avg indicator */}
        <div className="absolute inset-x-0 bottom-7 pointer-events-none" style={{ height: `${chartHeight}px` }}>
          {/* Y Axis labels */}
          <div className="absolute left-0 top-0 text-[10px] text-slate-400 font-mono">$60k</div>
          <div className="absolute left-0 top-1/4 -translate-y-1/2 text-[10px] text-slate-400 font-mono">$45k</div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">$30k</div>
          <div className="absolute left-0 top-3/4 -translate-y-1/2 text-[10px] text-slate-400 font-mono">$15k</div>
          <div className="absolute left-0 bottom-0 text-[10px] text-slate-400 font-mono">$0k</div>

          {/* Average Line */}
          <div
            className="absolute inset-x-9 border-b border-dashed border-slate-300 dark:border-slate-700/60"
            style={{ bottom: `${(avgRevenue / maxRevenue) * chartHeight}px` }}
          >
            <span className="absolute right-0 -top-4 text-[10px] text-slate-400 font-medium">
              avg $30k
            </span>
          </div>
        </div>

        {/* Hover Tooltip Card */}
        {hoveredData && (
          <div
            className="absolute z-20 transition-all duration-200 pointer-events-none shadow-xl"
            style={{
              left: `calc(40px + ${(hoveredIndex / 11) * 82}% - 65px)`,
              top: '4px',
            }}
          >
            <div className={`px-3 py-2 rounded-xl text-xs backdrop-blur-md border ${isDark
              ? 'bg-[#1E232A]/95 border-white/10 text-white shadow-2xl'
              : 'bg-[#1E2024]/95 border-black/10 text-white shadow-xl'
              }`}>
              <div className="font-semibold text-slate-300 text-[11px] mb-1">
                {hoveredData.month} {selectedYear}
              </div>
              <div className="flex justify-between gap-4 py-0.5 text-[11px]">
                <span className="text-slate-400">Revenue</span>
                <span className="font-mono font-bold text-white">${hoveredData.revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4 py-0.5 text-[11px]">
                <span className="text-slate-400">Orders</span>
                <span className="font-mono text-slate-200">{hoveredData.orders}</span>
              </div>
              <div className="flex justify-between gap-4 py-0.5 text-[11px] border-t border-white/10 mt-1 pt-1">
                <span className="text-slate-400">vs last year</span>
                <span className="font-semibold text-emerald-400">{hoveredData.vsLastYear}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bar Columns Container */}
        <div className="relative ml-10 flex items-end justify-between gap-2 h-[170px] z-10">
          <svg className="absolute w-0 h-0">
            <defs>
              <pattern id="diagonalHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke={isDark ? '#475569' : '#CBD5E1'} strokeWidth="1.5" />
              </pattern>
            </defs>
          </svg>

          {data.map((item, idx) => {
            const barHeight = Math.round((item.revenue / maxRevenue) * chartHeight);
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.month}
                className="flex-1 flex flex-col items-center cursor-pointer group"
                onMouseEnter={() => setHoveredIndex(idx)}
              >
                <div className="relative w-full flex justify-center items-end" style={{ height: `${chartHeight}px` }}>
                  {item.isProjected ? (
                    // Striped / Hatched Projected Bar
                    <div
                      className={`w-full max-w-[28px] rounded-t-xl border border-dashed transition-all duration-300 ${isHovered
                        ? isDark
                          ? 'border-white/60 bg-white/10 scale-105'
                          : 'border-slate-800 bg-slate-200 scale-105'
                        : isDark
                          ? 'border-slate-600/60'
                          : 'border-slate-300'
                        }`}
                      style={{
                        height: `${barHeight}px`,
                        backgroundImage: 'url(#diagonalHatch)',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      }}
                    />
                  ) : (
                    // Regular solid / gradient bar
                    <div
                      className={`w-full max-w-[28px] rounded-t-xl transition-all duration-300 ease-out origin-bottom ${isHovered
                        ? isDark
                          ? 'bg-gradient-to-t from-slate-200 to-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105'
                          : 'bg-gradient-to-t from-[#111215] to-[#2B2E33] shadow-md scale-105'
                        : isDark
                          ? 'bg-[#2A313C] hover:bg-[#38414F]'
                          : 'bg-[#E3E6EB] hover:bg-[#CBD2DC]'
                        }`}
                      style={{ height: `${barHeight}px` }}
                    />
                  )}
                </div>

                {/* Month Label */}
                <span
                  className={`mt-2 text-[11px] font-medium transition-colors ${isHovered
                    ? isDark
                      ? 'text-white font-bold'
                      : 'text-slate-900 font-bold'
                    : isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                    }`}
                >
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

