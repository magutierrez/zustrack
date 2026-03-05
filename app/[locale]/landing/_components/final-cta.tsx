import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { Bike, Footprints, ArrowRight } from 'lucide-react';

export async function FinalCTA() {
  const t = await getTranslations('Landing.cta');

  return (
    <section className="relative overflow-hidden py-32 lg:py-48">
      {/* Deep background */}
      <div className="absolute inset-0 bg-slate-900" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
      <div className="absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl px-6 text-center text-white">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur-md">
            <Bike className="h-4 w-4" />
            {t('badge')}
            <Footprints className="h-4 w-4" />
          </span>
        </div>

        <h2 className="font-heading mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
          {t('title1')}
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {t('title2')}
          </span>
        </h2>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 md:text-xl">{t('subtitle')}</p>

        <div className="flex flex-col items-center gap-6">
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
        </div>
      </div>
    </section>
  );
}
