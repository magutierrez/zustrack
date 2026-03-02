'use client';

import { useTranslations } from 'next-intl';
import { Upload, Clock, Map } from 'lucide-react';

export function HowItWorks() {
  const t = useTranslations('Landing.howItWorks');
  const steps = [
    {
      icon: <Upload className="h-6 w-6" />,
      title: t('step1Title'),
      description: t('step1Desc'),
      color: '#3b82f6',
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: t('step2Title'),
      description: t('step2Desc'),
      color: '#a855f7',
    },
    {
      icon: <Map className="h-6 w-6" />,
      title: t('step3Title'),
      description: t('step3Desc'),
      color: '#10b981',
    },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold tracking-widest text-[#3b82f6] uppercase">
            {t('sectionLabel')}
          </span>
        </div>
        <h2 className="font-heading mb-16 text-center text-4xl font-bold text-slate-900 dark:text-white">
          {t('title')}
        </h2>
        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="absolute top-10 right-[16.67%] left-[16.67%] hidden h-px bg-gradient-to-r from-[#3b82f6]/30 via-[#a855f7]/30 to-[#10b981]/30 md:block" />
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              <div
                className="relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border shadow-xl"
                style={{
                  backgroundColor: `${step.color}12`,
                  borderColor: `${step.color}30`,
                  color: step.color,
                }}
              >
                {step.icon}
                <span
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: step.color }}
                >
                  {i + 1}
                </span>
              </div>
              <h3 className="font-heading mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-white/45">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
