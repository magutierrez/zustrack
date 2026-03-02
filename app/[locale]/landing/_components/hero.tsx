'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { AppMockup } from './app-mockup';
import { motion } from 'motion/react';

export function Hero() {
  const t = useTranslations('Landing.hero');

  return (
    <section className="relative overflow-hidden pt-32 pb-24 lg:pt-48 lg:pb-32">
      {/* Stripe-like dynamic animated background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-[20%] -left-[10%] h-[70vw] w-[70vw] rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-500/20 blur-[120px] dark:from-blue-600/30 dark:to-indigo-600/30"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-[20%] left-[60%] h-[60vw] w-[60vw] rounded-full bg-gradient-to-bl from-sky-400/20 to-emerald-400/20 blur-[120px] dark:from-sky-400/20 dark:to-teal-500/20"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:24px_24px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-8"
          >
            <span className="group relative inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-white/50 px-4 py-1.5 text-sm font-medium text-blue-800 shadow-sm backdrop-blur-md transition-colors hover:border-blue-300 hover:bg-white/80 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
              </span>
              {t('badge')}
              <ChevronRight className="h-4 w-4 text-blue-500 transition-transform group-hover:translate-x-0.5" />
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="font-heading mb-8 max-w-4xl text-5xl leading-[1.1] font-extrabold tracking-tight text-slate-900 md:text-7xl lg:text-8xl dark:text-white"
          >
            {t('title1')}
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                {t('title2')}
              </span>
              <motion.span
                className="absolute -inset-1 -z-10 block rounded-lg bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-xl"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="mb-12 max-w-2xl text-lg text-slate-600 sm:text-xl dark:text-slate-300"
          >
            {t('subtitleBefore')}{' '}
            <strong className="font-semibold text-slate-900 dark:text-white">
              {t('subtitleStrong')}
            </strong>{' '}
            {t('subtitleAfter')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            className="mb-20 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mb-20 grid w-full max-w-3xl grid-cols-1 gap-8 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-white/10"
          >
            {[
              { value: t('stat1Value'), label: t('stat1Label') },
              { value: t('stat2Value'), label: t('stat2Label') },
              { value: t('stat3Value'), label: t('stat3Label') },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className="flex flex-col items-center justify-center py-4 sm:py-0"
              >
                <div className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
                  {s.value}
                </div>
                <div className="mt-1 text-sm font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, type: 'spring', stiffness: 50 }}
          className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200/50 bg-white/50 p-2 shadow-2xl shadow-blue-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-blue-900/20"
        >
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-white/40 to-white/0 dark:from-white/5 dark:to-transparent" />
          <AppMockup />
        </motion.div>
      </div>
    </section>
  );
}
