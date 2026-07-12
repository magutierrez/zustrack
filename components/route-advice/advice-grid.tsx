'use client';

import { useTranslations } from 'next-intl';
import {
  Wind,
  CloudRain,
  ThermometerSun,
  ThermometerSnowflake,
  Moon,
  ShieldCheck,
  Droplets,
  Eye,
  EyeOff,
  Info,
  Signal,
  LifeBuoy,
} from 'lucide-react';
import type { RouteWeatherPoint, EscapePoint } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRouteStore } from '@/store/route-store';

interface AdviceGridProps {
  weatherPoints: RouteWeatherPoint[];
  activityType: 'cycling' | 'walking';
  uniqueEscapePoints: EscapePoint[];
  showWaterSources?: boolean;
  onToggleWaterSources?: () => void;
  showNoCoverageZones?: boolean;
  onToggleNoCoverageZones?: () => void;
  showEscapePoints?: boolean;
  onToggleEscapePoints?: () => void;
}

export function AdviceGrid({
  weatherPoints,
  activityType,
  uniqueEscapePoints,
  showWaterSources,
  onToggleWaterSources,
  showNoCoverageZones,
  onToggleNoCoverageZones,
  showEscapePoints,
  onToggleEscapePoints,
}: AdviceGridProps) {
  const t = useTranslations('Advice');
  const typeKey = activityType === 'cycling' ? 'cycling' : 'hiking';

  const setIsMobileFullscreen = useRouteStore((s) => s.setIsMobileFullscreen);
  const setMobileHazardRange = useRouteStore((s) => s.setMobileHazardRange);
  const requestMapReset = useRouteStore((s) => s.requestMapReset);

  // On mobile: show the map fullscreen and reset to full route view
  const showOnMapMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileHazardRange(null);
      setIsMobileFullscreen(true);
      requestMapReset();
    }
  };

  const hasRain = weatherPoints.some((wp) => wp.weather.precipitation > 0.5);
  const hasStrongWind = weatherPoints.some(
    (wp) => wp.weather.windSpeed > 30 || wp.weather.windGusts > 50,
  );
  const hasHeat = weatherPoints.some(
    (wp) => wp.weather.temperature > 28 || wp.solarIntensity === 'intense',
  );
  const hasCold = weatherPoints.some((wp) => wp.weather.temperature < 8);
  const hasNight = weatherPoints.some((wp) => wp.solarIntensity === 'night');

  const allWaterSources = weatherPoints.flatMap((wp) => wp.waterSources || []);
  const hasLowReliabilityWater = allWaterSources.some((ws) => ws.reliability === 'low');
  const hasWater = allWaterSources.length > 0;

  const hasCoverageData = weatherPoints.some(
    (wp) => wp.mobileCoverage && wp.mobileCoverage !== 'unknown',
  );
  const hasNoCoverageZones = weatherPoints.some(
    (wp) => wp.mobileCoverage === 'none' || wp.mobileCoverage === 'low',
  );

  const advices = [
    {
      condition: hasWater,
      icon: <Droplets className="size-5 text-cyan-500" />,
      text: (
        <div className="flex flex-col gap-3">
          <p>{hasLowReliabilityWater ? t('waterWarning') : t('waterOk')}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onToggleWaterSources?.();
              showOnMapMobile();
            }}
            className={cn(
              'h-7 w-fit gap-2 text-[10px] font-bold uppercase transition-all',
              showWaterSources
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white'
                : 'bg-card border-border hover:bg-muted',
            )}
          >
            {showWaterSources ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            {showWaterSources ? t('hideFromMap') : t('showOnMap')}
          </Button>
        </div>
      ),
      category: t('water'),
    },
    {
      condition: true,
      icon: (
        <LifeBuoy
          className={cn(
            'size-5',
            uniqueEscapePoints.length > 0 ? 'text-violet-500' : 'text-muted-foreground',
          )}
        />
      ),
      text: (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span>
              {uniqueEscapePoints.length > 0
                ? t('escapePointsFound', { count: uniqueEscapePoints.length })
                : t('escapePointsNone')}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
                  <Info className="size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-xs" side="top">
                <p className="font-semibold">{t('escapePointsTooltipTitle')}</p>
                <p className="text-muted-foreground mt-1">{t('escapePointsTooltipDesc')}</p>
                <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1">
                  <li>{t('escapePointsTooltipItem1')}</li>
                  <li>{t('escapePointsTooltipItem2')}</li>
                  <li>{t('escapePointsTooltipItem3')}</li>
                </ul>
              </PopoverContent>
            </Popover>
          </div>
          {uniqueEscapePoints.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onToggleEscapePoints?.();
                showOnMapMobile();
              }}
              className={cn(
                'h-7 w-fit gap-2 text-[10px] font-bold uppercase transition-all',
                showEscapePoints
                  ? 'bg-violet-500 text-white hover:bg-violet-600 hover:text-white'
                  : 'bg-card border-border hover:bg-muted',
              )}
            >
              {showEscapePoints ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              {showEscapePoints ? t('hideFromMap') : t('showOnMap')}
            </Button>
          )}
        </div>
      ),
      category: t('safety'),
    },
    {
      condition: true,
      icon: (
        <Signal
          className={cn(
            'size-5',
            !hasCoverageData
              ? 'text-muted-foreground'
              : hasNoCoverageZones
                ? 'text-amber-500'
                : 'text-emerald-500',
          )}
        />
      ),
      text: !hasCoverageData ? (
        <p className="text-muted-foreground">{t('coverageUnavailable')}</p>
      ) : hasNoCoverageZones ? (
        <div className="flex flex-col gap-3">
          <p>{t('coverageGaps')}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onToggleNoCoverageZones?.();
              showOnMapMobile();
            }}
            className={cn(
              'h-7 w-fit gap-2 text-[10px] font-bold uppercase transition-all',
              showNoCoverageZones
                ? 'bg-amber-500 text-white hover:bg-amber-600 hover:text-white'
                : 'bg-card border-border hover:bg-muted',
            )}
          >
            {showNoCoverageZones ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            {showNoCoverageZones ? t('hideFromMap') : t('showOnMap')}
          </Button>
        </div>
      ) : (
        <p>{t('coverageGood')}</p>
      ),
      category: t('coverage'),
    },
    {
      condition: hasRain,
      icon: <CloudRain className="size-5 text-blue-500" />,
      text: t(`${typeKey}.rain`),
      category: t('weather'),
    },
    {
      condition: hasStrongWind,
      icon: <Wind className="size-5 text-zinc-500" />,
      text: t(`${typeKey}.wind`),
      category: t('weather'),
    },
    {
      condition: hasHeat,
      icon: <ThermometerSun className="size-5 text-orange-500" />,
      text: t(`${typeKey}.heat`),
      category: t('nutrition'),
    },
    {
      condition: hasCold,
      icon: <ThermometerSnowflake className="size-5 text-cyan-500" />,
      text: t(`${typeKey}.cold`),
      category: t('gear'),
    },
    {
      condition: hasNight,
      icon: <Moon className="size-5 text-violet-500" />,
      text: t(`${typeKey}.night`),
      category: t('safety'),
    },
    {
      condition: true,
      icon: <ShieldCheck className="text-primary size-5" />,
      text: t(`${typeKey}.general`),
      category: t('safety'),
    },
  ].filter((a) => a.condition);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {advices.map((advice) => (
        <Card key={advice.category} className="overflow-hidden">
          <CardContent className="flex gap-4 p-4">
            <div className="mt-1 shrink-0">{advice.icon}</div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                {advice.category}
              </span>
              <div className="text-foreground text-sm leading-relaxed">{advice.text}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
