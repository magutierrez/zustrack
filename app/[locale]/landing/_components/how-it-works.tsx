import { getTranslations } from 'next-intl/server';
import { Upload, Clock, Map } from 'lucide-react';

export async function HowItWorks() {
  const t = await getTranslations('Landing.howItWorks');
  const steps = [
    {
      icon: <Upload className="h-6 w-6" />,
      title: t('step1Title'),
      description: t('step1Desc'),
      color: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/20',
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: t('step2Title'),
      description: t('step2Desc'),
      color: 'from-indigo-500 to-purple-500',
      shadow: 'shadow-purple-500/20',
    },
    {
      icon: <Map className="h-6 w-6" />,
      title: t('step3Title'),
      description: t('step3Desc'),
      color: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/20',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-slate-900 py-24 text-white lg:py-32">
      {/* Dynamic Background - Static */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:32px_32px]" />
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-20 flex flex-col items-center text-center">
          <span className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-slate-300">
            {t('sectionLabel')}
          </span>
          <h2 className="font-heading mb-6 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            {t('title')}
          </h2>
        </div>

        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Connecting Line */}
          <div className="absolute top-12 right-[16.67%] left-[16.67%] hidden h-px md:block">
            <div className="absolute inset-0 bg-white/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 opacity-50" />
          </div>

          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 mb-8">
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${step.color} shadow-2xl ${step.shadow} ring-1 ring-white/20 transition-transform group-hover:scale-105`}
                >
                  {step.icon}
                </div>
                <div
                  className={`absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold shadow-lg ring-2 ring-slate-800`}
                >
                  {i + 1}
                </div>
              </div>

              <h3 className="font-heading mb-4 text-2xl font-bold">{step.title}</h3>
              <p className="max-w-xs text-base leading-relaxed text-slate-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
