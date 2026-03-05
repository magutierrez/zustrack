import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { AppMockup } from './app-mockup-loader';

export async function Hero() {
  const t = await getTranslations('Landing.hero');

  return (
    <section className="relative overflow-hidden pt-32 pb-24 lg:pt-48 lg:pb-32">
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 hidden md:block">
            <Link
              href="/app/login"
              className="group relative inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-white/50 px-4 py-1.5 text-sm font-medium text-blue-800 shadow-sm backdrop-blur-md transition-colors hover:border-blue-300 hover:bg-white/80 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/20"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
              </span>
              {t('badge')}
              <ChevronRight className="h-4 w-4 text-blue-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <h1 className="font-heading animate-fade-in-up mb-8 max-w-4xl text-5xl leading-[1.1] font-extrabold tracking-tight text-slate-900 md:text-7xl lg:text-8xl dark:text-white">
            {t('title1')}
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                {t('title2')}
              </span>
            </span>
          </h1>

          <p className="mb-12 max-w-2xl text-lg text-slate-600 sm:text-xl dark:text-slate-300">
            {t('subtitleBefore')}{' '}
            <strong className="font-semibold text-slate-900 dark:text-white">
              {t('subtitleStrong')}
            </strong>{' '}
            {t('subtitleAfter')}
          </p>

          <div className="mb-20 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/app/login"
              className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-900"
            >
              <span className="absolute inset-0 z-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative z-10 flex items-center gap-2 group-hover:text-white">
                {t('cta1')}{' '}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <a
              href="#features"
              className="group flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
            >
              {t('cta2')}
            </a>
          </div>

          <div className="mb-20 grid w-full max-w-3xl grid-cols-1 gap-8 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-white/10">
            {[
              { value: t('stat1Value'), label: t('stat1Label') },
              { value: t('stat2Value'), label: t('stat2Label') },
              { value: t('stat3Value'), label: t('stat3Label') },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center py-4 sm:py-0">
                <div className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
                  {s.value}
                </div>
                <div className="mt-1 text-sm font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200/50 bg-white/50 p-2 shadow-2xl shadow-blue-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-blue-900/20">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-white/40 to-white/0 dark:from-white/5 dark:to-transparent" />
          <AppMockup />
        </div>
      </div>
    </section>
  );
}
