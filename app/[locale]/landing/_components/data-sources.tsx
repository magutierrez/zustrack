'use client';

import { useTranslations } from 'next-intl';
import { CloudRain, Map, Signal, Activity, Sun, Droplets } from 'lucide-react';

export function DataSources() {
  const t = useTranslations('Landing.dataSources');
  const sources = [
    {
      name: 'Open-Meteo',
      sub: t('openMeteoSub'),
      icon: <CloudRain className="h-4 w-4" />,
      color: '#60a5fa',
    },
    {
      name: 'OpenStreetMap',
      sub: t('osmSub'),
      icon: <Map className="h-4 w-4" />,
      color: '#10b981',
    },
    {
      name: 'OpenCellID',
      sub: t('openCellSub'),
      icon: <Signal className="h-4 w-4" />,
      color: '#f97316',
    },
    {
      name: 'Strava API',
      sub: t('stravaSub'),
      icon: <Activity className="h-4 w-4" />,
      color: '#fc4c02',
    },
    {
      name: 'WeatherAPI',
      sub: t('weatherApiSub'),
      icon: <Sun className="h-4 w-4" />,
      color: '#f59e0b',
    },
    {
      name: 'Tomorrow.io',
      sub: t('tomorrowSub'),
      icon: <Droplets className="h-4 w-4" />,
      color: '#818cf8',
    },
  ];
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-8 text-center text-xs font-semibold tracking-widest text-slate-400 uppercase dark:text-white/25">
          {t('label')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {sources.map((src) => (
            <div
              key={src.name}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-slate-300 dark:border-white/6 dark:bg-white/2 dark:shadow-none dark:hover:border-white/12"
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${src.color}15`, color: src.color }}
              >
                {src.icon}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-white/70">
                  {src.name}
                </div>
                <div className="text-[9px] text-slate-400 dark:text-white/30">{src.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
