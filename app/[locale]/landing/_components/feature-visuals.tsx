'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Zap } from 'lucide-react';

export function WeatherVisual() {
  const icons = ['☀️', '⛅', '🌤️', '🌧️', '⛅'];
  const winds = [12, 18, 25, 20, 15];
  const temps = ['14°', '18°', '22°', '20°', '17°'];
  const kms = ['0', '10', '20', '30', '40'];
  return (
    <div className="flex items-end justify-between gap-1">
      {icons.map((icon, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-base">{icon}</span>
          <div
            className="w-full rounded-sm bg-gradient-to-t from-blue-500/60 to-blue-300/30"
            style={{ height: `${Math.max(8, winds[i] * 1.5)}px` }}
          />
          <span className="text-[9px] font-bold text-slate-700 dark:text-white/80">{temps[i]}</span>
          <span className="text-[8px] text-slate-400 dark:text-white/30">km {kms[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function ElevationVisual() {
  const tv = useTranslations('Landing.visuals');
  return (
    <div>
      <svg viewBox="0 0 280 56" className="w-full">
        <defs>
          <linearGradient id="eg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path
          d="M0 54 L0 40 Q40 34 70 28 Q100 22 130 14 Q155 8 175 10 Q200 12 220 20 Q245 28 280 24 L280 54Z"
          fill="url(#eg2)"
        />
        <path
          d="M0 40 Q40 34 70 28 Q100 22 130 14 Q155 8 175 10 Q200 12 220 20 Q245 28 280 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
        <path d="M0 40 Q40 34 70 28" stroke="#22c55e" strokeWidth="2.5" fill="none" />
        <path
          d="M70 28 Q100 22 130 14 Q150 9 165 9"
          stroke="#f59e0b"
          strokeWidth="2.5"
          fill="none"
        />
        <path d="M165 9 Q170 8 175 10" stroke="#ef4444" strokeWidth="2.5" fill="none" />
        <path
          d="M175 10 Q200 12 220 20 Q245 28 280 24"
          stroke="#22c55e"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="174" cy="8" r="3" fill="#ef4444" />
        <text x="174" y="4" textAnchor="middle" fill="#ef4444" fontSize="6" fontWeight="bold">
          {tv('elevPeak')}
        </text>
      </svg>
      <div className="mt-1.5 flex gap-2.5">
        {[
          ['#22c55e', tv('slopeEasy')],
          ['#f59e0b', tv('slopeMedium')],
          ['#ef4444', tv('slopeHard')],
        ].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1">
            <div className="h-1.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
            <span className="text-[8px] text-slate-400 dark:text-white/30">{l}</span>
          </div>
        ))}
      </div>
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
    {
      label: tv('hazard3Label'),
      km: tv('hazard3Km'),
      level: tv('hazardLevelHigh'),
      color: '#ef4444',
      bar: 75,
    },
  ];
  return (
    <div className="flex flex-col gap-2">
      {hazards.map((h) => (
        <div
          key={h.label}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/5 dark:bg-white/3"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" style={{ color: h.color }} />
              <span className="text-[10px] font-semibold text-slate-700 dark:text-white/80">
                {h.label}
              </span>
            </div>
            <span
              className="rounded px-1 py-0.5 text-[8px] font-bold"
              style={{ backgroundColor: `${h.color}20`, color: h.color }}
            >
              {h.level}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${h.bar}%`, backgroundColor: h.color }}
              />
            </div>
            <span className="text-[8px] text-slate-400 dark:text-white/30">{h.km}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EscapeVisual() {
  const tv = useTranslations('Landing.visuals');
  return (
    <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 dark:from-[#0f2040] dark:to-[#1a3a5c]">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 280 112"
        preserveAspectRatio="none"
      >
        <path
          d="M10 90 Q60 70 110 55 Q160 40 200 48 Q240 55 270 42"
          fill="none"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M10 90 Q60 70 110 55 Q160 40 200 48 Q240 55 270 42"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute top-6 left-[38%] flex flex-col items-center">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6366f1] shadow-lg shadow-indigo-500/40">
          <span className="text-[8px]">🏠</span>
        </div>
        <div className="mt-0.5 rounded bg-white/80 px-1 text-[7px] text-slate-700 dark:bg-black/60 dark:text-white/80">
          {tv('escapeKm1')}
        </div>
      </div>
      <div className="absolute top-3 left-[68%] flex flex-col items-center">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f59e0b] shadow-lg shadow-amber-500/40">
          <span className="text-[8px]">⛺</span>
        </div>
        <div className="mt-0.5 rounded bg-white/80 px-1 text-[7px] text-slate-700 dark:bg-black/60 dark:text-white/80">
          {tv('escapeKm2')}
        </div>
      </div>
      <div className="absolute right-3 bottom-3 rounded-lg bg-white/80 px-2 py-1 backdrop-blur-sm dark:bg-black/60">
        <span className="text-[9px] font-semibold text-[#10b981]">{tv('escapePointsFound')}</span>
      </div>
    </div>
  );
}

export function CoverageVisual() {
  const tv = useTranslations('Landing.visuals');
  return (
    <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 dark:from-[#0f2040] dark:to-[#1a3a5c]">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 280 112"
        preserveAspectRatio="none"
      >
        <path
          d="M10 80 Q70 60 120 50 Q170 40 210 55 Q240 65 270 50"
          fill="none"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M10 80 Q70 60 120 50 Q170 40 210 55 Q240 65 270 50"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 112">
        <defs>
          <radialGradient id="h1" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="h2" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="130" cy="48" rx="35" ry="20" fill="url(#h1)" />
        <ellipse cx="215" cy="55" rx="28" ry="18" fill="url(#h2)" />
      </svg>
      <div className="absolute bottom-3 left-3 rounded-lg bg-white/80 px-2 py-1 backdrop-blur-sm dark:bg-black/60">
        <span className="text-[9px] font-semibold text-[#f59e0b]">{tv('coverageZones')}</span>
      </div>
    </div>
  );
}

export function WindowVisual() {
  const tv = useTranslations('Landing.visuals');
  const windows = [
    { time: '06:00', score: 92, good: true },
    { time: '08:00', score: 88, good: true },
    { time: '10:00', score: 71, good: true },
    { time: '12:00', score: 45, good: false },
    { time: '14:00', score: 30, good: false },
    { time: '16:00', score: 62, good: false },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1 text-[9px] font-medium text-slate-400 dark:text-white/30">
        {tv('windowLabel')}
      </div>
      {windows.map((w) => (
        <div key={w.time} className="flex items-center gap-2">
          <span className="w-10 text-[9px] text-slate-500 dark:text-white/40">{w.time}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/5">
            <div
              className="h-full rounded-full"
              style={{
                width: `${w.score}%`,
                backgroundColor: w.good ? '#22c55e' : '#ef4444',
                opacity: w.good ? 1 : 0.6,
              }}
            />
          </div>
          <span
            className="w-7 text-right text-[9px] font-bold"
            style={{ color: w.good ? '#22c55e' : '#ef4444' }}
          >
            {w.score}
          </span>
        </div>
      ))}
      <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-green-50 px-2 py-1 dark:bg-[#22c55e]/10">
        <Zap className="h-3 w-3 text-[#22c55e]" />
        <span className="text-[9px] font-semibold text-[#22c55e]">{tv('windowRecommended')}</span>
      </div>
    </div>
  );
}
