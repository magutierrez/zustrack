'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Bike, Footprints, ArrowRight } from 'lucide-react';

export function FinalCTA() {
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
                <Bike className="h-3.5 w-3.5" />
                {t('badge')}
                <Footprints className="h-3.5 w-3.5" />
              </span>
            </div>
            <h2 className="font-heading mb-4 text-4xl font-bold text-slate-900 md:text-5xl dark:text-white">
              {t('title1')}
              <br />
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] bg-clip-text text-transparent">
                {t('title2')}
              </span>
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-base text-slate-600 dark:text-white/50">
              {t('subtitle')}
            </p>
            <Link
              href="/app/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-500/25 transition-all hover:bg-[#2563eb]"
            >
              {t('button')} <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-4 text-xs text-slate-400 dark:text-white/25">{t('footnote')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
