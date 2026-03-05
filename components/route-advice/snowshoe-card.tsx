'use client';

import { useTranslations } from 'next-intl';
import { Snowflake, MapPin } from 'lucide-react';
import type { SnowCondition } from '@/lib/types';
import type { SnowSegment } from '@/lib/snowshoe';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouteStore } from '@/store/route-store';

const SNOW_CONDITIONS: SnowCondition[] = ['boots', 'snowshoes', 'crampons', 'mountaineering'];

const SNOW_CONDITION_COLORS: Record<SnowCondition, string> = {
  none: 'bg-muted-foreground/20',
  boots: 'bg-sky-400',
  snowshoes: 'bg-blue-500',
  crampons: 'bg-indigo-600',
  mountaineering: 'bg-red-600',
};

const SNOW_CARD_BORDER: Record<SnowCondition, string> = {
  none: '',
  boots: 'border-sky-400/30',
  snowshoes: 'border-blue-500/40',
  crampons: 'border-indigo-600/40',
  mountaineering: 'border-red-600/50',
};

const SNOW_CARD_BG: Record<SnowCondition, string> = {
  none: '',
  boots: 'bg-sky-400/5',
  snowshoes: 'bg-blue-500/5',
  crampons: 'bg-indigo-600/5',
  mountaineering: 'bg-red-600/8',
};

const SNOW_BADGE_CLASS: Record<SnowCondition, string> = {
  none: '',
  boots: 'bg-sky-400/15 text-sky-700 dark:text-sky-300',
  snowshoes: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  crampons: 'bg-indigo-600/15 text-indigo-700 dark:text-indigo-300',
  mountaineering: 'bg-red-600/15 text-red-700 dark:text-red-400',
};

interface SnowshoeCardProps {
  overallCondition: SnowCondition;
  segments: SnowSegment[];
  activityType: 'cycling' | 'walking';
  maxSnowDepthCm: number;
}

export function SnowshoeCard({
  overallCondition,
  segments,
  activityType,
  maxSnowDepthCm,
}: SnowshoeCardProps) {
  const t = useTranslations('Advice');
  const setSelectedRange = useRouteStore((s) => s.setSelectedRange);

  const equipmentKey = `snowEquip.${overallCondition}` as Parameters<typeof t>[0];
  const adviceKey =
    `snow.${overallCondition}${activityType === 'cycling' ? 'Cycling' : 'Walking'}` as Parameters<
      typeof t
    >[0];

  return (
    <Card
      className={cn(
        'overflow-hidden border',
        SNOW_CARD_BORDER[overallCondition],
        SNOW_CARD_BG[overallCondition],
      )}
    >
      <CardContent className="flex gap-4 p-4">
        {/* Severity ladder */}
        <div className="mt-0.5 flex flex-shrink-0 flex-col items-center gap-1">
          {SNOW_CONDITIONS.map((level) => (
            <div
              key={level}
              className={cn(
                'h-3 w-3 rounded-full transition-opacity',
                level === overallCondition
                  ? SNOW_CONDITION_COLORS[level]
                  : 'bg-muted-foreground/20',
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Snowflake className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              {t('snowTitle')}
            </span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                SNOW_BADGE_CLASS[overallCondition],
              )}
            >
              {t(equipmentKey)}
            </span>
            <span className="text-muted-foreground font-mono text-[10px]">
              {t('snowDepthLabel')}: {maxSnowDepthCm} cm
            </span>
          </div>

          <p className="text-foreground text-sm leading-relaxed">{t(adviceKey)}</p>

          {segments.length > 0 && (
            <ul className="mt-0.5 flex flex-col gap-1">
              {segments.map((seg, i) => (
                <li
                  key={i}
                  className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs"
                >
                  <span
                    className={cn(
                      'inline-block h-2 w-2 flex-shrink-0 rounded-full',
                      SNOW_CONDITION_COLORS[seg.condition],
                    )}
                  />
                  <span className="font-mono">
                    {t(`snowEquip.${seg.condition}` as Parameters<typeof t>[0])}
                  </span>
                  <span>·</span>
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
