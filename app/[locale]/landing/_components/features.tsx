'use client';

import { useTranslations } from 'next-intl';
import {
  CloudRain,
  Mountain,
  AlertTriangle,
  LifeBuoy,
  Signal,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  WeatherVisual,
  ElevationVisual,
  HazardVisual,
  EscapeVisual,
  CoverageVisual,
  WindowVisual,
} from './feature-visuals';

export function Features() {
  const t = useTranslations('Landing.features');

  const features = [
    {
      icon: <CloudRain className="h-5 w-5" />,
      color: '#818cf8',
      title: t('weatherTitle'),
      description: t('weatherDesc'),
      visual: <WeatherVisual />,
    },
    {
      icon: <Mountain className="h-5 w-5" />,
      color: '#3b82f6',
      title: t('elevTitle'),
      description: t('elevDesc'),
      visual: <ElevationVisual />,
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      color: '#f59e0b',
      title: t('hazardsTitle'),
      description: t('hazardsDesc'),
      visual: <HazardVisual />,
    },
    {
      icon: <LifeBuoy className="h-5 w-5" />,
      color: '#10b981',
      title: t('escapeTitle'),
      description: t('escapeDesc'),
      visual: <EscapeVisual />,
    },
    {
      icon: <Signal className="h-5 w-5" />,
      color: '#f97316',
      title: t('coverageTitle'),
      description: t('coverageDesc'),
      visual: <CoverageVisual />,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      color: '#a855f7',
      title: t('windowTitle'),
      description: t('windowDesc'),
      visual: <WindowVisual />,
    },
  ];

  const extras = [
    t('extra1'),
    t('extra2'),
    t('extra3'),
    t('extra4'),
    t('extra5'),
    t('extra6'),
    t('extra7'),
    t('extra8'),
  ];

  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold tracking-widest text-[#3b82f6] uppercase">
            {t('sectionLabel')}
          </span>
        </div>
        <h2 className="font-heading mb-4 text-center text-4xl font-bold text-slate-900 dark:text-white">
          {t('title')}
        </h2>
        <p className="mx-auto mb-16 max-w-xl text-center text-slate-500 dark:text-white/50">
          {t('subtitle')}
        </p>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-white/6 dark:bg-white/2">
          <p className="mb-4 text-xs font-semibold tracking-widest text-slate-400 uppercase dark:text-white/30">
            {t('extrasLabel')}
          </p>
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

function FeatureCard({
  icon,
  color,
  title,
  description,
  visual,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  visual: React.ReactNode;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition-all hover:border-slate-300 hover:shadow-md dark:border-white/7 dark:bg-[#0d1120] dark:hover:border-white/15 dark:hover:shadow-none">
      <div className="border-b border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-[#0a0e1a]">
        {visual}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {icon}
        </div>
        <h3 className="font-heading text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-white/45">{description}</p>
      </div>
    </div>
  );
}
