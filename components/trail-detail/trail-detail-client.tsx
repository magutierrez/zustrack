'use client';

import { useState } from 'react';
import { TrailMapWrapper } from './trail-map-wrapper';
import { TrailHazards } from './trail-hazards';
import { TrailElevationChart } from './trail-elevation-chart';

type TrackPoint = { lat: number; lng: number; d: number; e: number | null };
type Range = { start: number; end: number };

type ElevationLabels = {
  elevationProfile: string;
  slope: string;
  flat: string;
  gentle: string;
  steep: string;
  extreme: string;
  km: string;
  meters: string;
  resetZoom: string;
};

export function TrailDetailClient({
  trackProfile,
  name,
  isCircular,
  elevationLabels,
}: {
  trackProfile: TrackPoint[];
  name: string;
  isCircular: boolean;
  elevationLabels: ElevationLabels;
}) {
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [hoverDist, setHoverDist] = useState<number | null>(null);

  return (
    <>
      <TrailMapWrapper
        trackProfile={trackProfile}
        name={name}
        isCircular={isCircular}
        selectedRange={selectedRange}
        onReset={() => setSelectedRange(null)}
        hoverDist={hoverDist}
        onHoverDist={setHoverDist}
      />
      {trackProfile.length > 1 && (
        <TrailElevationChart
          trackProfile={trackProfile}
          labels={elevationLabels}
          externalHoverDist={hoverDist}
          onHoverDist={setHoverDist}
          onRangeSelect={(s, e) => setSelectedRange({ start: s, end: e })}
          onRangeReset={() => setSelectedRange(null)}
        />
      )}
      <TrailHazards
        trackProfile={trackProfile}
        selectedRange={selectedRange}
        onSegmentSelect={(start, end) => setSelectedRange({ start, end })}
        onReset={() => setSelectedRange(null)}
      />
    </>
  );
}
