import { getTranslations } from 'next-intl/server';
import {
  CloudRain,
  Mountain,
  AlertTriangle,
  LifeBuoy,
  Signal,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  WeatherVisual,
  ElevationVisual,
  HazardVisual,
  EscapeVisual,
  CoverageVisual,
  WindowVisual,
} from './feature-visuals';

export async function Features() {
  const t = await getTranslations('Landing.features');

  const features = [
    {
      icon: <CloudRain className="h-6 w-6" />,
      color: 'from-indigo-500 to-blue-500',
      shadow: 'shadow-indigo-500/20',
      title: t('weatherTitle'),
      description: t('weatherDesc'),
      visual: <WeatherVisual />,
    },
    {
      icon: <Mountain className="h-6 w-6" />,
      color: 'from-blue-500 to-sky-500',
      shadow: 'shadow-blue-500/20',
      title: t('elevTitle'),
      description: t('elevDesc'),
      visual: <ElevationVisual />,
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/20',
      title: t('hazardsTitle'),
      description: t('hazardsDesc'),
      visual: <HazardVisual />,
    },
    {
      icon: <LifeBuoy className="h-6 w-6" />,
      color: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      title: t('escapeTitle'),
      description: t('escapeDesc'),
      visual: <EscapeVisual />,
    },
    {
      icon: <Signal className="h-6 w-6" />,
      color: 'from-orange-500 to-red-500',
      shadow: 'shadow-orange-500/20',
      title: t('coverageTitle'),
      description: t('coverageDesc'),
      visual: <CoverageVisual />,
    },
    {
      icon: <Clock className="h-6 w-6" />,
      color: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/20',
      title: t('windowTitle'),
      description: t('windowDesc'),
      visual: <WindowVisual />,
    },
  ];

  const extras = [
    t('extra1'),
    t('extra2'),
    t('extra3'),
    t('extra4'),
    t('extra5'),
    t('extra6'),
    t('extra7'),
    t('extra8'),
  ];

  return (
    <section id="features" className="relative py-24 lg:py-32">
      {/* Background Decorators */}
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-1/2 bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-900/50" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-16 flex flex-col items-center text-center md:mb-24">
          <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {t('sectionLabel')}
          </span>
          <h2 className="font-heading mb-6 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white">
            {t('title')}
          </h2>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">{t('subtitle')}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title}>
              <FeatureCard {...f} />
            </div>
          ))}
        </div>

        <div className="mt-16 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
          <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5 dark:border-white/5 dark:bg-white/2">
            <h3 className="text-sm font-bold tracking-widest text-slate-900 uppercase dark:text-white">
              {t('extrasLabel')}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 p-8 sm:grid-cols-3 md:grid-cols-4">
            {extras.map((item) => (
              <div key={item} className="group flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/20 dark:text-blue-400 dark:group-hover:bg-blue-500 dark:group-hover:text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  color,
  shadow,
  title,
  description,
  visual,
}: {
  icon: React.ReactNode;
  color: string;
  shadow: string;
  title: string;
  description: string;
  visual: React.ReactNode;
}) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-white/20 dark:hover:shadow-none">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:to-white/5" />

      <div className="relative border-b border-slate-100 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-black/20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10" />
        <div className="overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-900/5 dark:shadow-none dark:ring-white/10">
          {visual}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-8">
        <div
          className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg ${shadow}`}
        >
          {icon}
        </div>
        <h3 className="font-heading mb-3 text-xl font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}
