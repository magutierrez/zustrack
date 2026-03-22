'use client';

import { useState } from 'react';
import { TrailMapWrapper } from './trail-map-wrapper';
import { TrailHazards } from './trail-hazards';

type TrackPoint = { lat: number; lng: number; d: number; e: number | null };
type Range = { start: number; end: number };

export function TrailDetailClient({
  trackProfile,
  name,
  isCircular,
}: {
  trackProfile: TrackPoint[];
  name: string;
  isCircular: boolean;
}) {
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

  return (
    <>
      <TrailMapWrapper
        trackProfile={trackProfile}
        name={name}
        isCircular={isCircular}
        selectedRange={selectedRange}
        onReset={() => setSelectedRange(null)}
      />
      <TrailHazards
        trackProfile={trackProfile}
        selectedRange={selectedRange}
        onSegmentSelect={(start, end) => setSelectedRange({ start, end })}
        onReset={() => setSelectedRange(null)}
      />
    </>
  );
}
