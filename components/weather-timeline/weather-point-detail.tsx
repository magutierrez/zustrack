'use client';

import {
  Thermometer,
  Droplets,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  Cloud,
  PhoneOff,
  Signpost,
  MapPin,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { WeatherIcon } from '@/components/weather-icon';
import { WindArrow } from '@/components/wind-arrow';
import { WEATHER_CODES } from '@/lib/types';
import type { RouteWeatherPoint } from '@/lib/types';
import { useSettings } from '@/hooks/use-settings';
import { formatTemperature, formatWindSpeed, formatDistance, formatElevation } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface WeatherPointDetailProps {
  weatherPoint: RouteWeatherPoint;
  activityType: 'cycling' | 'walking';
  onShowOnMap?: (lat: number, lon: number, name?: string) => void;
}

function getCoverageIconLabel(coverage: string | undefined, t: any) {
  switch (coverage) {
    case 'none':
      return (
        <div className="text-destructive flex items-center gap-1.5">
          <PhoneOff className="h-4 w-4" />
          <span className="text-xs font-bold">{t('safety.noCoverage')}</span>
        </div>
      );
    case 'low':
      return (
        <div className="flex items-center gap-1.5 text-orange-500">
          <PhoneOff className="h-4 w-4" />
          <span className="text-xs font-bold">{t('safety.lowCoverage')}</span>
        </div>
      );
    default:
      return null;
  }
}

function getSolarIcon(exposure: string) {
  switch (exposure) {
    case 'sun':
      return <Sun className="h-4 w-4 text-amber-500" />;
    case 'shade':
      return <Cloud className="h-4 w-4 text-slate-400" />;
    case 'night':
      return <Moon className="h-4 w-4 text-indigo-400" />;
    default:
      return null;
  }
}

function getSolarIntensityColor(intensity: string) {
  switch (intensity) {
    case 'night':
      return 'text-slate-900 dark:text-slate-400';
    case 'shade':
      return 'text-slate-500';
    case 'weak':
      return 'text-yellow-600';
    case 'moderate':
      return 'text-orange-500';
    case 'intense':
      return 'text-red-600';
    default:
      return 'text-foreground';
  }
}

function getWindEffectIcon(effect: string) {
  switch (effect) {
    case 'tailwind':
      return <ArrowDown className="h-3.5 w-3.5 text-emerald-500" />;
    case 'headwind':
      return <ArrowUp className="h-3.5 w-3.5 text-red-500" />;
    case 'crosswind-left':
      return <ArrowLeft className="h-3.5 w-3.5 text-amber-500" />;
    case 'crosswind-right':
      return <ArrowRight className="h-3.5 w-3.5 text-amber-500" />;
    default:
      return null;
  }
}

export function WeatherPointDetail({
  weatherPoint,
  activityType,
  onShowOnMap,
}: WeatherPointDetailProps) {
  const t = useTranslations('WeatherTimeline');
  const tw = useTranslations('WeatherCodes');
  const { unitSystem, windUnit } = useSettings();
  const time = weatherPoint.point.estimatedTime
    ? new Date(weatherPoint.point.estimatedTime)
    : new Date(weatherPoint.weather.time);
  const locale = 'es-ES';
  const timeStr = time.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = time.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const hasTranslation = !!tw.raw(weatherPoint.weather.weatherCode.toString());
  const weatherDescription = hasTranslation
    ? tw(weatherPoint.weather.weatherCode.toString() as any)
    : WEATHER_CODES[weatherPoint.weather.weatherCode]?.description || t('unknownWeather');

  const windEffectLabel = t(`windEffect.${weatherPoint.windEffect}` as any).toLowerCase();

  return (
    <div className="border-primary/20 bg-card rounded-lg border p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{dateStr}</p>
          <p className="text-foreground font-mono text-2xl font-bold">{timeStr}</p>
          <p className="text-muted-foreground text-xs">
            {formatDistance(weatherPoint.point.distanceFromStart, unitSystem)}
          </p>
          {weatherPoint.point.ele !== undefined && (
            <p className="text-muted-foreground text-xs">
              {t('detail.altitude', { ele: formatElevation(weatherPoint.point.ele, unitSystem) })}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <WeatherIcon code={weatherPoint.weather.weatherCode} className="h-10 w-10" />
          <span className="text-muted-foreground text-center text-xs">{weatherDescription}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {/* Temperature */}
        <div className="bg-secondary flex items-center gap-2 rounded-lg p-2.5">
          <Thermometer className="text-destructive h-4 w-4 shrink-0" />
          <div>
            <p className="text-muted-foreground text-xs">{t('detail.temperature')}</p>
            <p className="text-foreground font-mono text-sm font-bold">
              {formatTemperature(weatherPoint.weather.temperature, unitSystem)}
            </p>
            <p className="text-muted-foreground text-[10px]">
              {t('detail.feelsLike', {
                temp: formatTemperature(weatherPoint.weather.apparentTemperature, unitSystem),
              })}
            </p>
          </div>
        </div>

        {/* Solar Exposure */}
        <div className="bg-secondary flex items-center gap-2 rounded-lg p-2.5">
          {weatherPoint.solarExposure && getSolarIcon(weatherPoint.solarExposure)}
          <div>
            <p className="text-muted-foreground text-xs">{t('summary.solarTitle')}</p>
            <p
              className={`font-mono text-sm font-bold capitalize ${weatherPoint.solarIntensity ? getSolarIntensityColor(weatherPoint.solarIntensity) : ''}`}
            >
              {weatherPoint.solarIntensity
                ? weatherPoint.solarIntensity === 'night'
                  ? t('solarExposure.night')
                  : t(`solarIntensity.${weatherPoint.solarIntensity}` as any)
                : '-'}
            </p>
            <p className="text-muted-foreground text-[10px]">
              {weatherPoint.weather.directRadiation !== undefined
                ? `${Math.round(weatherPoint.weather.directRadiation)} W/m²`
                : '-'}
            </p>
          </div>
        </div>

        {/* Wind */}
        <div className="bg-secondary flex items-center gap-2 rounded-lg p-2.5">
          <WindArrow
            direction={weatherPoint.weather.windDirection}
            travelBearing={weatherPoint.bearing}
            effect={weatherPoint.windEffect}
            size={36}
          />
          <div>
            <p className="text-muted-foreground text-xs">{t('detail.wind')}</p>
            <p className="text-foreground font-mono text-sm font-bold">
              {formatWindSpeed(weatherPoint.weather.windSpeed, windUnit)}
            </p>
            <p className="text-muted-foreground text-[10px]">
              {t('detail.gusts', {
                speed: formatWindSpeed(weatherPoint.weather.windGusts, windUnit),
              })}
            </p>
          </div>
        </div>

        {/* Precipitation */}
        <div className="bg-secondary flex items-center gap-2 rounded-lg p-2.5">
          <Droplets className="text-chart-2 h-4 w-4 shrink-0" />
          <div>
            <p className="text-muted-foreground text-xs">{t('detail.rain')}</p>
            <p className="text-foreground font-mono text-sm font-bold">
              {weatherPoint.weather.precipitation}mm
            </p>
            <p className="text-muted-foreground text-[10px]">
              {t('detail.prob', { percent: weatherPoint.weather.precipitationProbability })}
            </p>
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-secondary flex items-center gap-2 rounded-lg p-2.5">
          <Eye className="text-muted-foreground h-4 w-4 shrink-0" />
          <div>
            <p className="text-muted-foreground text-xs">{t('detail.visibility')}</p>
            <p className="text-foreground font-mono text-sm font-bold">
              {(weatherPoint.weather.visibility / 1000).toFixed(1)} km
            </p>
            <p className="text-muted-foreground text-[10px]">
              {t('detail.clouds', { percent: weatherPoint.weather.cloudCover })}
            </p>
          </div>
        </div>
      </div>

      {/* Safety & Escape info */}
      {(weatherPoint.escapePoint ||
        (weatherPoint.mobileCoverage && weatherPoint.mobileCoverage !== 'full')) && (
        <div className="mt-3 flex flex-wrap gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
          {weatherPoint.escapePoint && (
            <div className="flex flex-1 items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Signpost className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <div>
                  <p className="text-foreground text-xs font-bold">{t('safety.evacuation')}</p>
                  <p className="text-muted-foreground text-[11px]">
                    {t('safety.escapeDesc', { dist: weatherPoint.escapePoint.distanceFromRoute })}:
                    <span className="ml-1 font-semibold text-indigo-600 dark:text-indigo-400">
                      {weatherPoint.escapePoint.name}
                    </span>
                  </p>
                </div>
              </div>
              {onShowOnMap && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[10px] font-bold text-indigo-600 uppercase hover:bg-indigo-500/10 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  onClick={() =>
                    onShowOnMap(
                      weatherPoint.escapePoint!.lat,
                      weatherPoint.escapePoint!.lon,
                      weatherPoint.escapePoint!.name,
                    )
                  }
                >
                  <MapPin className="h-3 w-3" />
                  {t('safety.viewOnMap')}
                </Button>
              )}
            </div>
          )}
          {weatherPoint.mobileCoverage && weatherPoint.mobileCoverage !== 'full' && (
            <div className="flex shrink-0 items-center border-l border-indigo-500/20 pl-3">
              {getCoverageIconLabel(weatherPoint.mobileCoverage, t)}
            </div>
          )}
        </div>
      )}

      {/* Wind effect summary */}
      <div className="border-border mt-3 flex items-center gap-3 rounded-lg border p-3">
        {getWindEffectIcon(weatherPoint.windEffect)}
        <div className="flex-1">
          <p className="text-foreground text-sm font-medium">
            {t('windEffect.summary', { label: windEffectLabel })}
          </p>
          <p className="text-muted-foreground text-xs">
            {t('windEffect.relativeAngle', { angle: weatherPoint.windEffectAngle.toFixed(0) })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-xs">{t('windEffect.bearing')}</p>
          <p className="text-foreground font-mono text-sm font-bold">
            {weatherPoint.bearing.toFixed(0)}°
          </p>
        </div>
      </div>
    </div>
  );
}
