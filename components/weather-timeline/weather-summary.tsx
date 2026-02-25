'use client';

import {
  Wind,
  Thermometer,
  Droplets,
  Sun,
  Clock,
  AlertTriangle,
  Snowflake,
  Moon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RouteWeatherPoint } from '@/lib/types';
import { formatTemperature, formatWindSpeed } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettings } from '@/hooks/use-settings';
import { useWeatherSummary } from '@/hooks/use-weather-summary';
import { useRouteStore } from '@/store/route-store';

interface WeatherSummaryProps {
  weatherPoints: RouteWeatherPoint[];
}

export function WeatherSummary({ weatherPoints }: WeatherSummaryProps) {
  const t = useTranslations('WeatherTimeline');
  const { unitSystem, windUnit } = useSettings();
  const setFocusPoint = useRouteStore((s) => s.setFocusPoint);

  const {
    avgTemp,
    maxWind,
    maxGusts,
    avgPrecipProb,
    tailwindPct,
    headwindPct,
    intensePoints,
    shadePoints,
    total,
    arrivesAtNight,
    lastTime,
    avgSnowDepthCm,
    hasSnow,
    nightPoint,
    isValleyAdjusted,
  } = useWeatherSummary(weatherPoints);

  if (weatherPoints.length === 0) return null;

  const getPercent = (count: number) => ((count / total) * 100).toFixed(0);

  const nightTime = nightPoint ? new Date(nightPoint.weather.time) : null;

  const handleGoToNightPoint = () => {
    if (!nightPoint) return;
    setFocusPoint({
      lat: nightPoint.point.lat,
      lon: nightPoint.point.lon,
      silent: true,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          <span className="text-xs">{t('summary.avgTemp')}</span>
        </div>
        <p className="text-foreground mt-1 font-mono text-xl font-bold">
          {formatTemperature(avgTemp, unitSystem)}
        </p>
      </div>

      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <span className="text-xs">{t('summary.solarTitle')}</span>
        </div>
        <div className="bg-secondary mt-2 flex h-2 w-full overflow-hidden rounded-full">
          <TooltipProvider delayDuration={100}>
            {weatherPoints.map((wp, i) => {
              const colors: Record<string, string> = {
                intense: 'bg-red-600',
                moderate: 'bg-orange-400',
                weak: 'bg-yellow-200',
                shade: 'bg-slate-500',
                night: 'bg-slate-900',
              };
              const intensityLabel =
                wp.solarIntensity === 'night'
                  ? t('solarExposure.night')
                  : t(`solarIntensity.${wp.solarIntensity}` as any);

              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div
                      className={`${colors[wp.solarIntensity || 'shade']} cursor-help transition-opacity hover:opacity-80`}
                      style={{ width: `${100 / total}%` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="px-2 py-1 text-[10px]">
                    <p className="font-bold">{intensityLabel}</p>
                    <p className="text-muted-foreground">
                      km {wp.point.distanceFromStart.toFixed(1)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
          {intensePoints > 0 && (
            <span className="text-[9px] font-bold text-red-600">
              {t('summary.maxSolarLabel', { percent: getPercent(intensePoints) })}
            </span>
          )}
          {shadePoints > 0 && (
            <span className="text-[9px] font-bold text-slate-500">
              {t('summary.shadeLabel', { percent: getPercent(shadePoints) })}
            </span>
          )}
        </div>
      </div>

      {/* Daylight / Night Trap card */}
      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-xs">{t('summary.daylight')}</span>
        </div>

        {arrivesAtNight ? (
          <div className="mt-1 space-y-1.5">
            <div className="text-destructive flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-xs font-bold tracking-tighter uppercase">
                {t('summary.nightArrival')}
              </span>
            </div>
            {nightPoint && (
              <NightTrapButton
                km={nightPoint.point.distanceFromStart}
                time={nightTime!}
                isValleyAdjusted={isValleyAdjusted}
                label={t('summary.nightPointBtn')}
                valleyLabel={t('summary.valleyAdjusted')}
                onClick={handleGoToNightPoint}
              />
            )}
          </div>
        ) : nightPoint ? (
          <div className="mt-1 space-y-1">
            <p className="text-foreground font-mono text-xl font-bold">
              {lastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <NightTrapButton
              km={nightPoint.point.distanceFromStart}
              time={nightTime!}
              isValleyAdjusted={isValleyAdjusted}
              label={t('summary.nightPointBtn')}
              valleyLabel={t('summary.valleyAdjusted')}
              onClick={handleGoToNightPoint}
            />
          </div>
        ) : (
          <p className="text-foreground mt-1 font-mono text-xl font-bold">
            {lastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Wind className="h-4 w-4" />
          <span className="text-xs">{t('summary.maxWind')}</span>
        </div>
        <p className="text-foreground mt-1 font-mono text-xl font-bold">
          {formatWindSpeed(maxWind, windUnit).split(' ')[0]}{' '}
          <span className="text-muted-foreground text-sm font-normal">
            {formatWindSpeed(maxWind, windUnit).split(' ')[1]}
          </span>
        </p>
        <p className="text-muted-foreground text-xs">
          {t('summary.gusts', { speed: formatWindSpeed(maxGusts, windUnit) })}
        </p>
      </div>
      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Droplets className="h-4 w-4" />
          <span className="text-xs">{t('summary.precipProb')}</span>
        </div>
        <p className="text-foreground mt-1 font-mono text-xl font-bold">
          {avgPrecipProb.toFixed(0)}%
        </p>
      </div>
      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Wind className="h-4 w-4" />
          <span className="text-xs">{t('summary.wind')}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-primary text-xs font-medium">
            {t('summary.favor', { percent: tailwindPct.toFixed(0) })}
          </span>
          <span className="text-muted-foreground text-xs">/</span>
          <span className="text-destructive text-xs font-medium">
            {t('summary.contra', { percent: headwindPct.toFixed(0) })}
          </span>
        </div>
      </div>
      {hasSnow && (
        <div className="border-border bg-card rounded-lg border p-3">
          <div className="text-muted-foreground flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-blue-400" />
            <span className="text-xs">{t('summary.snowTitle')}</span>
          </div>
          <p className="text-foreground mt-1 font-mono text-xl font-bold">
            {Math.round(avgSnowDepthCm)}{' '}
            <span className="text-muted-foreground text-sm font-normal">cm</span>
          </p>
        </div>
      )}
    </div>
  );
}

function NightTrapButton({
  km,
  time,
  isValleyAdjusted,
  label,
  valleyLabel,
  onClick,
}: {
  km: number;
  time: Date;
  isValleyAdjusted: boolean;
  label: string;
  valleyLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-1.5 rounded-md bg-slate-800/80 px-2 py-1.5 text-left transition-colors hover:bg-slate-700/80 dark:bg-slate-900/80 dark:hover:bg-slate-800/80"
    >
      <Moon className="h-3.5 w-3.5 shrink-0 text-indigo-300" />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] font-bold text-indigo-200">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {' · '}km {km.toFixed(1)}
        </p>
        {isValleyAdjusted && <p className="text-[9px] text-indigo-400/80">{valleyLabel}</p>}
      </div>
      <span className="shrink-0 text-[9px] font-medium text-indigo-300 underline underline-offset-2">
        {label}
      </span>
    </button>
  );
}
