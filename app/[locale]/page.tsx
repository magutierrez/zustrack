'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Wind,
  Thermometer,
  CloudRain,
  Mountain,
  AlertTriangle,
  Signal,
  LifeBuoy,
  Upload,
  Activity,
  ChevronRight,
  Bike,
  Footprints,
  Clock,
  Map,
  Droplets,
  Eye,
  Sun,
  Zap,
  ArrowRight,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { LogoIcon } from '@/app/_components/logo-icon';
import { LandingThemeToggle } from './landing/_components/landing-theme-toggle';
import { LocaleSwitcher } from '@/app/_components/locale-switcher';

/* ─── NAV ─────────────────────────────────────────────────── */
function Nav() {
  const t = useTranslations('Landing.nav');
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-white/5 dark:bg-[#08090f]/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <LogoIcon className="h-7 w-7 text-[#3b82f6]" />
          <span className="font-heading text-lg font-bold tracking-tight">zustrack</span>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <LandingThemeToggle />
          <Link
            href="/login"
            className="hidden text-sm text-slate-500 transition-colors hover:text-slate-900 sm:block dark:text-white/60 dark:hover:text-white"
          >
            {t('login')}
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-[#2563eb]"
          >
            {t('startFree')} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── HERO ────────────────────────────────────────────────── */
function Hero() {
  const t = useTranslations('Landing.hero');
  return (
    <section className="relative overflow-hidden pb-24 pt-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/5 blur-[120px] dark:bg-[#1d4ed8]/15" />
        <div className="absolute top-40 left-1/4 h-[300px] w-[400px] rounded-full bg-sky-400/5 blur-[80px] dark:bg-[#0ea5e9]/8" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/50 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700 dark:border-[#3b82f6]/30 dark:bg-[#3b82f6]/10 dark:text-[#93c5fd]">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-[#3b82f6]" />
            {t('badge')}
          </span>
        </div>

        <h1 className="font-heading mb-6 text-center text-5xl leading-tight font-bold tracking-tight md:text-7xl">
          {t('title1')}
          <br />
          <span className="bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#38bdf8] bg-clip-text text-transparent">
            {t('title2')}
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-center text-lg leading-relaxed text-slate-500 dark:text-white/55">
          {t('subtitleBefore')}{' '}
          <strong className="text-slate-700 dark:text-white/80">{t('subtitleStrong')}</strong>{' '}
          {t('subtitleAfter')}
        </p>

        <div className="mb-16 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-[#3b82f6] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-[#2563eb]"
          >
            {t('cta1')} <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-7 py-3.5 text-base font-medium text-slate-600 transition-all hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
          >
            {t('cta2')}
          </a>
        </div>

        <div className="mb-14 flex flex-wrap items-center justify-center gap-10">
          {[
            { value: t('stat1Value'), label: t('stat1Label') },
            { value: t('stat2Value'), label: t('stat2Label') },
            { value: t('stat3Value'), label: t('stat3Label') },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-heading text-xl font-bold text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-slate-400 dark:text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        <AppMockup />
      </div>
    </section>
  );
}

/* ─── APP MOCKUP ──────────────────────────────────────────── */
function AppMockup() {
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
          <svg className="absolute inset-0 h-full w-full opacity-20 dark:opacity-15" preserveAspectRatio="none">
            <defs>
              <pattern id="terrain" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 0 20 Q 10 10 20 20 Q 30 30 40 20" fill="none" stroke="#1d4ed8" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#terrain)" />
          </svg>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 208" preserveAspectRatio="none">
            <path d="M 20 160 Q 80 140 120 120 Q 180 90 240 80 Q 300 70 360 85 Q 420 100 480 60 Q 540 30 600 45 Q 660 60 720 40 Q 760 30 780 35" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
            <path d="M 20 160 Q 80 140 120 120 Q 180 90 240 80 Q 300 70 360 85 Q 420 100 480 60 Q 540 30 600 45 Q 660 60 720 40 Q 760 30 780 35" fill="none" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <div className="absolute bottom-8 left-6 flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e] text-[10px] font-bold text-white shadow-lg shadow-green-500/40">A</div>
          <div className="absolute top-6 right-8 flex h-6 w-6 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white shadow-lg shadow-red-500/40">B</div>
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 shadow-sm backdrop-blur-sm dark:bg-black/60">
              <Thermometer className="h-3.5 w-3.5 text-[#f97316]" />
              <span className="text-xs font-semibold text-slate-800 dark:text-white">{t('mockupTemp')}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 shadow-sm backdrop-blur-sm dark:bg-black/60">
              <Wind className="h-3.5 w-3.5 text-[#60a5fa]" />
              <span className="text-xs font-semibold text-slate-800 dark:text-white">{t('mockupWind')}</span>
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
            { icon: <Thermometer className="h-3.5 w-3.5 text-[#f97316]" />, label: t('mockupStat1Label'), value: t('mockupStat1Value'), sub: t('mockupStat1Sub') },
            { icon: <Wind className="h-3.5 w-3.5 text-[#60a5fa]" />, label: t('mockupStat2Label'), value: t('mockupStat2Value'), sub: t('mockupStat2Sub') },
            { icon: <CloudRain className="h-3.5 w-3.5 text-[#818cf8]" />, label: t('mockupStat3Label'), value: t('mockupStat3Value'), sub: t('mockupStat3Sub') },
            { icon: <Eye className="h-3.5 w-3.5 text-[#34d399]" />, label: t('mockupStat4Label'), value: t('mockupStat4Value'), sub: t('mockupStat4Sub') },
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
            <span className="text-[10px] font-medium text-slate-400 dark:text-white/40">{t('mockupElevLabel')}</span>
            <span className="text-[10px] text-slate-300 dark:text-white/30">{t('mockupElevD')}</span>
          </div>
          <svg viewBox="0 0 760 60" className="h-14 w-full">
            <defs>
              <linearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.03" />
              </linearGradient>
            </defs>
            <path d="M 0 58 L 0 45 Q 60 40 100 35 Q 160 28 200 30 Q 240 32 280 18 Q 320 5 380 8 Q 420 10 460 14 Q 500 18 540 12 Q 580 6 620 10 Q 660 14 700 18 Q 730 20 760 16 L 760 58 Z" fill="url(#elev)" />
            <path d="M 0 45 Q 60 40 100 35 Q 160 28 200 30 Q 240 32 280 18 Q 320 5 380 8 Q 420 10 460 14 Q 500 18 540 12 Q 580 6 620 10 Q 660 14 700 18 Q 730 20 760 16" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
            <path d="M 0 45 Q 60 40 100 35 Q 160 28 200 30" stroke="#22c55e" strokeWidth="3" fill="none" />
            <path d="M 200 30 Q 240 32 280 18 Q 310 8 340 6" stroke="#f59e0b" strokeWidth="3" fill="none" />
            <path d="M 340 6 Q 360 5 380 8" stroke="#ef4444" strokeWidth="3" fill="none" />
            <path d="M 380 8 Q 420 10 460 14 Q 500 18 540 12" stroke="#22c55e" strokeWidth="3" fill="none" />
            <path d="M 540 12 Q 580 6 620 10" stroke="#f59e0b" strokeWidth="3" fill="none" />
            <path d="M 620 10 Q 660 14 700 18 Q 730 20 760 16" stroke="#22c55e" strokeWidth="3" fill="none" />
            <text x="378" y="3" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">{tv('elevPeak')}</text>
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

/* ─── FEATURES ────────────────────────────────────────────── */
function Features() {
  const t = useTranslations('Landing.features');
  const tv = useTranslations('Landing.visuals');

  const features = [
    { icon: <CloudRain className="h-5 w-5" />, color: '#818cf8', title: t('weatherTitle'), description: t('weatherDesc'), visual: <WeatherVisual /> },
    { icon: <Mountain className="h-5 w-5" />, color: '#3b82f6', title: t('elevTitle'), description: t('elevDesc'), visual: <ElevationVisual /> },
    { icon: <AlertTriangle className="h-5 w-5" />, color: '#f59e0b', title: t('hazardsTitle'), description: t('hazardsDesc'), visual: <HazardVisual /> },
    { icon: <LifeBuoy className="h-5 w-5" />, color: '#10b981', title: t('escapeTitle'), description: t('escapeDesc'), visual: <EscapeVisual /> },
    { icon: <Signal className="h-5 w-5" />, color: '#f97316', title: t('coverageTitle'), description: t('coverageDesc'), visual: <CoverageVisual /> },
    { icon: <Clock className="h-5 w-5" />, color: '#a855f7', title: t('windowTitle'), description: t('windowDesc'), visual: <WindowVisual /> },
  ];

  const extras = [t('extra1'), t('extra2'), t('extra3'), t('extra4'), t('extra5'), t('extra6'), t('extra7'), t('extra8')];

  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">{t('sectionLabel')}</span>
        </div>
        <h2 className="font-heading mb-4 text-center text-4xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
        <p className="mx-auto mb-16 max-w-xl text-center text-slate-500 dark:text-white/50">{t('subtitle')}</p>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-white/6 dark:bg-white/2">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30">{t('extrasLabel')}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {extras.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#3b82f6]" />
                <span className="text-xs text-slate-600 dark:text-white/50">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, color, title, description, visual }: {
  icon: React.ReactNode; color: string; title: string; description: string; visual: React.ReactNode;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition-all hover:border-slate-300 hover:shadow-md dark:border-white/7 dark:bg-[#0d1120] dark:hover:border-white/15 dark:hover:shadow-none">
      <div className="border-b border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-[#0a0e1a]">{visual}</div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18`, color }}>{icon}</div>
        <h3 className="font-heading text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-white/45">{description}</p>
      </div>
    </div>
  );
}

/* ─── FEATURE VISUALS ─────────────────────────────────────── */
function WeatherVisual() {
  const icons = ['☀️', '⛅', '🌤️', '🌧️', '⛅'];
  const winds = [12, 18, 25, 20, 15];
  const temps = ['14°', '18°', '22°', '20°', '17°'];
  const kms = ['0', '10', '20', '30', '40'];
  return (
    <div className="flex items-end justify-between gap-1">
      {icons.map((icon, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-base">{icon}</span>
          <div className="w-full rounded-sm bg-gradient-to-t from-blue-500/60 to-blue-300/30" style={{ height: `${Math.max(8, winds[i] * 1.5)}px` }} />
          <span className="text-[9px] font-bold text-slate-700 dark:text-white/80">{temps[i]}</span>
          <span className="text-[8px] text-slate-400 dark:text-white/30">km {kms[i]}</span>
        </div>
      ))}
    </div>
  );
}

function ElevationVisual() {
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
        <path d="M0 54 L0 40 Q40 34 70 28 Q100 22 130 14 Q155 8 175 10 Q200 12 220 20 Q245 28 280 24 L280 54Z" fill="url(#eg2)" />
        <path d="M0 40 Q40 34 70 28 Q100 22 130 14 Q155 8 175 10 Q200 12 220 20 Q245 28 280 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        <path d="M0 40 Q40 34 70 28" stroke="#22c55e" strokeWidth="2.5" fill="none" />
        <path d="M70 28 Q100 22 130 14 Q150 9 165 9" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
        <path d="M165 9 Q170 8 175 10" stroke="#ef4444" strokeWidth="2.5" fill="none" />
        <path d="M175 10 Q200 12 220 20 Q245 28 280 24" stroke="#22c55e" strokeWidth="2.5" fill="none" />
        <circle cx="174" cy="8" r="3" fill="#ef4444" />
        <text x="174" y="4" textAnchor="middle" fill="#ef4444" fontSize="6" fontWeight="bold">{tv('elevPeak')}</text>
      </svg>
      <div className="mt-1.5 flex gap-2.5">
        {[['#22c55e', tv('slopeEasy')], ['#f59e0b', tv('slopeMedium')], ['#ef4444', tv('slopeHard')]].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1">
            <div className="h-1.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
            <span className="text-[8px] text-slate-400 dark:text-white/30">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HazardVisual() {
  const tv = useTranslations('Landing.visuals');
  const hazards = [
    { label: tv('hazard1Label'), km: tv('hazard1Km'), level: tv('hazardLevelHigh'), color: '#ef4444', bar: 85 },
    { label: tv('hazard2Label'), km: tv('hazard2Km'), level: tv('hazardLevelMedium'), color: '#f59e0b', bar: 55 },
    { label: tv('hazard3Label'), km: tv('hazard3Km'), level: tv('hazardLevelHigh'), color: '#ef4444', bar: 75 },
  ];
  return (
    <div className="flex flex-col gap-2">
      {hazards.map((h) => (
        <div key={h.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/5 dark:bg-white/3">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" style={{ color: h.color }} />
              <span className="text-[10px] font-semibold text-slate-700 dark:text-white/80">{h.label}</span>
            </div>
            <span className="rounded px-1 py-0.5 text-[8px] font-bold" style={{ backgroundColor: `${h.color}20`, color: h.color }}>{h.level}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${h.bar}%`, backgroundColor: h.color }} />
            </div>
            <span className="text-[8px] text-slate-400 dark:text-white/30">{h.km}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EscapeVisual() {
  const tv = useTranslations('Landing.visuals');
  return (
    <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 dark:from-[#0f2040] dark:to-[#1a3a5c]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 112" preserveAspectRatio="none">
        <path d="M10 90 Q60 70 110 55 Q160 40 200 48 Q240 55 270 42" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" />
        <path d="M10 90 Q60 70 110 55 Q160 40 200 48 Q240 55 270 42" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="absolute top-6 left-[38%] flex flex-col items-center">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6366f1] shadow-lg shadow-indigo-500/40"><span className="text-[8px]">🏠</span></div>
        <div className="mt-0.5 rounded bg-white/80 px-1 text-[7px] text-slate-700 dark:bg-black/60 dark:text-white/80">{tv('escapeKm1')}</div>
      </div>
      <div className="absolute top-3 left-[68%] flex flex-col items-center">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f59e0b] shadow-lg shadow-amber-500/40"><span className="text-[8px]">⛺</span></div>
        <div className="mt-0.5 rounded bg-white/80 px-1 text-[7px] text-slate-700 dark:bg-black/60 dark:text-white/80">{tv('escapeKm2')}</div>
      </div>
      <div className="absolute bottom-3 right-3 rounded-lg bg-white/80 px-2 py-1 backdrop-blur-sm dark:bg-black/60">
        <span className="text-[9px] font-semibold text-[#10b981]">{tv('escapePointsFound')}</span>
      </div>
    </div>
  );
}

function CoverageVisual() {
  const tv = useTranslations('Landing.visuals');
  return (
    <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 dark:from-[#0f2040] dark:to-[#1a3a5c]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 112" preserveAspectRatio="none">
        <path d="M10 80 Q70 60 120 50 Q170 40 210 55 Q240 65 270 50" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" />
        <path d="M10 80 Q70 60 120 50 Q170 40 210 55 Q240 65 270 50" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 112">
        <defs>
          <radialGradient id="h1" cx="50%" cy="50%"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0" /></radialGradient>
          <radialGradient id="h2" cx="50%" cy="50%"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0" /></radialGradient>
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

function WindowVisual() {
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
      <div className="mb-1 text-[9px] font-medium text-slate-400 dark:text-white/30">{tv('windowLabel')}</div>
      {windows.map((w) => (
        <div key={w.time} className="flex items-center gap-2">
          <span className="w-10 text-[9px] text-slate-500 dark:text-white/40">{w.time}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/5">
            <div className="h-full rounded-full" style={{ width: `${w.score}%`, backgroundColor: w.good ? '#22c55e' : '#ef4444', opacity: w.good ? 1 : 0.6 }} />
          </div>
          <span className="w-7 text-right text-[9px] font-bold" style={{ color: w.good ? '#22c55e' : '#ef4444' }}>{w.score}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-green-50 px-2 py-1 dark:bg-[#22c55e]/10">
        <Zap className="h-3 w-3 text-[#22c55e]" />
        <span className="text-[9px] font-semibold text-[#22c55e]">{tv('windowRecommended')}</span>
      </div>
    </div>
  );
}

/* ─── HOW IT WORKS ────────────────────────────────────────── */
function HowItWorks() {
  const t = useTranslations('Landing.howItWorks');
  const steps = [
    { icon: <Upload className="h-6 w-6" />, title: t('step1Title'), description: t('step1Desc'), color: '#3b82f6' },
    { icon: <Clock className="h-6 w-6" />, title: t('step2Title'), description: t('step2Desc'), color: '#a855f7' },
    { icon: <Map className="h-6 w-6" />, title: t('step3Title'), description: t('step3Desc'), color: '#10b981' },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">{t('sectionLabel')}</span>
        </div>
        <h2 className="font-heading mb-16 text-center text-4xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="absolute top-10 right-[16.67%] left-[16.67%] hidden h-px bg-gradient-to-r from-[#3b82f6]/30 via-[#a855f7]/30 to-[#10b981]/30 md:block" />
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border shadow-xl" style={{ backgroundColor: `${step.color}12`, borderColor: `${step.color}30`, color: step.color }}>
                {step.icon}
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: step.color }}>{i + 1}</span>
              </div>
              <h3 className="font-heading mb-2 text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-white/45">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── IMPORT SOURCES ──────────────────────────────────────── */
function ImportSources() {
  const t = useTranslations('Landing.import');
  const sources = [
    { icon: <Upload className="h-4 w-4" />, label: t('gpxLabel'), sub: t('gpxSub'), color: '#3b82f6' },
    { icon: <Activity className="h-4 w-4" />, label: t('stravaLabel'), sub: t('stravaSub'), color: '#fc4c02' },
    { icon: <Globe className="h-4 w-4" />, label: t('wikilocLabel'), sub: t('wikilocSub'), color: '#f59e0b' },
  ];
  const activities = [
    { name: t('act1Name'), dist: t('act1Dist'), date: t('act1Date'), type: 'cycling' },
    { name: t('act2Name'), dist: t('act2Dist'), date: t('act2Date'), type: 'cycling' },
    { name: t('act3Name'), dist: t('act3Dist'), date: t('act3Date'), type: 'hiking' },
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white dark:border-white/7 dark:from-[#0d1120] dark:to-[#0a0e1a]">
          <div className="grid md:grid-cols-2">
            <div className="flex flex-col justify-center p-10">
              <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">{t('sectionLabel')}</span>
              <h2 className="font-heading mb-4 text-3xl font-bold text-slate-900 dark:text-white">
                {t('title1')}<br />{t('title2')}
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-white/45">{t('description')}</p>
              <div className="flex flex-col gap-3">
                {sources.map((src) => (
                  <div key={src.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/5 dark:bg-white/3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${src.color}20`, color: src.color }}>{src.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{src.label}</div>
                      <div className="text-xs text-slate-500 dark:text-white/40">{src.sub}</div>
                    </div>
                    <CheckCircle2 className="ml-auto h-4 w-4 text-[#3b82f6]" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center border-t border-slate-200 bg-slate-50 p-8 dark:border-white/5 dark:bg-[#080b14] md:border-t-0 md:border-l">
              <div className="w-full max-w-[260px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/8 dark:bg-[#0f1624] dark:shadow-none">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 dark:border-white/5 dark:bg-[#0a0e1a]">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-[#fc4c02]" />
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-white/60">{t('mockupTitle')}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 p-3">
                  {activities.map((a) => (
                    <div key={a.name} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-white/5 dark:bg-white/3 dark:hover:border-[#3b82f6]/30 dark:hover:bg-[#3b82f6]/5">
                      {a.type === 'cycling' ? <Bike className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-white/30" /> : <Footprints className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-white/30" />}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-medium text-slate-700 dark:text-white/80">{a.name}</div>
                        <div className="text-[8px] text-slate-400 dark:text-white/30">{a.dist} · {a.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── DATA SOURCES ────────────────────────────────────────── */
function DataSources() {
  const t = useTranslations('Landing.dataSources');
  const sources = [
    { name: 'Open-Meteo', sub: t('openMeteoSub'), icon: <CloudRain className="h-4 w-4" />, color: '#60a5fa' },
    { name: 'OpenStreetMap', sub: t('osmSub'), icon: <Map className="h-4 w-4" />, color: '#10b981' },
    { name: 'OpenCellID', sub: t('openCellSub'), icon: <Signal className="h-4 w-4" />, color: '#f97316' },
    { name: 'Strava API', sub: t('stravaSub'), icon: <Activity className="h-4 w-4" />, color: '#fc4c02' },
    { name: 'WeatherAPI', sub: t('weatherApiSub'), icon: <Sun className="h-4 w-4" />, color: '#f59e0b' },
    { name: 'Tomorrow.io', sub: t('tomorrowSub'), icon: <Droplets className="h-4 w-4" />, color: '#818cf8' },
  ];
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-white/25">{t('label')}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {sources.map((src) => (
            <div key={src.name} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-slate-300 dark:border-white/6 dark:bg-white/2 dark:shadow-none dark:hover:border-white/12">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${src.color}15`, color: src.color }}>{src.icon}</div>
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-white/70">{src.name}</div>
                <div className="text-[9px] text-slate-400 dark:text-white/30">{src.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ───────────────────────────────────────────── */
function FinalCTA() {
  const t = useTranslations('Landing.cta');
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-50 p-12 text-center dark:border-[#3b82f6]/20 dark:from-[#0d1a36] dark:via-[#0f1e40] dark:to-[#0a1225]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[80px] dark:bg-[#3b82f6]/10" />
          </div>
          <div className="relative">
            <div className="mb-3 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-100 px-4 py-1.5 text-xs font-medium text-blue-700 dark:border-[#3b82f6]/30 dark:bg-[#3b82f6]/10 dark:text-[#93c5fd]">
                <Bike className="h-3.5 w-3.5" />{t('badge')}<Footprints className="h-3.5 w-3.5" />
              </span>
            </div>
            <h2 className="font-heading mb-4 text-4xl font-bold text-slate-900 dark:text-white md:text-5xl">
              {t('title1')}<br />
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] bg-clip-text text-transparent">{t('title2')}</span>
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-base text-slate-600 dark:text-white/50">{t('subtitle')}</p>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-500/25 transition-all hover:bg-[#2563eb]">
              {t('button')} <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-4 text-xs text-slate-400 dark:text-white/25">{t('footnote')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────── */
function Footer() {
  const t = useTranslations('Landing.footer');
  return (
    <footer className="border-t border-slate-200 py-10 dark:border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <LogoIcon className="h-6 w-6 text-[#3b82f6]" />
          <span className="font-heading text-sm font-bold text-slate-500 dark:text-white/70">zustrack</span>
        </div>
        <div className="flex gap-6">
          {[
            { label: t('privacy'), href: '/privacy' },
            { label: t('terms'), href: '/terms' },
            { label: t('login'), href: '/app/login' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="text-xs text-slate-400 transition-colors hover:text-slate-700 dark:text-white/35 dark:hover:text-white/70">{l.label}</Link>
          ))}
        </div>
        <p className="text-xs text-slate-300 dark:text-white/20">© {new Date().getFullYear()} zustrack</p>
      </div>
    </footer>
  );
}

/* ─── PAGE ────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#08090f] dark:text-white">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <ImportSources />
      <DataSources />
      <FinalCTA />
      <Footer />
    </div>
  );
}
