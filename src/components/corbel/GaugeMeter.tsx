import React, { useEffect, useState } from 'react';

interface GaugeMeterProps {
  value: number; // 0 to 100
  maxValue?: number;
  delta?: number;
  statusText?: string;
  subText?: string;
  isDark?: boolean;
}

export const GaugeMeter: React.FC<GaugeMeterProps> = ({
  value = 86,
  maxValue = 100,
  delta = 3,
  statusText = 'Ahead of plan',
  subText = 'Both channels beat last month. Online did most of the lifting.',
  isDark = true,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let frameId: number;
    const duration = 1400;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(value * ease);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setAnimatedValue(value);
      }
    };

    const t = setTimeout(() => {
      frameId = requestAnimationFrame(animate);
    }, 200);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(frameId);
    };
  }, [value]);

  // Radius and geometry
  const radius = 95;
  const cx = 135;
  const cy = 115;
  const arcLength = Math.PI * radius; // 180 degrees arc
  const strokeDashoffset = arcLength * (1 - (animatedValue / maxValue));

  // Needle angle in radians: from -PI (-180deg) to 0 (0deg)
  const currentRatio = Math.min(Math.max(animatedValue / maxValue, 0), 1);
  const angleRad = Math.PI + currentRatio * Math.PI;
  const dotX = cx + radius * Math.cos(angleRad);
  const dotY = cy + radius * Math.sin(angleRad);

  // Generate tick marks (35 ticks around the semi-circle)
  const totalTicks = 38;
  const ticks = [];
  const tickRadius = radius + 15;
  const tickLength = 5;

  for (let i = 0; i <= totalTicks; i++) {
    const tickRatio = i / totalTicks;
    const tickAngle = Math.PI + tickRatio * Math.PI;
    const x1 = cx + (tickRadius - tickLength) * Math.cos(tickAngle);
    const y1 = cy + (tickRadius - tickLength) * Math.sin(tickAngle);
    const x2 = cx + tickRadius * Math.cos(tickAngle);
    const y2 = cy + tickRadius * Math.sin(tickAngle);

    const isMajor = i % 5 === 0;
    const isActive = tickRatio <= currentRatio;

    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isActive ? (isDark ? '#E2E8F0' : '#0F172A') : (isDark ? '#334155' : '#CBD5E1')}
        strokeWidth={isMajor ? 1.5 : 1}
        strokeOpacity={isActive ? (isMajor ? 0.9 : 0.6) : 0.25}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-between h-full w-full">
      <div className="relative w-full max-w-[270px] flex justify-center items-center">
        <svg
          viewBox="0 0 270 145"
          className="w-full overflow-visible select-none"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="60%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
            <filter id="glowDot" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FFFFFF" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Ticks */}
          <g>{ticks}</g>

          {/* Background Track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={isDark ? '#1E293B' : '#E2E8F0'}
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Active Animated Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />

          {/* Value Indicator Dot with concentric ring */}
          {animatedValue > 0 && (
            <g transform={`translate(${dotX}, ${dotY})`}>
              <circle r="7" fill={isDark ? '#0F172A' : '#FFFFFF'} stroke="#FFFFFF" strokeWidth="2.5" filter="url(#glowDot)" />
              <circle r="2.5" fill={isDark ? '#FFFFFF' : '#0F172A'} />
            </g>
          )}
        </svg>

        {/* Center Value Badge */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {Math.round(animatedValue)}
            </span>
            {delta && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                +{delta}
              </span>
            )}
          </div>
          <span className={`text-[11px] font-medium tracking-wide mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            of {maxValue} points
          </span>
        </div>
      </div>

      {/* Footer Text */}
      <div className="w-full text-left mt-3 pt-3 border-t border-white/10">
        <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {statusText}
        </h4>
        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {subText}
        </p>
      </div>
    </div>
  );
};

