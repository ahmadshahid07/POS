import React, { useState } from 'react';

interface AnalyticsPoint {
  date: string;
  prevDate: string;
  current: number;
  previous: number;
  pct: string;
}

const ANALYTICS_DATA: AnalyticsPoint[] = [
  { date: 'Thu, Oct 1', prevDate: 'Tue, Sep 1', current: 950, previous: 820, pct: '+15.8%' },
  { date: 'Fri, Oct 2', prevDate: 'Wed, Sep 2', current: 1100, previous: 980, pct: '+12.2%' },
  { date: 'Sat, Oct 3', prevDate: 'Thu, Sep 3', current: 1450, previous: 1200, pct: '+20.8%' },
  { date: 'Sun, Oct 4', prevDate: 'Fri, Sep 4', current: 1300, previous: 1150, pct: '+13.0%' },
  { date: 'Mon, Oct 5', prevDate: 'Sat, Sep 5', current: 1020, previous: 940, pct: '+8.5%' },
  { date: 'Tue, Oct 6', prevDate: 'Sun, Sep 6', current: 1180, previous: 1050, pct: '+12.4%' },
  { date: 'Wed, Oct 7', prevDate: 'Mon, Sep 7', current: 1290, previous: 1100, pct: '+17.3%' },
  { date: 'Thu, Oct 8', prevDate: 'Tue, Sep 8', current: 1140, previous: 1010, pct: '+12.9%' },
  { date: 'Fri, Oct 9', prevDate: 'Wed, Sep 9', current: 1380, previous: 1120, pct: '+23.2%' },
  { date: 'Sat, Oct 10', prevDate: 'Thu, Sep 10', current: 1503, previous: 1164, pct: '+29.1%' },
  { date: 'Sun, Oct 11', prevDate: 'Fri, Sep 11', current: 1420, previous: 1180, pct: '+20.3%' },
  { date: 'Mon, Oct 12', prevDate: 'Sat, Sep 12', current: 1210, previous: 1050, pct: '+15.2%' },
  { date: 'Tue, Oct 13', prevDate: 'Sun, Sep 13', current: 1340, previous: 1100, pct: '+21.8%' },
  { date: 'Wed, Oct 14', prevDate: 'Mon, Sep 14', current: 1280, previous: 1040, pct: '+23.1%' },
  { date: 'Thu, Oct 15', prevDate: 'Tue, Sep 15', current: 1490, previous: 1190, pct: '+25.2%' },
  { date: 'Fri, Oct 16', prevDate: 'Wed, Sep 16', current: 1620, previous: 1240, pct: '+30.6%' },
  { date: 'Sat, Oct 17', prevDate: 'Thu, Sep 17', current: 1540, previous: 1210, pct: '+27.3%' },
  { date: 'Sun, Oct 18', prevDate: 'Fri, Sep 18', current: 1390, previous: 1150, pct: '+20.9%' },
];

interface AnalyticsRevenueChartProps {
  isDark?: boolean;
}

export const AnalyticsRevenueChart: React.FC<AnalyticsRevenueChartProps> = ({ isDark = false }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number>(9); // Oct 10 default active

  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const minVal = 500;
  const maxVal = 2000;

  const getX = (idx: number) => paddingX + (idx / (ANALYTICS_DATA.length - 1)) * (width - 2 * paddingX);
  const getY = (val: number) => height - paddingY - ((val - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);

  // Generate smooth SVG bezier path for current data
  let currentPath = `M ${getX(0)} ${getY(ANALYTICS_DATA[0].current)}`;
  for (let i = 0; i < ANALYTICS_DATA.length - 1; i++) {
    const x0 = getX(i);
    const y0 = getY(ANALYTICS_DATA[i].current);
    const x1 = getX(i + 1);
    const y1 = getY(ANALYTICS_DATA[i + 1].current);
    const mx = (x0 + x1) / 2;
    currentPath += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }

  // Area fill path
  const areaPath = `${currentPath} L ${getX(ANALYTICS_DATA.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`;

  // Previous period path
  let prevPath = `M ${getX(0)} ${getY(ANALYTICS_DATA[0].previous)}`;
  for (let i = 0; i < ANALYTICS_DATA.length - 1; i++) {
    const x0 = getX(i);
    const y0 = getY(ANALYTICS_DATA[i].previous);
    const x1 = getX(i + 1);
    const y1 = getY(ANALYTICS_DATA[i + 1].previous);
    const mx = (x0 + x1) / 2;
    prevPath += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }

  const activePoint = ANALYTICS_DATA[hoveredIdx];
  const activeX = getX(hoveredIdx);
  const activeY = getY(activePoint.current);

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Chart Title & Stats Row */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Revenue over time
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              $37,163
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
              + 8.1%
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Last 30 days, all channels
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-3.5 h-[2px] rounded ${isDark ? 'bg-white' : 'bg-slate-900'}`} />
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>This period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-[1.5px] border-b border-dashed border-slate-400" />
            <span className="text-slate-400">Previous period</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 w-full min-h-[190px]">
        {/* Y-Axis Grid labels */}
        <div className="absolute left-0 inset-y-0 flex flex-col justify-between py-5 text-[10px] text-slate-400 font-mono pointer-events-none">
          <span>$2k</span>
          <span>$1.5k</span>
          <span>$1k</span>
          <span>$500</span>
        </div>

        {/* Tooltip Popup */}
        {activePoint && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-150"
            style={{
              left: `${Math.min(Math.max(activeX - 85, 30), width - 170)}px`,
              top: `${Math.max(activeY - 95, 0)}px`,
            }}
          >
            <div className={`p-2.5 rounded-xl text-xs backdrop-blur-md border shadow-xl ${
              isDark
                ? 'bg-[#181C23]/95 border-white/10 text-white'
                : 'bg-white/95 border-black/10 text-slate-900 shadow-slate-200'
            }`}>
              <div className={`font-semibold text-[11px] mb-1.5 pb-1 border-b ${isDark ? 'border-white/10 text-slate-300' : 'border-slate-100 text-slate-700'}`}>
                {activePoint.date}
              </div>
              <div className="flex items-center justify-between gap-4 py-0.5 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className={`w-2 h-0.5 ${isDark ? 'bg-white' : 'bg-slate-900'}`} />
                  This period
                </span>
                <span className="font-mono font-bold">${activePoint.current.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-0.5 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 border-b border-dashed border-slate-400" />
                  {activePoint.prevDate}
                </span>
                <span className="font-mono text-slate-400">${activePoint.previous.toLocaleString()}</span>
              </div>
              <div className="mt-1 pt-1 border-t border-dashed border-slate-200 dark:border-white/10 text-[10px] font-semibold text-emerald-500">
                {activePoint.pct} vs previous
              </div>
            </div>
          </div>
        )}

        {/* SVG Drawing */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="corbelAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isDark ? '#FFFFFF' : '#0F172A'} stopOpacity={isDark ? 0.25 : 0.12} />
              <stop offset="100%" stopColor={isDark ? '#FFFFFF' : '#0F172A'} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          <line x1={paddingX} y1={getY(2000)} x2={width - paddingX} y2={getY(2000)} stroke={isDark ? '#262D38' : '#F1F5F9'} strokeWidth="1" />
          <line x1={paddingX} y1={getY(1500)} x2={width - paddingX} y2={getY(1500)} stroke={isDark ? '#262D38' : '#F1F5F9'} strokeWidth="1" />
          <line x1={paddingX} y1={getY(1000)} x2={width - paddingX} y2={getY(1000)} stroke={isDark ? '#262D38' : '#F1F5F9'} strokeWidth="1" />
          <line x1={paddingX} y1={getY(500)} x2={width - paddingX} y2={getY(500)} stroke={isDark ? '#262D38' : '#F1F5F9'} strokeWidth="1" />

          {/* Gradient area fill */}
          <path d={areaPath} fill="url(#corbelAreaGradient)" />

          {/* Previous period dashed line */}
          <path
            d={prevPath}
            fill="none"
            stroke={isDark ? '#4B5563' : '#94A3B8'}
            strokeWidth="1.75"
            strokeDasharray="4 4"
          />

          {/* Current period solid line */}
          <path
            d={currentPath}
            fill="none"
            stroke={isDark ? '#FFFFFF' : '#0F172A'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive vertical guide line */}
          <line
            x1={activeX}
            y1={paddingY}
            x2={activeX}
            y2={height - paddingY}
            stroke={isDark ? '#475569' : '#CBD5E1'}
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Active point marker */}
          <circle cx={activeX} cy={activeY} r="6" fill={isDark ? '#0F172A' : '#FFFFFF'} stroke={isDark ? '#FFFFFF' : '#0F172A'} strokeWidth="2.5" />
          <circle cx={activeX} cy={activeY} r="2" fill={isDark ? '#FFFFFF' : '#0F172A'} />

          {/* Transparent interactive columns for hover */}
          {ANALYTICS_DATA.map((_, i) => (
            <rect
              key={i}
              x={getX(i) - (width / ANALYTICS_DATA.length) / 2}
              y={0}
              width={width / ANALYTICS_DATA.length}
              height={height}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

