'use client';

import { useTranslations } from 'next-intl';
import { Upload, Activity, Globe, CheckCircle2, Bike, Footprints } from 'lucide-react';

export function ImportSources() {
  const t = useTranslations('Landing.import');
  const sources = [
    {
      icon: <Upload className="h-4 w-4" />,
      label: t('gpxLabel'),
      sub: t('gpxSub'),
      color: '#3b82f6',
    },
    {
      icon: <Activity className="h-4 w-4" />,
      label: t('stravaLabel'),
      sub: t('stravaSub'),
      color: '#fc4c02',
    },
    {
      icon: <Globe className="h-4 w-4" />,
      label: t('wikilocLabel'),
      sub: t('wikilocSub'),
      color: '#f59e0b',
    },
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
              <span className="mb-3 text-xs font-semibold tracking-widest text-[#3b82f6] uppercase">
                {t('sectionLabel')}
              </span>
              <h2 className="font-heading mb-4 text-3xl font-bold text-slate-900 dark:text-white">
                {t('title1')}
                <br />
                {t('title2')}
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-white/45">
                {t('description')}
              </p>
              <div className="flex flex-col gap-3">
                {sources.map((src) => (
                  <div
                    key={src.label}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/5 dark:bg-white/3"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${src.color}20`, color: src.color }}
                    >
                      {src.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {src.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-white/40">{src.sub}</div>
                    </div>
                    <CheckCircle2 className="ml-auto h-4 w-4 text-[#3b82f6]" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center border-t border-slate-200 bg-slate-50 p-8 md:border-t-0 md:border-l dark:border-white/5 dark:bg-[#080b14]">
              <div className="w-full max-w-[260px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/8 dark:bg-[#0f1624] dark:shadow-none">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 dark:border-white/5 dark:bg-[#0a0e1a]">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-[#fc4c02]" />
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-white/60">
                      {t('mockupTitle')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 p-3">
                  {activities.map((a) => (
                    <div
                      key={a.name}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-white/5 dark:bg-white/3 dark:hover:border-[#3b82f6]/30 dark:hover:bg-[#3b82f6]/5"
                    >
                      {a.type === 'cycling' ? (
                        <Bike className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-white/30" />
                      ) : (
                        <Footprints className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-white/30" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-medium text-slate-700 dark:text-white/80">
                          {a.name}
                        </div>
                        <div className="text-[8px] text-slate-400 dark:text-white/30">
                          {a.dist} · {a.date}
                        </div>
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
