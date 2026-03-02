'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Zap } from 'lucide-react';

export function WeatherVisual() {
  const icons = ['☀️', '⛅', '🌤️', '🌧️', '⛅'];
  const winds = [12, 18, 25, 20, 15];
  const temps = ['14°', '18°', '22°', '20°', '17°'];
  const kms = ['0', '10', '20', '30', '40'];

  return (
    <div className="flex h-32 items-end justify-between gap-2 p-2">
      {icons.map((icon, i) => (
        <div
          key={i}
          className="group relative flex flex-1 flex-col items-center gap-1.5"
        >
          <span className="text-xl drop-shadow-md">
            {icon}
          </span>

          <div className="relative flex w-full justify-center">
            <div
              className="w-full max-w-[12px] rounded-t-sm bg-gradient-to-t from-blue-500 to-sky-300"
              style={{ height: `${Math.max(12, winds[i] * 2)}px` }}
            />
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-black tracking-tighter text-slate-800 dark:text-white">
              {temps[i]}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-white/10 dark:text-white/40">
              km {kms[i]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ElevationVisual() {
  const tv = useTranslations('Landing.visuals');
  return (
    <div className="group relative h-32 w-full p-2">
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] bg-[size:10px_10px] opacity-10"
      />
      <svg viewBox="0 0 280 80" className="relative z-10 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="eg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
          <filter id="neon">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M0 78 L0 50 Q40 44 70 38 Q100 32 130 24 Q155 18 175 20 Q200 22 220 30 Q245 38 280 34 L280 78Z"
          fill="url(#eg2)"
        />
        <path
          d="M0 50 Q40 44 70 38"
          stroke="#22c55e"
          strokeWidth="3"
          fill="none"
          filter="url(#neon)"
        />
        <path
          d="M70 38 Q100 32 130 24 Q150 19 165 19"
          stroke="#f59e0b"
          strokeWidth="3"
          fill="none"
          filter="url(#neon)"
        />
        <path
          d="M165 19 Q170 18 175 20"
          stroke="#ef4444"
          strokeWidth="4"
          fill="none"
          filter="url(#neon)"
        />
        <path
          d="M175 20 Q200 22 220 30 Q245 38 280 34"
          stroke="#22c55e"
          strokeWidth="3"
          fill="none"
          filter="url(#neon)"
        />

        <g>
          <circle cx="172" cy="18" r="4" fill="#ef4444" />
          <circle
            cx="172"
            cy="18"
            r="10"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1"
            className="animate-ping"
          />
          <rect x="155" y="0" width="34" height="12" rx="4" fill="#ef4444" />
          <text x="172" y="9" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">
            {tv('elevPeak')}
          </text>
        </g>
      </svg>
    </div>
  );
}

export function HazardVisual() {
  const tv = useTranslations('Landing.visuals');
  const hazards = [
    {
      label: tv('hazard1Label'),
      km: tv('hazard1Km'),
      level: tv('hazardLevelHigh'),
      color: '#ef4444',
      bar: 85,
    },
    {
      label: tv('hazard2Label'),
      km: tv('hazard2Km'),
      level: tv('hazardLevelMedium'),
      color: '#f59e0b',
      bar: 55,
    },
  ];
  return (
    <div className="flex h-32 flex-col justify-center gap-3 p-2">
      {hazards.map((h) => (
        <div
          key={h.label}
          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-800/50"
        >
          <div className="relative z-10 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{ backgroundColor: `${h.color}20` }}
              >
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: h.color }} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white">{h.label}</span>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider uppercase"
              style={{
                backgroundColor: `${h.color}15`,
                color: h.color,
                border: `1px solid ${h.color}40`,
              }}
            >
              {h.level}
            </span>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/50">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${h.bar}%`,
                  backgroundColor: h.color,
                }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-white/50">
              {h.km}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EscapeVisual() {
  const tv = useTranslations('Landing.visuals');
  return (
    <div className="relative h-32 w-full overflow-hidden p-2">
      <div
        className="absolute inset-0 m-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-teal-100 shadow-inner dark:from-[#0d2a24] dark:to-[#113a3a]"
      >
        {/* Topographic lines */}
        <svg
          className="absolute inset-0 h-full w-full opacity-30"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path d="M 0 50 Q 25 30 50 60 T 100 40" fill="none" stroke="#10b981" strokeWidth="0.5" />
          <path d="M 0 70 Q 25 50 50 80 T 100 60" fill="none" stroke="#10b981" strokeWidth="0.5" />
          <path d="M 0 30 Q 25 10 50 40 T 100 20" fill="none" stroke="#10b981" strokeWidth="0.5" />
        </svg>

        {/* Route */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 280 112"
          preserveAspectRatio="none"
        >
          <path
            d="M10 90 Q60 70 110 55 Q160 40 200 48 Q240 55 270 42"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="4"
            strokeLinecap="round"
            className="drop-shadow-[0_2px_4px_rgba(59,130,246,0.5)]"
          />
          {/* Escape paths */}
          <path
            d="M 110 55 L 110 20"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M 200 48 L 220 20"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Pins */}
        <div className="absolute top-[10%] left-[35%] flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-sm">
            <span className="text-xs">🏠</span>
          </div>
          <div className="mt-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[8px] font-bold text-slate-800 dark:bg-black/80 dark:text-white">
            {tv('escapeKm1')}
          </div>
        </div>

        <div className="absolute top-[5%] left-[75%] flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white bg-gradient-to-b from-amber-400 to-amber-600 shadow-sm">
            <span className="text-xs">🛣️</span>
          </div>
          <div className="mt-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[8px] font-bold text-slate-800 dark:bg-black/80 dark:text-white">
            {tv('escapeKm2')}
          </div>
        </div>
      </div>

      <div className="absolute right-2 bottom-2 rounded-xl border border-emerald-500/20 bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-md dark:bg-slate-800/90">
        <span className="text-[10px] font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
          {tv('escapePointsFound')}
        </span>
      </div>
    </div>
  );
}

export function CoverageVisual() {
  const tv = useTranslations('Landing.visuals');
  return (
    <div className="group relative h-32 w-full overflow-hidden p-2">
      <div className="absolute inset-0 m-2 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:20px_20px] opacity-10" />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 280 112"
          preserveAspectRatio="none"
        >
          <path
            d="M10 80 Q70 60 120 50 Q170 40 210 55 Q240 65 270 50"
            fill="none"
            stroke="#4b5563"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>

        {/* Static heatmaps */}
        <div className="absolute top-[30%] left-[35%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/20 mix-blend-screen blur-md" />
        <div className="absolute top-[30%] left-[35%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500" />

        <div className="absolute top-[40%] left-[70%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 mix-blend-screen blur-md" />
        <div className="absolute top-[40%] left-[70%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500" />
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/80 px-2 py-1 backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
        </span>
        <span className="text-[9px] font-bold tracking-widest text-white uppercase">
          {tv('coverageZones')}
        </span>
      </div>
    </div>
  );
}

export function WindowVisual() {
  const tv = useTranslations('Landing.visuals');
  const windows = [
    { time: '08:00', score: 92, good: true },
    { time: '10:00', score: 71, good: true },
    { time: '12:00', score: 45, good: false },
    { time: '14:00', score: 30, good: false },
  ];
  return (
    <div className="flex h-32 flex-col justify-center gap-2.5 p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-white/40">
          {tv('windowLabel')}
        </span>
        <Zap className="h-3 w-3 text-amber-500" />
      </div>

      {windows.map((w) => (
        <div key={w.time} className="group flex items-center gap-3">
          <span className="w-10 text-[10px] font-medium text-slate-600 dark:text-white/60">
            {w.time}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
            <div
              className="relative h-full rounded-full"
              style={{
                width: `${w.score}%`,
                background: w.good
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : 'linear-gradient(90deg, #ef4444, #f87171)',
              }}
            />
          </div>
          <span
            className="w-8 text-right text-[11px] font-black"
            style={{ color: w.good ? '#22c55e' : '#ef4444' }}
          >
            {w.score}
          </span>
        </div>
      ))}
    </div>
  );
}
