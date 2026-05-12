'use client';

import { useTranslations } from 'next-intl';
import { StatsGrid } from './stats-grid';
import type { Trail } from '@/lib/trails';

interface TrailStatsSectionProps {
  trail: Trail;
  highPointCoords: { lat: number; lng: number } | null;
  lowPointCoords: { lat: number; lng: number } | null;
  onShowOnMap: (lat: number, lng: number) => void;
}

export function TrailStatsSection({
  trail,
  highPointCoords,
  lowPointCoords,
  onShowOnMap,
}: TrailStatsSectionProps) {
  const t = useTranslations('TrailPage');

  return (
    <StatsGrid
      distanceKm={trail.distance_km}
      elevationGainM={trail.elevation_gain_m}
      elevationLossM={trail.elevation_loss_m}
      elevationMaxM={trail.elevation_max_m}
      elevationMinM={trail.elevation_min_m}
      avgElevationM={trail.avg_elevation_m}
      estimatedDurationMin={trail.estimated_duration_min}
      highPointCoords={highPointCoords}
      lowPointCoords={lowPointCoords}
      onShowOnMap={onShowOnMap}
      labels={{
        distance: t('distance'),
        elevationGain: t('elevationGain'),
        elevationLoss: t('elevationLoss'),
        highPoint: t('highPoint'),
        lowPoint: t('lowPoint'),
        avgElevation: t('avgElevation'),
        duration: t('duration'),
        km: t('km'),
        meters: t('meters'),
        showOnMap: t('showOnMap'),
        durationH: t('durationH'),
        durationMin: t('durationMin'),
      }}
    />
  );
}
