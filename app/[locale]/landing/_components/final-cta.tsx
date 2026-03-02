'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Bike, Footprints, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function FinalCTA() {
  const t = useTranslations('Landing.cta');

  return (
    <section className="relative overflow-hidden py-32 lg:py-48">
      {/* Deep dynamic background */}
      <div className="absolute inset-0 bg-slate-900" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[120px]"
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-6 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur-md">
            <Bike className="h-4 w-4" />
            {t('badge')}
            <Footprints className="h-4 w-4" />
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading mb-6 text-5xl font-extrabold tracking-tight md:text-7xl"
        >
          {t('title1')}
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {t('title2')}
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 md:text-xl"
        >
          {t('subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center gap-6"
        >
          <Link
            href="/app/login"
            className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-white px-10 py-5 text-lg font-bold text-slate-900 transition-transform hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 z-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative z-10 flex items-center gap-2">
              {t('button')}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <p className="text-sm font-medium text-slate-500">{t('footnote')}</p>
        </motion.div>
      </div>
    </section>
  );
}
