'use client';

import dynamic from 'next/dynamic';
import type { EscapePoint } from './escape-points-section';
import type { WaterSource } from './water-sources-section';

const TrailMapInner = dynamic(() => import('./trail-map'), { ssr: false });

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

interface Props {
  trackProfile: TrackPoint[];
  name: string;
  isCircular: boolean;
  selectedRange?: { start: number; end: number; color?: string } | null;
  onReset?: () => void;
  hoverDist?: number | null;
  onHoverDist?: (dist: number | null) => void;
  escapePoints?: EscapePoint[];
  waterSources?: WaterSource[];
  focusPoint?: { lat: number; lng: number } | null;
  onFocusPointConsumed?: () => void;
  activePOI?: { lat: number; lng: number } | null;
}

export function TrailMapWrapper({
  trackProfile, name, isCircular, selectedRange, onReset,
  hoverDist, onHoverDist,
  escapePoints, waterSources, focusPoint, onFocusPointConsumed, activePOI,
}: Props) {
  return (
    <TrailMapInner
      trackProfile={trackProfile}
      name={name}
      isCircular={isCircular}
      selectedRange={selectedRange}
      onReset={onReset}
      hoverDist={hoverDist}
      onHoverDist={onHoverDist}
      escapePoints={escapePoints}
      waterSources={waterSources}
      focusPoint={focusPoint}
      onFocusPointConsumed={onFocusPointConsumed}
      activePOI={activePOI}
    />
  );
}
