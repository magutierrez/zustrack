'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Maximize2, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TrailMapWrapper } from './trail-map-wrapper';
import { TrailElevationChart } from './trail-elevation-chart';
import type { Trail } from '@/lib/trails';

type Range = { start: number; end: number; color?: string };
type POIPoint = { lat: number; lng: number };

interface TrailMapSectionProps {
  trail: Trail;
  trackProfile: any[];
  locale: string;
  searchParams: string;
  mapExpanded: boolean;
  setMapExpanded: (v: boolean) => void;
  mapHeightPx: number | null;
  selectedRange: Range | null;
  setSelectedRange: (r: Range | null) => void;
  hoverDist: number | null;
  setHoverDist: (d: number | null) => void;
  focusPoint: POIPoint | null;
  setFocusPoint: (p: POIPoint | null) => void;
  activePOI: POIPoint | null;
}

export function TrailMapSection({
  trail,
  trackProfile,
  locale,
  searchParams,
  mapExpanded,
  setMapExpanded,
  mapHeightPx,
  selectedRange,
  setSelectedRange,
  hoverDist,
  setHoverDist,
  focusPoint,
  setFocusPoint,
  activePOI,
}: TrailMapSectionProps) {
  const t = useTranslations('TrailPage');

  return (
    <div
      className={cn(
        'relative order-1 h-[50vh] shrink-0 border-zinc-200 lg:order-2 lg:h-auto lg:flex-1 lg:border-l dark:border-zinc-800',
        mapExpanded && 'h-full flex-1',
      )}
      style={mapHeightPx !== null && !mapExpanded ? { height: mapHeightPx } : undefined}
    >
      {trackProfile.length > 0 ? (
        <TrailMapWrapper
          trackProfile={trackProfile}
          name={trail.name}
          isCircular={trail.is_circular}
          selectedRange={selectedRange}
          onReset={() => setSelectedRange(null)}
          hoverDist={hoverDist}
          onHoverDist={setHoverDist}
          escapePoints={trail.escape_points ?? undefined}
          waterSources={trail.water_sources ?? undefined}
          focusPoint={focusPoint}
          onFocusPointConsumed={() => setFocusPoint(null)}
          activePOI={activePOI}
          mapExpanded={mapExpanded}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-zinc-100 dark:bg-zinc-900">
          <span className="text-sm text-zinc-400">No map data available</span>
        </div>
      )}

      {/* Compact elevation chart — overlaid at bottom of map, mobile only, not fullscreen */}
      {trackProfile.length > 1 && !mapExpanded && (
        <div className="absolute inset-x-0 bottom-3 z-2 text-zinc-500 lg:hidden dark:text-zinc-300">
          <TrailElevationChart
            compact
            singleColor="currentColor"
            selectable={false}
            trackProfile={trackProfile}
            labels={{
              elevationProfile: t('elevationProfile'),
              slope: t('slope'),
              flat: t('flat'),
              gentle: t('gentle'),
              steep: t('steep'),
              extreme: t('extreme'),
              km: t('km'),
              meters: t('meters'),
              resetZoom: t('resetZoom'),
            }}
            externalHoverDist={hoverDist}
            onHoverDist={setHoverDist}
          />
        </div>
      )}

      {/* Elevation chart in fullscreen — card, no gradient, touch-navigable */}
      {trackProfile.length > 1 && mapExpanded && (
        <div className="absolute inset-x-3 bottom-4 z-10 overflow-hidden rounded-xl bg-white/70 drop-shadow-[0_4px_16px_rgba(0,0,0,0.1)] backdrop-blur-[68px] lg:hidden dark:bg-zinc-900/60 dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
          <div className="pt-2">
            <TrailElevationChart
              compact
              noGradient
              showTooltip
              selectable={false}
              trackProfile={trackProfile}
              labels={{
                elevationProfile: t('elevationProfile'),
                slope: t('slope'),
                flat: t('flat'),
                gentle: t('gentle'),
                steep: t('steep'),
                extreme: t('extreme'),
                km: t('km'),
                meters: t('meters'),
                resetZoom: t('resetZoom'),
              }}
              externalHoverDist={hoverDist}
              onHoverDist={setHoverDist}
              onRangeSelect={(s, e) => setSelectedRange({ start: s, end: e })}
              onRangeReset={() => setSelectedRange(null)}
            />
          </div>
        </div>
      )}

      {/* Tap-to-expand overlay — mobile only, not fullscreen */}
      {!mapExpanded && (
        <button
          type="button"
          className="absolute inset-0 z-10 lg:hidden"
          onClick={() => setMapExpanded(true)}
          aria-label={t('expandMap')}
        />
      )}

      {/* Back button overlay — mobile only */}
      {!mapExpanded && (
        <Link
          href={`/${locale}/trail/${trail.country}${searchParams ? `?${searchParams}` : ''}`}
          className="absolute top-3 left-3 z-10 flex items-center justify-center rounded-full bg-white/90 p-2 shadow-md backdrop-blur-sm lg:hidden dark:bg-zinc-900/90"
          aria-label={t('backToTrails')}
        >
          <ArrowLeft className="text-secondary-foreground size-6" />
        </Link>
      )}

      {/* Expand button — mobile only, top-right */}
      {!mapExpanded && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setMapExpanded(true)}
          className="absolute top-3 right-3 z-10 size-10 shadow-md lg:hidden"
          aria-label="Expand map"
        >
          <Maximize2 />
        </Button>
      )}

      {/* Close button — shown when map is expanded */}
      {mapExpanded && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setMapExpanded(false)}
          className="absolute top-3 right-3 z-10 size-10 shadow-md"
          aria-label="Close map"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
