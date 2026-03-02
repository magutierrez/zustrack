'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { AppMockup } from './app-mockup';

export function Hero() {
  const t = useTranslations('Landing.hero');
  return (
    <section className="relative overflow-hidden pt-32 pb-24">
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
            href="/app/login"
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
              <div className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                {s.value}
              </div>
              <div className="text-xs text-slate-400 dark:text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        <AppMockup />
      </div>
    </section>
  );
}
