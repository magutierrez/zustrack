'use client';

import { useTranslations } from 'next-intl';
import {
  Wind,
  CloudRain,
  ThermometerSun,
  ThermometerSnowflake,
  Moon,
  ShieldCheck,
  Zap,
  Droplets,
  Eye,
  EyeOff,
  Info,
  Signal,
  LifeBuoy,
} from 'lucide-react';
import type { RouteWeatherPoint } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRouteStore } from '@/store/route-store';
import { useAdviceMetrics } from '@/hooks/use-advice-metrics';
import { ViabilityCard } from '@/components/route-advice/viability-card';
import { MudRiskCard } from '@/components/route-advice/mud-risk-card';
import { SnowshoeCard } from '@/components/route-advice/snowshoe-card';

interface RouteAdviceProps {
  weatherPoints: RouteWeatherPoint[];
  activityType: 'cycling' | 'walking';
  showWaterSources?: boolean;
  onToggleWaterSources?: () => void;
  showNoCoverageZones?: boolean;
  onToggleNoCoverageZones?: () => void;
  showEscapePoints?: boolean;
  onToggleEscapePoints?: () => void;
}

export function RouteAdvice({
  weatherPoints,
  activityType,
  showWaterSources,
  onToggleWaterSources,
  showNoCoverageZones,
  onToggleNoCoverageZones,
  showEscapePoints,
  onToggleEscapePoints,
}: RouteAdviceProps) {
  const t = useTranslations('Advice');
  const tp = useTranslations('physiology');
  const typeKey = activityType === 'cycling' ? 'cycling' : 'hiking';

  const setIsMobileFullscreen = useRouteStore((s) => s.setIsMobileFullscreen);
  const setMobileHazardRange = useRouteStore((s) => s.setMobileHazardRange);
  const requestMapReset = useRouteStore((s) => s.requestMapReset);

  // Hooks must be called before early return to satisfy rules-of-hooks
  const { viability, physiologyNeeds, mudMetrics, snowMetrics, uniqueEscapePoints } =
    useAdviceMetrics(weatherPoints, activityType);

  // On mobile: show the map fullscreen and reset to full route view
  const showOnMapMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileHazardRange(null);
      setIsMobileFullscreen(true);
      requestMapReset();
    }
  };

  if (weatherPoints.length === 0 || !viability || !physiologyNeeds) return null;

  const { durationHours, needs } = physiologyNeeds;
  const { mudSegments, overallMudRisk, hasMudData, mudInputs } = mudMetrics;
  const { snowSegments, overallSnowCondition, hasSnow, maxSnowDepthCm } = snowMetrics;

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
      icon: <Droplets className="h-5 w-5 text-cyan-500" />,
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
            {showWaterSources ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
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
            'h-5 w-5',
            uniqueEscapePoints.length > 0 ? 'text-indigo-500' : 'text-muted-foreground',
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
                  <Info className="h-3.5 w-3.5" />
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
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white'
                  : 'bg-card border-border hover:bg-muted',
              )}
            >
              {showEscapePoints ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
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
            'h-5 w-5',
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
            {showNoCoverageZones ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
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
      icon: <CloudRain className="h-5 w-5 text-blue-500" />,
      text: t(`${typeKey}.rain`),
      category: t('weather'),
    },
    {
      condition: hasStrongWind,
      icon: <Wind className="h-5 w-5 text-slate-500" />,
      text: t(`${typeKey}.wind`),
      category: t('weather'),
    },
    {
      condition: hasHeat,
      icon: <ThermometerSun className="h-5 w-5 text-orange-500" />,
      text: t(`${typeKey}.heat`),
      category: t('nutrition'),
    },
    {
      condition: hasCold,
      icon: <ThermometerSnowflake className="h-5 w-5 text-cyan-500" />,
      text: t(`${typeKey}.cold`),
      category: t('gear'),
    },
    {
      condition: hasNight,
      icon: <Moon className="h-5 w-5 text-indigo-500" />,
      text: t(`${typeKey}.night`),
      category: t('safety'),
    },
    {
      condition: true,
      icon: <ShieldCheck className="text-primary h-5 w-5" />,
      text: t(`${typeKey}.general`),
      category: t('safety'),
    },
  ].filter((a) => a.condition);

  return (
    <div className="flex flex-col gap-6">
      {/* Viability Score */}
      <ViabilityCard viability={viability} />

      {/* Physiology Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-primary/10 rounded-full p-2">
              <Zap className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                {tp('calories')} ({tp('total')})
              </p>
              <p className="text-foreground font-mono text-xl font-bold">
                {needs.calories}{' '}
                <span className="text-muted-foreground text-xs font-normal">kcal</span>
              </p>
              <p className="text-muted-foreground text-[10px]">
                ~{Math.round(needs.calories / durationHours)} kcal {tp('perHour')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-primary/10 rounded-full p-2">
              <Droplets className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                {tp('hydration')} ({tp('total')})
              </p>
              <p className="text-foreground font-mono text-xl font-bold">
                {needs.waterLiters}{' '}
                <span className="text-muted-foreground text-xs font-normal">L</span>
              </p>
              <p className="text-muted-foreground text-[10px]">
                ~{Math.round((needs.waterLiters * 1000) / durationHours)} ml {tp('perHour')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-3',
          hasSnow && hasMudData && mudInputs && 'sm:grid-cols-2',
        )}
      >
        {/* Snow / Snowshoe Card — only rendered when there is meaningful snow */}
        {hasSnow && (
          <SnowshoeCard
            overallCondition={overallSnowCondition}
            segments={snowSegments}
            activityType={activityType}
            maxSnowDepthCm={maxSnowDepthCm}
          />
        )}

        {/* Mud Risk Card */}
        {hasMudData && mudInputs && (
          <MudRiskCard
            overallRisk={overallMudRisk}
            segments={mudSegments}
            activityType={activityType}
            inputs={mudInputs}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {advices.map((advice, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="flex gap-4 p-4">
              <div className="mt-1 flex-shrink-0">{advice.icon}</div>
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
    </div>
  );
}
