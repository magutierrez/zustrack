'use client';

import { useTranslations } from 'next-intl';
import {
  Footprints,
  Info,
  CloudHail,
  Layers,
  Thermometer,
  MountainSnow,
  MapPin,
} from 'lucide-react';
import type { MudRiskLevel } from '@/lib/types';
import type { MudRiskSegment } from '@/lib/mud-risk';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { MudInfoRow } from './mud-info-row';
import { useRouteStore } from '@/store/route-store';

export interface MudRiskInputs {
  avgPrecip: number;
  dominantSurface: string | undefined;
  avgTemp: number;
  avgWind: number;
  shadedPct: number;
}

const MUD_LEVELS: MudRiskLevel[] = ['none', 'low', 'medium', 'high'];

const TRAFFIC_LIGHT_COLORS: Record<MudRiskLevel, string> = {
  none: 'bg-emerald-500',
  low: 'bg-yellow-400',
  medium: 'bg-orange-500',
  high: 'bg-red-600',
};

const CARD_BORDER: Record<MudRiskLevel, string> = {
  none: 'border-emerald-500/30',
  low: 'border-yellow-400/30',
  medium: 'border-orange-500/40',
  high: 'border-red-600/40',
};

const CARD_BG: Record<MudRiskLevel, string> = {
  none: 'bg-emerald-500/5',
  low: 'bg-yellow-400/5',
  medium: 'bg-orange-500/8',
  high: 'bg-red-600/8',
};

interface MudRiskCardProps {
  overallRisk: MudRiskLevel;
  segments: MudRiskSegment[];
  activityType: 'cycling' | 'walking';
  inputs: MudRiskInputs;
}

export function MudRiskCard({ overallRisk, segments, activityType, inputs }: MudRiskCardProps) {
  const t = useTranslations('Advice');
  const setSelectedRange = useRouteStore((s) => s.setSelectedRange);
  const typeKey = activityType === 'cycling' ? 'cycling' : 'hiking';

  const adviceKey =
    overallRisk === 'none'
      ? 'mudNone'
      : overallRisk === 'low'
        ? 'mudLow'
        : `mud${overallRisk.charAt(0).toUpperCase() + overallRisk.slice(1)}${activityType.charAt(0).toUpperCase() + activityType.slice(1)}`;

  const adviceText =
    overallRisk === 'none' || overallRisk === 'low'
      ? t(adviceKey as Parameters<typeof t>[0])
      : t(`${typeKey}.${adviceKey}` as Parameters<typeof t>[0]);

  const riskySegments = segments.filter((s) => s.level === 'medium' || s.level === 'high');

  return (
    <Card className={cn('overflow-hidden border', CARD_BORDER[overallRisk], CARD_BG[overallRisk])}>
      <CardContent className="flex gap-4 p-4">
        {/* Traffic Light */}
        <div className="mt-0.5 flex flex-shrink-0 flex-col items-center gap-1">
          {MUD_LEVELS.map((level) => (
            <div
              key={level}
              className={cn(
                'h-3 w-3 rounded-full transition-opacity',
                level === overallRisk ? TRAFFIC_LIGHT_COLORS[level] : 'bg-muted-foreground/20',
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Footprints className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              {t('mud')}
            </span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                overallRisk === 'none' &&
                  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                overallRisk === 'low' && 'bg-yellow-400/15 text-yellow-700 dark:text-yellow-400',
                overallRisk === 'medium' && 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
                overallRisk === 'high' && 'bg-red-600/15 text-red-700 dark:text-red-400',
              )}
            >
              {t(`mudLevel.${overallRisk}` as Parameters<typeof t>[0])}
            </span>

            {/* Info popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground ml-auto transition-colors">
                  <Info className="h-3.5 w-3.5" />
                  <span className="sr-only">{t('mudInfoTitle')}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="end" side="top">
                <div className="border-border bg-popover rounded-lg border p-3">
                  <p className="text-foreground mb-2.5 text-xs font-semibold">
                    {t('mudInfoTitle')}
                  </p>
                  <ul className="flex flex-col gap-2">
                    <MudInfoRow
                      icon={<CloudHail className="h-3.5 w-3.5 text-blue-500" />}
                      label={t('mudInfoPrecipLabel')}
                      value={`${inputs.avgPrecip} mm`}
                      detail={t('mudInfoPrecipDetail')}
                    />
                    <MudInfoRow
                      icon={<Layers className="h-3.5 w-3.5 text-amber-600" />}
                      label={t('mudInfoSurfaceLabel')}
                      value={inputs.dominantSurface ?? t('mudInfoSurfaceUnknown')}
                      detail={t('mudInfoSurfaceDetail')}
                    />
                    <MudInfoRow
                      icon={<Thermometer className="h-3.5 w-3.5 text-orange-500" />}
                      label={t('mudInfoDryingLabel')}
                      value={`${inputs.avgTemp}°C · ${inputs.avgWind} km/h`}
                      detail={t('mudInfoDryingDetail')}
                    />
                    <MudInfoRow
                      icon={<MountainSnow className="h-3.5 w-3.5 text-slate-500" />}
                      label={t('mudInfoSlopeLabel')}
                      value={
                        inputs.shadedPct > 0
                          ? `${inputs.shadedPct}% ${t('mudInfoShaded')}`
                          : t('mudInfoOpenTerrain')
                      }
                      detail={t('mudInfoSlopeDetail')}
                    />
                  </ul>
                  <p className="text-muted-foreground mt-2.5 border-t pt-2 text-[10px] leading-relaxed">
                    {t('mudInfoNote')}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <p className="text-foreground text-sm leading-relaxed">{adviceText}</p>

          {riskySegments.length > 0 && (
            <ul className="mt-0.5 flex flex-col gap-1">
              {riskySegments.map((seg, i) => (
                <li key={i} className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <span
                    className={cn(
                      'inline-block h-2 w-2 flex-shrink-0 rounded-full',
                      seg.level === 'high' ? 'bg-red-500' : 'bg-orange-400',
                    )}
                  />
                  {t('mudKmRange', { start: seg.startKm, end: seg.endKm })}
                  <button
                    onClick={() => setSelectedRange({ start: seg.startKm, end: seg.endKm })}
                    className="text-primary hover:text-primary/80 ml-auto flex items-center gap-0.5 transition-colors"
                  >
                    <MapPin className="h-3 w-3" />
                    <span>{t('viewOnMap')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
