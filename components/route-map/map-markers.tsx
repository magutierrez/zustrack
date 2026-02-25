'use client';

import { Marker } from 'react-map-gl/maplibre';
import { WindArrow } from '@/components/wind-arrow';
import { MapPin, Droplets, Signpost, Moon, House } from 'lucide-react';
import type { RoutePoint, RouteWeatherPoint } from '@/lib/types';
import type { ActiveFilter } from '@/store/route-store';
import { useTranslations } from 'next-intl';

interface MapMarkersProps {
  points: RoutePoint[];
  weatherPoints?: RouteWeatherPoint[];
  selectedPointIndex: number | null;
  fullSelectedPointIndex?: number | null;
  exactSelectedPoint?: any | null;
  activeFilter?: ActiveFilter;
  onPointSelect?: (index: number) => void;
  onHoverPoint: (index: number | null) => void;
  activityType?: 'cycling' | 'walking';
  showWaterSources?: boolean;
  showEscapePoints?: boolean;
  focusPoint?: { lat: number; lon: number; name?: string; silent?: boolean } | null;
  nightPointIndex?: number | null;
}

export function MapMarkers({
  points,
  weatherPoints,
  selectedPointIndex,
  fullSelectedPointIndex = null,
  exactSelectedPoint = null,
  activeFilter,
  onPointSelect,
  onHoverPoint,
  activityType,
  showWaterSources,
  showEscapePoints,
  focusPoint,
  nightPointIndex = null,
}: MapMarkersProps) {
  const t = useTranslations('WeatherTimeline');
  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  const currentTrackPoint =
    exactSelectedPoint || (fullSelectedPointIndex !== null ? points[fullSelectedPointIndex] : null);

  // Unique escape points (deduplicated by name, shown when toggled on)
  const escapePoints = showEscapePoints
    ? Array.from(new Set(weatherPoints?.map((wp) => wp.escapePoint?.name).filter(Boolean))).map(
        (name) => weatherPoints?.find((wp) => wp.escapePoint?.name === name)?.escapePoint,
      )
    : [];

  // Unique water sources
  const waterSources =
    showWaterSources && weatherPoints
      ? Array.from(
          new Map(
            weatherPoints
              .flatMap((wp) => wp.waterSources || [])
              .map((ws) => [`${ws.lat},${ws.lon}`, ws]),
          ).values(),
        )
      : [];

  return (
    <>
      {/* Water Sources */}
      {waterSources.map((ws, i) => (
        <Marker key={`water-${i}`} longitude={ws.lon} latitude={ws.lat} anchor="bottom">
          <div className="group flex flex-col items-center">
            <div className="border-border bg-card invisible absolute -top-8 z-50 rounded-lg border px-2 py-1 text-[9px] font-bold whitespace-nowrap shadow-sm group-hover:visible">
              {ws.name} ({t(`reliability.${ws.reliability}` as any)})
            </div>
            <div
              className={`rounded-full border-2 border-white p-1 shadow-md ${
                ws.reliability === 'high'
                  ? 'bg-emerald-500'
                  : ws.reliability === 'medium'
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
            >
              <Droplets className="h-3 w-3 fill-white/20 text-white" />
            </div>
          </div>
        </Marker>
      ))}

      {/* Escape Points */}
      {escapePoints.map(
        (ep, i) =>
          ep && (
            <Marker key={`escape-${i}`} longitude={ep.lon} latitude={ep.lat} anchor="bottom">
              <div className="flex flex-col items-center">
                <div className="border-border bg-card rounded-lg border px-2 py-1 text-[9px] font-bold whitespace-nowrap shadow-sm">
                  {ep.name}
                </div>
                {ep.type === 'shelter' ? (
                  <div className="rounded-full border-2 border-white bg-amber-500 p-1 shadow-md">
                    <House className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <MapPin className="h-5 w-5 fill-indigo-500/20 text-indigo-500" />
                )}
              </div>
            </Marker>
          ),
      )}

      {startPoint && (
        <Marker
          longitude={startPoint.lon}
          latitude={startPoint.lat}
          anchor="bottom"
          offset={[0, -5]}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-600 font-bold text-white shadow-lg transition-transform hover:scale-110">
            A
          </div>
        </Marker>
      )}
      {endPoint && endPoint !== startPoint && (
        <Marker longitude={endPoint.lon} latitude={endPoint.lat} anchor="bottom" offset={[0, -5]}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-600 font-bold text-white shadow-lg transition-transform hover:scale-110">
            B
          </div>
        </Marker>
      )}

      {/* Dynamic Cursor Point (Komoot style) */}
      {currentTrackPoint && (
        <Marker
          longitude={currentTrackPoint.lon}
          latitude={currentTrackPoint.lat}
          anchor="center"
          z-index={100}
        >
          <div className="h-4 w-4 rounded-full border-2 border-blue-500 bg-white shadow-md" />
        </Marker>
      )}

      {weatherPoints?.map((wp, idx) => {
        const isSelected = selectedPointIndex === idx;
        const isFiltered =
          activeFilter &&
          activeFilter.key !== 'hazard' &&
          (wp[activeFilter.key] || 'unknown') !== activeFilter.value;

        if (isFiltered && !isSelected) return null;

        return (
          <Marker
            key={idx}
            longitude={wp.point.lon}
            latitude={wp.point.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onPointSelect?.(idx);
            }}
          >
            <button
              className={`group relative flex items-center justify-center transition-all hover:scale-125 ${isSelected ? 'z-10 scale-125' : 'z-0'}`}
            >
              <WindArrow
                direction={wp.weather.windDirection}
                travelBearing={wp.bearing}
                effect={wp.windEffect}
                size={isSelected ? 36 : 28}
              />
              {isSelected && (
                <div className="absolute inset-0 animate-pulse rounded-full border-2 border-white/50" />
              )}
            </button>
          </Marker>
        );
      })}
      {/* Night Trap Marker */}
      {nightPointIndex !== null &&
        weatherPoints?.[nightPointIndex] &&
        (() => {
          const np = weatherPoints[nightPointIndex];
          const nightTime = new Date(np.weather.time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <Marker
              longitude={np.point.lon}
              latitude={np.point.lat}
              anchor="bottom"
              style={{ zIndex: 150 }}
            >
              <div
                className="animate-in fade-in slide-in-from-bottom-1 flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="rounded-lg bg-slate-900/95 px-2 py-1 text-[10px] font-bold whitespace-nowrap text-indigo-200 shadow-xl ring-1 ring-indigo-500/50">
                  🌙 {nightTime} · km {np.point.distanceFromStart.toFixed(1)}
                </div>
                <div className="relative mt-0.5">
                  <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500 opacity-30" />
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-400/60 bg-slate-900 shadow-lg">
                    <Moon className="h-4 w-4 text-indigo-300" />
                  </div>
                </div>
                <div className="h-2 w-1 rounded-full bg-slate-700" />
              </div>
            </Marker>
          );
        })()}

      {/* Focus Point (Highlighted Evacuation) — hidden when silent (e.g. night trap nav) */}
      {focusPoint && !focusPoint.silent && (
        <Marker longitude={focusPoint.lon} latitude={focusPoint.lat} anchor="bottom" z-index={200}>
          <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center">
            <div className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-black tracking-wider text-white uppercase shadow-xl ring-2 ring-white">
              {focusPoint.name || 'Evacuación'}
            </div>
            <div className="relative mt-1">
              <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500 opacity-40" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-indigo-600 shadow-2xl">
                <Signpost className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="h-3 w-1.5 rounded-full bg-indigo-600" />
          </div>
        </Marker>
      )}
    </>
  );
}
