import React from 'react';

export const RiskDonutChart = ({ high = 128, medium = 342, low = 582 }) => {
  const total = high + medium + low;
  const highPct = total ? Math.round((high / total) * 100) : 20;
  const medPct = total ? Math.round((medium / total) * 100) : 33;
  const lowPct = total ? Math.round((low / total) * 100) : 47;

  // SVG circle calculations (circumference = 2 * PI * 40 = 251.32)
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const highOffset = circ * (1 - high / total);
  const medOffset = circ * (1 - medium / total);
  const lowOffset = circ * (1 - low / total);

  return (
    <div className="bg-[#111622] border border-[#1e2638] rounded-xl p-4 flex flex-col justify-between h-full">
      <h3 className="text-white font-semibold text-sm mb-3">Risk Distribution</h3>
      
      <div className="flex items-center justify-center my-2">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#1e2638"
              strokeWidth="14"
            />
            {/* Low Risk Segment (Green) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth="14"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - low / total)}
              strokeLinecap="round"
            />
            {/* Medium Risk Segment (Yellow) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="14"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - (low + medium) / total)}
              strokeLinecap="round"
            />
            {/* High Risk Segment (Red) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth="14"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - high / total)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl font-bold text-white font-mono">{total}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Assessed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-[#1e2638] pt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <div>
            <span className="text-[10px] text-slate-400 block">High Risk</span>
            <span className="font-semibold text-white font-mono">{high} ({highPct}%)</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <div>
            <span className="text-[10px] text-slate-400 block">Medium Risk</span>
            <span className="font-semibold text-white font-mono">{medium} ({medPct}%)</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <div>
            <span className="text-[10px] text-slate-400 block">Low Risk</span>
            <span className="font-semibold text-white font-mono">{low} ({lowPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
