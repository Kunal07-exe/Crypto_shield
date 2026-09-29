import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ title, value, change, isPositive = true, color = 'red', sparkline = [] }) => {
  const colorMap = {
    red: {
      text: 'text-red-500',
      stroke: '#ef4444',
      fill: 'rgba(239, 68, 68, 0.1)',
      border: 'border-red-500/20'
    },
    yellow: {
      text: 'text-amber-400',
      stroke: '#f59e0b',
      fill: 'rgba(245, 158, 11, 0.1)',
      border: 'border-amber-500/20'
    },
    green: {
      text: 'text-emerald-400',
      stroke: '#10b981',
      fill: 'rgba(16, 185, 129, 0.1)',
      border: 'border-emerald-500/20'
    },
    blue: {
      text: 'text-blue-400',
      stroke: '#3b82f6',
      fill: 'rgba(59, 130, 246, 0.1)',
      border: 'border-blue-500/20'
    }
  };

  const scheme = colorMap[color] || colorMap.red;

  // Render smooth SVG sparkline curve
  const defaultSparkline = [20, 25, 18, 30, 22, 38, 35, 45, 40, 55];
  const points = sparkline.length ? sparkline : defaultSparkline;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const width = 120;
  const height = 40;

  const pathD = points.reduce((acc, pt, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((pt - min) / (max - min || 1)) * (height - 8) - 4;
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }, '');

  return (
    <div className="bg-[#111622] border border-[#1e2638] rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>{title}</span>
      </div>

      <div className="flex items-end justify-between my-1">
        <div>
          <span className={`text-2xl font-bold font-mono ${scheme.text}`}>{value}</span>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-medium">
            <span className={isPositive ? 'text-emerald-400' : 'text-slate-400'}>{change}</span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="w-24 h-10 overflow-hidden">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
            <path
              d={pathD}
              fill="none"
              stroke={scheme.stroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
