'use client';

import { useState } from 'react';
import { TrailMapWrapper } from './trail-map-wrapper';
import { TrailHazards } from './trail-hazards';
import { TrailElevationChart } from './trail-elevation-chart';
import { EscapePointsSection, type EscapePoint } from './escape-points-section';
import { WaterSourcesSection, type WaterSource } from './water-sources-section';

type TrackPoint = { lat: number; lng: number; d: number; e: number | null };
type Range = { start: number; end: number };
type FocusPoint = { lat: number; lng: number };

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

type POILabels = {
  showOnMap: string;
  escapePoints: string;
  town: string;
  road: string;
  shelter: string;
  waterSources: string;
  natural: string;
  urban: string;
  reliable: string;
  seasonal: string;
  unreliable: string;
  kmAway: string;
};

export function TrailDetailClient({
  trackProfile,
  name,
  isCircular,
  elevationLabels,
  escapePoints,
  waterSources,
  poiLabels,
}: {
  trackProfile: TrackPoint[];
  name: string;
  isCircular: boolean;
  elevationLabels: ElevationLabels;
  escapePoints?: EscapePoint[];
  waterSources?: WaterSource[];
  poiLabels?: POILabels;
}) {
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [hoverDist, setHoverDist] = useState<number | null>(null);
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);

  const handleShowOnMap = (lat: number, lng: number) => {
    setFocusPoint({ lat, lng });
  };

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
        escapePoints={escapePoints}
        waterSources={waterSources}
        focusPoint={focusPoint}
        onFocusPointConsumed={() => setFocusPoint(null)}
        activePOI={focusPoint}
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
      {escapePoints && escapePoints.length > 0 && poiLabels && (
        <EscapePointsSection
          escapePoints={escapePoints}
          labels={{
            escapePoints: poiLabels.escapePoints,
            town: poiLabels.town,
            road: poiLabels.road,
            shelter: poiLabels.shelter,
            kmAway: poiLabels.kmAway,
            showOnMap: poiLabels.showOnMap,
          }}
          activePOI={focusPoint}
          onShowOnMap={handleShowOnMap}
        />
      )}
      {waterSources && waterSources.length > 0 && poiLabels && (
        <WaterSourcesSection
          waterSources={waterSources}
          labels={{
            waterSources: poiLabels.waterSources,
            natural: poiLabels.natural,
            urban: poiLabels.urban,
            reliable: poiLabels.reliable,
            seasonal: poiLabels.seasonal,
            unreliable: poiLabels.unreliable,
            kmAway: poiLabels.kmAway,
            showOnMap: poiLabels.showOnMap,
          }}
          activePOI={focusPoint}
          onShowOnMap={handleShowOnMap}
        />
      )}
    </>
  );
}
