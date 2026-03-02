'use client';

import { useTranslations } from 'next-intl';
import { CloudRain, Map, Signal, Activity, Sun, Droplets } from 'lucide-react';
import { motion } from 'motion/react';

export function DataSources() {
  const t = useTranslations('Landing.dataSources');

  const sources = [
    {
      name: 'Open-Meteo',
      sub: t('openMeteoSub'),
      icon: <CloudRain className="h-5 w-5" />,
      color: 'from-blue-400 to-blue-600',
      shadow: 'shadow-blue-500/20',
    },
    {
      name: 'OpenStreetMap',
      sub: t('osmSub'),
      icon: <Map className="h-5 w-5" />,
      color: 'from-emerald-400 to-emerald-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      name: 'OpenCellID',
      sub: t('openCellSub'),
      icon: <Signal className="h-5 w-5" />,
      color: 'from-orange-400 to-orange-600',
      shadow: 'shadow-orange-500/20',
    },
    {
      name: 'Strava API',
      sub: t('stravaSub'),
      icon: <Activity className="h-5 w-5" />,
      color: 'from-[#fc4c02] to-[#e04300]',
      shadow: 'shadow-[#fc4c02]/20',
    },
    {
      name: 'WeatherAPI',
      sub: t('weatherApiSub'),
      icon: <Sun className="h-5 w-5" />,
      color: 'from-amber-400 to-amber-600',
      shadow: 'shadow-amber-500/20',
    },
    {
      name: 'Tomorrow.io',
      sub: t('tomorrowSub'),
      icon: <Droplets className="h-5 w-5" />,
      color: 'from-indigo-400 to-indigo-600',
      shadow: 'shadow-indigo-500/20',
    },
  ];

  return (
    <section className="relative overflow-hidden border-y border-slate-200/50 bg-white py-16 dark:border-white/5 dark:bg-[#08090f]">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center text-sm font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400"
        >
          {t('label')}
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-6">
          {sources.map((src, i) => (
            <motion.div
              key={src.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-white/20"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20 dark:group-hover:opacity-30" />

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${src.color} text-white shadow-lg ${src.shadow}`}
              >
                {src.icon}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{src.name}</div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {src.sub}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
