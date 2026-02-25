'use client';

import { useMemo } from 'react';
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
  Footprints,
  Info,
  CloudHail,
  Layers,
  Thermometer,
  MountainSnow,
  Snowflake,
  Signal,
  LifeBuoy,
} from 'lucide-react';
import type { RouteWeatherPoint, MudRiskLevel, SnowCondition, ViabilityThreat, ViabilityResult } from '@/lib/types';
import { getMudRiskSegments } from '@/lib/mud-risk';
import { getSnowSegments, getOverallSnowCondition } from '@/lib/snowshoe';
import { computeViabilityScore } from '@/lib/viability-score';
import { Card, CardContent } from '@/components/ui/card';
import { calculatePhysiologicalNeeds, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

  if (weatherPoints.length === 0) return null;

  // Viability Score (memoised — pure computation from weatherPoints)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const viability = useMemo(() => computeViabilityScore(weatherPoints), [weatherPoints]);

  // Analysis
  const firstPoint = weatherPoints[0];
  const lastPoint = weatherPoints[weatherPoints.length - 1];
  const durationHours =
    (new Date(lastPoint.weather.time).getTime() - new Date(firstPoint.weather.time).getTime()) /
    3600000;
  const distance = lastPoint.point.distanceFromStart;
  const elevationGain = weatherPoints.reduce((acc, curr, i) => {
    if (i === 0) return 0;
    const diff = (curr.point.ele || 0) - (weatherPoints[i - 1].point.ele || 0);
    return acc + Math.max(0, diff);
  }, 0);
  const avgTemp =
    weatherPoints.reduce((acc, curr) => acc + curr.weather.temperature, 0) / weatherPoints.length;

  const needs = calculatePhysiologicalNeeds(
    durationHours,
    distance,
    elevationGain,
    avgTemp,
    activityType,
  );

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

  // Mud risk analysis
  const mudPoints = weatherPoints.map((wp) => ({
    distanceFromStart: wp.point.distanceFromStart,
    mudRisk: wp.mudRisk ?? 'none',
  }));
  const mudSegments = getMudRiskSegments(mudPoints);
  const overallMudRisk: MudRiskLevel = mudSegments.reduce<MudRiskLevel>((worst, s) => {
    const order: MudRiskLevel[] = ['none', 'low', 'medium', 'high'];
    return order.indexOf(s.level) > order.indexOf(worst) ? s.level : worst;
  }, 'none');
  // Show mud card if there's any precipitation data available (past72hPrecipMm defined on at least one point)
  const hasMudData = weatherPoints.some((wp) => wp.weather.past72hPrecipMm !== undefined);

  // Summary inputs for the mud info popover
  const mudInputs = hasMudData
    ? (() => {
        const withData = weatherPoints.filter((wp) => wp.weather.past72hPrecipMm !== undefined);
        const avgPrecip =
          Math.round(
            (withData.reduce((s, wp) => s + (wp.weather.past72hPrecipMm ?? 0), 0) /
              withData.length) *
              10,
          ) / 10;
        const surfaceCounts: Record<string, number> = {};
        weatherPoints.forEach((wp) => {
          if (wp.surface) surfaceCounts[wp.surface] = (surfaceCounts[wp.surface] ?? 0) + 1;
        });
        const dominantSurface = Object.entries(surfaceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const avgTemp =
          Math.round(
            (weatherPoints.reduce((s, wp) => s + wp.weather.temperature, 0) /
              weatherPoints.length) *
              10,
          ) / 10;
        const avgWind =
          Math.round(
            (weatherPoints.reduce((s, wp) => s + wp.weather.windSpeed, 0) / weatherPoints.length) *
              10,
          ) / 10;
        const shadedPct = Math.round(
          (weatherPoints.filter((wp) => wp.solarExposure === 'shade').length /
            weatherPoints.length) *
            100,
        );
        return { avgPrecip, dominantSurface, avgTemp, avgWind, shadedPct };
      })()
    : null;

  // Snow / snowshoe analysis
  const snowPoints = weatherPoints.map((wp) => ({
    distanceFromStart: wp.point.distanceFromStart,
    snowCondition: wp.snowCondition ?? 'none',
  }));
  const snowSegments = getSnowSegments(snowPoints);
  const overallSnowCondition = getOverallSnowCondition(snowPoints.map((p) => p.snowCondition));
  const hasSnow = overallSnowCondition !== 'none';
  const maxSnowDepthCm = hasSnow
    ? Math.max(...weatherPoints.map((wp) => wp.weather.snowDepthCm ?? 0))
    : 0;

  // Escape points — unique by name, deduplicated
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const uniqueEscapePoints = useMemo(
    () =>
      Array.from(new Set(weatherPoints.map((wp) => wp.escapePoint?.name).filter(Boolean))).map(
        (name) => weatherPoints.find((wp) => wp.escapePoint?.name === name)!.escapePoint!,
      ),
    [weatherPoints],
  );

  // Coverage analysis
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
            onClick={onToggleWaterSources}
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
              onClick={onToggleEscapePoints}
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
            !hasCoverageData ? 'text-muted-foreground' : hasNoCoverageZones ? 'text-amber-500' : 'text-emerald-500',
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
            onClick={onToggleNoCoverageZones}
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
      condition: true, // General advice
      icon: <ShieldCheck className="text-primary h-5 w-5" />,
      text: t(`${typeKey}.general`),
      category: t('safety'),
    },
  ].filter((a) => a.condition);

  return (
    <div className="flex flex-col gap-6">
      {/* Viability Score */}
      <ViabilityCard viability={viability} t={t} />

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

// ─── Mud Risk Traffic-Light Card ─────────────────────────────────────────────

interface MudRiskInputs {
  avgPrecip: number;
  dominantSurface: string | undefined;
  avgTemp: number;
  avgWind: number;
  shadedPct: number;
}

interface MudRiskCardProps {
  overallRisk: MudRiskLevel;
  segments: import('@/lib/mud-risk').MudRiskSegment[];
  activityType: 'cycling' | 'walking';
  inputs: MudRiskInputs;
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

function MudRiskCard({ overallRisk, segments, activityType, inputs }: MudRiskCardProps) {
  const t = useTranslations('Advice');
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Snowshoe / Snow Equipment Card ─────────────────────────────────────────

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
  segments: import('@/lib/snowshoe').SnowSegment[];
  activityType: 'cycling' | 'walking';
  maxSnowDepthCm: number;
}

function SnowshoeCard({
  overallCondition,
  segments,
  activityType,
  maxSnowDepthCm,
}: SnowshoeCardProps) {
  const t = useTranslations('Advice');

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
                <li key={i} className="text-muted-foreground flex items-center gap-1.5 text-xs">
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Viability Score Card ─────────────────────────────────────────────────────

const SCORE_COLORS = {
  go: { ring: 'ring-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  caution: { ring: 'ring-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  danger: { ring: 'ring-red-500', text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
} as const;

const THREAT_ICONS: Record<ViabilityThreat['type'], React.ReactNode> = {
  wind: <Wind className="h-3.5 w-3.5" />,
  storm: <Zap className="h-3.5 w-3.5" />,
  temperature: <Thermometer className="h-3.5 w-3.5" />,
  visibility: <EyeOff className="h-3.5 w-3.5" />,
};

function ViabilityCard({
  viability,
  t,
}: {
  viability: ViabilityResult;
  t: ReturnType<typeof useTranslations<'Advice'>>;
}) {
  const { score, rating, threats } = viability;
  const colors = SCORE_COLORS[rating];

  const formatThreat = (threat: ViabilityThreat): string => {
    const km = threat.km.toFixed(1);
    switch (threat.type) {
      case 'wind':
        return t('viabilityThreatWind', { value: threat.value, km });
      case 'storm':
        return t('viabilityThreatStorm', { km });
      case 'temperature':
        return t('viabilityThreatTemp', { value: threat.value, km });
      case 'visibility':
        return t('viabilityThreatVisibility', { value: threat.value, km });
    }
  };

  const terrainLabel = (tf: number) => {
    if (tf <= 0.5) return t('viabilityTerrainProtected');
    if (tf >= 2.0) return t('viabilityTerrainExposed');
    return null;
  };

  return (
    <Card className={cn('overflow-hidden border', colors.border, colors.bg)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Score ring */}
          <div
            className={cn(
              'flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full ring-4',
              colors.ring,
            )}
          >
            <span className={cn('font-mono text-2xl font-black leading-none', colors.text)}>
              {score}
            </span>
            <span className="text-muted-foreground text-[8px] font-bold tracking-widest uppercase">
              /100
            </span>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground mb-0.5 text-[9px] font-bold tracking-widest uppercase">
              {t('viabilityTitle')}
            </p>
            <p className={cn('text-sm font-black tracking-tight uppercase', colors.text)}>
              {t(`viabilityRating_${rating}` as Parameters<typeof t>[0])}
            </p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
              {rating === 'go'
                ? t('viabilityMsgGo')
                : rating === 'caution'
                  ? t('viabilityMsgCaution')
                  : t('viabilityMsgDanger')}
            </p>
          </div>
        </div>

        {/* Threat list */}
        {threats.length > 0 && rating !== 'go' && (
          <ul className="mt-3 space-y-1.5 border-t border-current/10 pt-3">
            {threats.map((threat, i) => {
              const terrain = terrainLabel(threat.terrainFactor);
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className={cn('shrink-0', colors.text)}>{THREAT_ICONS[threat.type]}</span>
                  <span className="text-foreground min-w-0 flex-1 text-[11px]">
                    {formatThreat(threat)}
                    {terrain && (
                      <span className="text-muted-foreground ml-1 text-[9px]">({terrain})</span>
                    )}
                  </span>
                  <span className={cn('shrink-0 font-mono text-[10px] font-bold', colors.text)}>
                    -{threat.deduction}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function MudInfoRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-muted-foreground text-[10px] font-bold uppercase">{label}</span>
          <span className="text-foreground font-mono text-[11px] font-semibold">{value}</span>
        </div>
        <p className="text-muted-foreground text-[10px] leading-relaxed">{detail}</p>
      </div>
    </li>
  );
}
