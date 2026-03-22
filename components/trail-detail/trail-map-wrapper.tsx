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
}

export function TrailMapWrapper({ trackProfile, name, isCircular, selectedRange, onReset }: Props) {
  return (
    <TrailMapInner
      trackProfile={trackProfile}
      name={name}
      isCircular={isCircular}
      selectedRange={selectedRange}
      onReset={onReset}
    />
  );
}
