'use client';

import dynamic from 'next/dynamic';

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
  selectedRange?: { start: number; end: number } | null;
  onReset?: () => void;
  hoverDist?: number | null;
  onHoverDist?: (dist: number | null) => void;
}

export function TrailMapWrapper({ trackProfile, name, isCircular, selectedRange, onReset, hoverDist, onHoverDist }: Props) {
  return (
    <TrailMapInner
      trackProfile={trackProfile}
      name={name}
      isCircular={isCircular}
      selectedRange={selectedRange}
      onReset={onReset}
      hoverDist={hoverDist}
      onHoverDist={onHoverDist}
    />
  );
}
