'use client';

import { useTranslations } from 'next-intl';
import type { TrailSummary } from '@/lib/trails';
import { TrailCard } from './trail-card';

interface TrailSimilarTrailsProps {
  similarTrails: TrailSummary[];
  locale: string;
}

export function TrailSimilarTrails({ similarTrails, locale }: TrailSimilarTrailsProps) {
  const t = useTranslations('TrailPage');

  if (similarTrails.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t('similarTrails')}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {similarTrails.map((s) => (
          <TrailCard
            key={s.id}
            trail={s as Parameters<typeof TrailCard>[0]['trail']}
            locale={locale}
            labels={{
              easy: t('easy'),
              moderate: t('moderate'),
              hard: t('hard'),
              veryHard: t('veryHard'),
              circular: t('circular'),
              linear: t('linear'),
              km: t('km'),
              meters: t('meters'),
              durationH: t('durationH'),
              durationMin: t('durationMin'),
            }}
          />
        ))}
      </div>
    </section>
  );
}
