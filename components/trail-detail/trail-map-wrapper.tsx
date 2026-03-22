'use client';

import dynamic from 'next/dynamic';

const TrailMapInner = dynamic(() => import('./trail-map'), { ssr: false });

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

export function TrailMapWrapper({
  trackProfile,
  name,
  isCircular,
}: {
  trackProfile: TrackPoint[];
  name: string;
  isCircular: boolean;
}) {
  return <TrailMapInner trackProfile={trackProfile} name={name} isCircular={isCircular} />;
}
