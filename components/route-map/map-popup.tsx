'use client';

import { Popup } from 'react-map-gl/maplibre';
import { useTranslations } from 'next-intl';
import type { RouteWeatherPoint } from '@/lib/types';
import { WEATHER_CODES } from '@/lib/types';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Loader2,
  Map as MapIcon,
  MapPinned,
  Sun,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { WeatherIcon } from '@/components/weather-icon';

interface MapPopupProps {
  popupInfo: RouteWeatherPoint & { index: number; point: any; bearing?: number };
  onClose: () => void;
}

function getWindEffectIcon(effect: string) {
  switch (effect) {
    case 'tailwind':
      return <ArrowDown className="h-3 w-3 text-emerald-500" />;
    case 'headwind':
      return <ArrowUp className="h-3 w-3 text-red-500" />;
    case 'crosswind-left':
      return <ArrowLeft className="h-3 w-3 text-amber-500" />;
    case 'crosswind-right':
      return <ArrowRight className="h-3 w-3 text-amber-500" />;
    default:
      return null;
  }
}

export function MapPopup({ popupInfo, onClose }: MapPopupProps) {
  const [showStreetView, setShowStreetView] = useState(false);
  const [streetViewAvailable, setStreetViewAvailable] = useState<boolean | null>(null);
  const t = useTranslations('RouteMap');
  const tw = useTranslations('WeatherCodes');
  const tt = useTranslations('WeatherTimeline');

  const isWeatherPoint = popupInfo.index !== -1;

  useEffect(() => {
    const checkStreetView = async () => {
      try {
        // Optimistic check simulation
        setStreetViewAvailable(true);
      } catch (e) {
        setStreetViewAvailable(true);
      }
    };

    checkStreetView();
  }, [popupInfo.point]);

  if (showStreetView) {
    return (
      <div className="bg-background animate-in fade-in absolute inset-0 z-[100] flex flex-col duration-200">
        <div className="border-border bg-card flex items-center justify-between border-b px-4 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-bold tracking-wider uppercase"
              onClick={() => setShowStreetView(false)}
            >
              <MapIcon className="h-4 w-4" />
              {t('backToMap')}
            </Button>
            <div className="bg-border h-6 w-px" />
            <div className="text-muted-foreground flex items-center gap-4 text-xs font-medium tracking-wider uppercase">
              <span className="flex items-center gap-1">
                <span className="text-foreground font-bold">
                  {popupInfo.point.distanceFromStart.toFixed(1)}
                </span>{' '}
                km
              </span>
              <span className="flex items-center gap-1">
                <span className="text-foreground font-bold">
                  {Math.round(popupInfo.point.ele || 0)}
                </span>{' '}
                m
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive h-9 w-9 rounded-full transition-colors"
            onClick={() => {
              setShowStreetView(false);
              onClose();
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="bg-muted relative flex-1">
          <iframe
            src={`https://www.google.com/maps?layer=c&cbll=${popupInfo.point.lat},${popupInfo.point.lon}&cbp=12,${popupInfo.bearing || 0},0,0,0&output=svembed`}
            className="h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            title="Street View"
          />
        </div>
      </div>
    );
  }

  const hasTranslation = !!tw.raw(popupInfo.weather.weatherCode.toString());
  const weatherDescription = hasTranslation
    ? tw(popupInfo.weather.weatherCode.toString() as any)
    : WEATHER_CODES[popupInfo.weather.weatherCode]?.description || tt('unknownWeather');

  return (
    <Popup
      longitude={popupInfo.point.lon}
      latitude={popupInfo.point.lat}
      anchor="bottom"
      onClose={onClose}
      closeButton={false}
      maxWidth={isWeatherPoint ? '260px' : '220px'}
      className="weather-popup"
      offset={15}
    >
      <div className="group relative">
        <Button
          variant="ghost"
          size="icon"
          className="bg-background border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive absolute -top-3 -right-3 z-10 h-6 w-6 rounded-full border shadow-sm transition-all"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>

        <div className="text-foreground p-2 text-xs leading-relaxed">
          <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
            <div className="flex flex-col">
              <span className="text-muted-foreground font-mono text-[10px] font-bold tracking-wider uppercase">
                km {popupInfo.point.distanceFromStart.toFixed(1)}
              </span>
              {isWeatherPoint && (
                <span className="text-foreground font-mono text-[11px] font-bold">
                  {new Date(
                    popupInfo.point.estimatedTime || popupInfo.weather.time,
                  ).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
            {!isWeatherPoint && (
              <span className="font-mono text-sm font-bold">
                {Math.round(popupInfo.point.ele || 0)}m
              </span>
            )}
          </div>

          {isWeatherPoint && (
            <div className="bg-primary/5 mb-3 flex items-center gap-3 rounded-lg p-2">
              <WeatherIcon code={popupInfo.weather.weatherCode} className="h-8 w-8 shrink-0" />
              <div className="flex flex-col">
                <span className="leading-tight font-bold">{weatherDescription}</span>
                <span className="text-primary text-sm font-black">
                  {Math.round(popupInfo.weather.temperature)}°C
                </span>
              </div>
            </div>
          )}

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="bg-secondary/50 rounded p-2 text-center">
              <span className="text-muted-foreground block text-[9px] font-bold uppercase">
                {t('elevation')}
              </span>
              <span className="font-mono text-sm font-bold">
                {Math.round(popupInfo.point.ele || 0)}
                <span className="text-muted-foreground ml-0.5 text-[10px] font-normal">m</span>
              </span>
            </div>
            <div className="bg-secondary/50 rounded p-2 text-center">
              <span className="text-muted-foreground block text-[9px] font-bold uppercase">
                {t('slope')}
              </span>
              <div className="flex items-center justify-center gap-1">
                <ArrowUp
                  className="text-muted-foreground h-3 w-3"
                  style={{
                    transform: `rotate(${Math.min(90, Math.max(-90, (popupInfo.point.slope || 0) * 4))}deg)`,
                  }}
                />
                <span className="font-mono text-sm font-bold">
                  {Math.abs(Math.round(popupInfo.point.slope || 0))}
                  <span className="text-muted-foreground ml-0.5 text-[10px] font-normal">%</span>
                </span>
              </div>
            </div>

            {isWeatherPoint && (
              <>
                <div className="bg-secondary/50 rounded p-2 text-center">
                  <span className="text-muted-foreground block text-[9px] font-bold uppercase">
                    {tt('summary.wind')}
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    {getWindEffectIcon(popupInfo.windEffect)}
                    <span className="font-mono text-xs font-bold">
                      {Math.round(popupInfo.weather.windSpeed)}
                      <span className="text-muted-foreground ml-0.5 text-[9px] font-normal">
                        km/h
                      </span>
                    </span>
                  </div>
                </div>
                <div className="bg-secondary/50 rounded p-2 text-center">
                  <span className="text-muted-foreground block text-[9px] font-bold uppercase">
                    {tt('summary.solarTitle')}
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <Sun className="h-3 w-3 text-amber-500" />
                    <span className="font-mono text-[10px] font-bold tracking-tighter uppercase">
                      {tt(
                        `solarExposure.${popupInfo.solarIntensity === 'night' ? 'night' : popupInfo.solarIntensity === 'shade' ? 'shade' : 'sun'}` as any,
                      )}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <Button
            variant="default"
            size="sm"
            className="h-8 w-full gap-2 text-[10px] font-bold uppercase shadow-sm transition-all active:scale-[0.98]"
            onClick={() => setShowStreetView(true)}
            disabled={streetViewAvailable === false}
          >
            {streetViewAvailable === null ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MapPinned className="h-3.5 w-3.5" />
            )}
            {t('streetView')}
          </Button>
        </div>
      </div>
    </Popup>
  );
}
