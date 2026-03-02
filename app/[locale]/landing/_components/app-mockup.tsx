'use client';

import { useTranslations } from 'next-intl';
import { Thermometer, Wind, AlertTriangle, CloudRain, Eye } from 'lucide-react';

export function AppMockup() {
  const t = useTranslations('Landing.hero');
  const tv = useTranslations('Landing.visuals');
  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-blue-500/10 to-transparent blur-2xl dark:from-[#3b82f6]/20" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-[#0f1624] dark:shadow-none">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-3 dark:border-white/8 dark:bg-[#0a0e1a]">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400/80" />
            <div className="h-3 w-3 rounded-full bg-amber-400/80" />
            <div className="h-3 w-3 rounded-full bg-green-400/80" />
          </div>
          <div className="mx-auto rounded-md bg-slate-200/80 px-8 py-1 text-center text-[10px] text-slate-400 dark:bg-white/5 dark:text-white/30">
            peakone.app/route
          </div>
        </div>

        {/* Map */}
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-sky-50 dark:from-[#1a2a4a] dark:via-[#1e3a5f] dark:to-[#162038]">
          <svg
            className="absolute inset-0 h-full w-full opacity-20 dark:opacity-15"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="terrain" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 0 20 Q 10 10 20 20 Q 30 30 40 20"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="0.6"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#terrain)" />
          </svg>
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 800 208"
            preserveAspectRatio="none"
          >
            <path
              d="M 20 160 Q 80 140 120 120 Q 180 90 240 80 Q 300 70 360 85 Q 420 100 480 60 Q 540 30 600 45 Q 660 60 720 40 Q 760 30 780 35"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 20 160 Q 80 140 120 120 Q 180 90 240 80 Q 300 70 360 85 Q 420 100 480 60 Q 540 30 600 45 Q 660 60 720 40 Q 760 30 780 35"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute bottom-8 left-6 flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e] text-[10px] font-bold text-white shadow-lg shadow-green-500/40">
            A
          </div>
          <div className="absolute top-6 right-8 flex h-6 w-6 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white shadow-lg shadow-red-500/40">
            B
          </div>
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 shadow-sm backdrop-blur-sm dark:bg-black/60">
              <Thermometer className="h-3.5 w-3.5 text-[#f97316]" />
              <span className="text-xs font-semibold text-slate-800 dark:text-white">
                {t('mockupTemp')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 shadow-sm backdrop-blur-sm dark:bg-black/60">
              <Wind className="h-3.5 w-3.5 text-[#60a5fa]" />
              <span className="text-xs font-semibold text-slate-800 dark:text-white">
                {t('mockupWind')}
              </span>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-amber-500/90 px-2 py-1 shadow-lg shadow-amber-500/30">
            <AlertTriangle className="h-3 w-3 text-white" />
            <span className="text-[10px] font-bold text-white">{t('mockupRisk')}</span>
          </div>
          <div className="absolute top-3 right-3 rounded-md bg-white/60 px-2 py-1 text-[10px] text-slate-500 backdrop-blur-sm dark:bg-black/50 dark:text-white/60">
            {t('mockupMapType')}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-white dark:divide-white/5 dark:border-white/8 dark:bg-[#0c111e]">
          {[
            {
              icon: <Thermometer className="h-3.5 w-3.5 text-[#f97316]" />,
              label: t('mockupStat1Label'),
              value: t('mockupStat1Value'),
              sub: t('mockupStat1Sub'),
            },
            {
              icon: <Wind className="h-3.5 w-3.5 text-[#60a5fa]" />,
              label: t('mockupStat2Label'),
              value: t('mockupStat2Value'),
              sub: t('mockupStat2Sub'),
            },
            {
              icon: <CloudRain className="h-3.5 w-3.5 text-[#818cf8]" />,
              label: t('mockupStat3Label'),
              value: t('mockupStat3Value'),
              sub: t('mockupStat3Sub'),
            },
            {
              icon: <Eye className="h-3.5 w-3.5 text-[#34d399]" />,
              label: t('mockupStat4Label'),
              value: t('mockupStat4Value'),
              sub: t('mockupStat4Sub'),
            },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5 p-3">
              <div className="flex items-center gap-1 text-slate-400 dark:text-white/40">
                {stat.icon}
                <span className="text-[9px]">{stat.label}</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-[9px] text-slate-400 dark:text-white/30">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Elevation */}
        <div className="bg-slate-50 px-4 py-3 dark:bg-[#0a0e1a]">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-400 dark:text-white/40">
              {t('mockupElevLabel')}
            </span>
            <span className="text-[10px] text-slate-300 dark:text-white/30">
              {t('mockupElevD')}
            </span>
          </div>
          <svg viewBox="0 0 760 60" className="h-14 w-full">
            <defs>
              <linearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.03" />
              </linearGradient>
            </defs>
            <path
              d="M 0 58 L 0 45 Q 60 40 100 35 Q 160 28 200 30 Q 240 32 280 18 Q 320 5 380 8 Q 420 10 460 14 Q 500 18 540 12 Q 580 6 620 10 Q 660 14 700 18 Q 730 20 760 16 L 760 58 Z"
              fill="url(#elev)"
            />
            <path
              d="M 0 45 Q 60 40 100 35 Q 160 28 200 30 Q 240 32 280 18 Q 320 5 380 8 Q 420 10 460 14 Q 500 18 540 12 Q 580 6 620 10 Q 660 14 700 18 Q 730 20 760 16"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
            />
            <path
              d="M 0 45 Q 60 40 100 35 Q 160 28 200 30"
              stroke="#22c55e"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M 200 30 Q 240 32 280 18 Q 310 8 340 6"
              stroke="#f59e0b"
              strokeWidth="3"
              fill="none"
            />
            <path d="M 340 6 Q 360 5 380 8" stroke="#ef4444" strokeWidth="3" fill="none" />
            <path
              d="M 380 8 Q 420 10 460 14 Q 500 18 540 12"
              stroke="#22c55e"
              strokeWidth="3"
              fill="none"
            />
            <path d="M 540 12 Q 580 6 620 10" stroke="#f59e0b" strokeWidth="3" fill="none" />
            <path
              d="M 620 10 Q 660 14 700 18 Q 730 20 760 16"
              stroke="#22c55e"
              strokeWidth="3"
              fill="none"
            />
            <text x="378" y="3" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">
              {tv('elevPeak')}
            </text>
            <line x1="380" y1="5" x2="380" y2="8" stroke="#ef4444" strokeWidth="1" />
          </svg>
          <div className="mt-1 flex gap-3">
            {[
              { c: '#22c55e', l: t('mockupSlopeEasy') },
              { c: '#f59e0b', l: t('mockupSlopeMedium') },
              { c: '#ef4444', l: t('mockupSlopeHard') },
            ].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1">
                <div className="h-1.5 w-3 rounded-full" style={{ backgroundColor: c }} />
                <span className="text-[9px] text-slate-400 dark:text-white/30">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
