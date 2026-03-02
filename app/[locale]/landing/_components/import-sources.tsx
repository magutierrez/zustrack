'use client';

import { useTranslations } from 'next-intl';
import { Upload, Activity, Globe, CheckCircle2, Bike, Footprints } from 'lucide-react';
import { motion } from 'motion/react';

export function ImportSources() {
  const t = useTranslations('Landing.import');

  const sources = [
    {
      icon: <Upload className="h-5 w-5" />,
      label: t('gpxLabel'),
      sub: t('gpxSub'),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: <Activity className="h-5 w-5" />,
      label: t('stravaLabel'),
      sub: t('stravaSub'),
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      icon: <Globe className="h-5 w-5" />,
      label: t('wikilocLabel'),
      sub: t('wikilocSub'),
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  const activities = [
    { name: t('act1Name'), dist: t('act1Dist'), date: t('act1Date'), type: 'cycling' },
    { name: t('act2Name'), dist: t('act2Dist'), date: t('act2Date'), type: 'cycling' },
    { name: t('act3Name'), dist: t('act3Dist'), date: t('act3Date'), type: 'hiking' },
  ];

  return (
    <section className="relative overflow-hidden bg-slate-50 py-24 lg:py-32 dark:bg-[#08090f]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent opacity-50 dark:from-blue-900/20" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <span className="mb-4 inline-flex w-fit items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400">
              {t('sectionLabel')}
            </span>
            <h2 className="font-heading mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white">
              {t('title1')}
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                {t('title2')}
              </span>
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              {t('description')}
            </p>

            <div className="flex flex-col gap-4">
              {sources.map((src, i) => (
                <motion.div
                  key={src.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-white/20"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${src.bg} ${src.color}`}
                  >
                    {src.icon}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-slate-900 dark:text-white">
                      {src.label}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{src.sub}</div>
                  </div>
                  <motion.div
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10"
                    whileHover={{ scale: 1.1 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="relative w-full max-w-md lg:ml-auto"
          >
            {/* Glow behind the mockup */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-orange-500 to-pink-500 opacity-20 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-white/5 dark:bg-white/2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fc4c02]/10">
                  <Activity className="h-5 w-5 text-[#fc4c02]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Strava</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t('mockupTitle')}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4">
                {activities.map((a, i) => (
                  <motion.div
                    key={a.name}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                    className="group flex cursor-pointer items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-orange-200 hover:shadow-lg dark:border-white/5 dark:bg-slate-800/50 dark:hover:border-orange-500/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-500 dark:bg-slate-700 dark:text-slate-300 dark:group-hover:bg-orange-500/20 dark:group-hover:text-orange-400">
                      {a.type === 'cycling' ? (
                        <Bike className="h-5 w-5" />
                      ) : (
                        <Footprints className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {a.name}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
                          {a.dist}
                        </span>
                        <span>{a.date}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
