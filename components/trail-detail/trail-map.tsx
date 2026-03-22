'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';
import Map, { NavigationControl, Source, Layer, Marker, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getSlopeColorHex } from '@/lib/slope-colors';
import { haversineDistance } from '@/lib/gpx-parser';

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

interface TrailMapProps {
  trackProfile: TrackPoint[];
  name: string;
  isCircular: boolean;
  selectedRange?: { start: number; end: number } | null;
  onReset?: () => void;
  hoverDist?: number | null;
  onHoverDist?: (dist: number | null) => void;
}

const MAP_STYLE = `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;

/** Build color-stop stops for MapLibre line-gradient from slope values */
function buildGradientStops(points: TrackPoint[]): (string | number)[] {
  if (points.length < 2) return [0, '#10b981'];
  const totalDist = points[points.length - 1].d;
  if (totalDist === 0) return [0, '#10b981'];

  const stops: (string | number)[] = [];
  let lastProgress = -1;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const progress = Math.min(1, Math.max(0, p.d / totalDist));
    // MapLibre requires strictly ascending stop values — skip duplicates
    if (progress <= lastProgress) continue;

    let slope = 0;
    if (i > 0) {
      const prev = points[i - 1];
      const distM = haversineDistance(prev.lat, prev.lng, p.lat, p.lng) * 1000;
      if (distM > 1 && prev.e !== null && p.e !== null) {
        slope = ((p.e - prev.e) / distM) * 100;
      }
    }
    stops.push(progress, getSlopeColorHex(slope));
    lastProgress = progress;
  }

  if (stops.length === 0) return [0, '#10b981'];
  // Ensure the gradient always starts at 0 and ends at 1
  if ((stops[0] as number) > 0) stops.unshift(0, stops[1]);
  if ((stops[stops.length - 2] as number) < 1) stops.push(1, stops[stops.length - 1]);

  return stops;
}

export default function TrailMap({
  trackProfile,
  name,
  isCircular,
  selectedRange,
  onReset: _onReset,
  hoverDist,
  onHoverDist,
}: TrailMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  const totalDist = trackProfile.length > 0 ? trackProfile[trackProfile.length - 1].d : 0;
  const coordinates = trackProfile.map((p) => [p.lng, p.lat]);

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates },
      },
    ],
  };

  const gradientStops = buildGradientStops(trackProfile);

  // Compute full-route bounds
  const lats = trackProfile.map((p) => p.lat);
  const lngs = trackProfile.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Highlight GeoJSON for the selected segment
  const highlightGeoJSON = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!selectedRange) return null;
    const pts = trackProfile.filter(
      (p) => p.d >= selectedRange.start && p.d <= selectedRange.end,
    );
    if (pts.length < 2) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: pts.map((p) => [p.lng, p.lat]),
          },
        },
      ],
    };
  }, [selectedRange, trackProfile]);

  // Zoom to selected range or full route when selectedRange changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedRange) {
      const pts = trackProfile.filter(
        (p) => p.d >= selectedRange.start && p.d <= selectedRange.end,
      );
      if (pts.length > 0) {
        const ptLngs = pts.map((p) => p.lng);
        const ptLats = pts.map((p) => p.lat);
        map.fitBounds(
          [[Math.min(...ptLngs), Math.min(...ptLats)], [Math.max(...ptLngs), Math.max(...ptLats)]],
          { padding: 60, duration: 800 },
        );
      }
    } else {
      map.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 40, duration: 800 },
      );
    }
  }, [selectedRange, trackProfile, minLat, maxLat, minLng, maxLng]);

  const baseOpacity = selectedRange ? 0.3 : 1;

  // Find the closest track point for the hovered distance
  const hoverPoint = useMemo(() => {
    if (hoverDist == null || trackProfile.length === 0) return null;
    let best = trackProfile[0];
    let bestDiff = Math.abs(best.d - hoverDist);
    for (const p of trackProfile) {
      const diff = Math.abs(p.d - hoverDist);
      if (diff < bestDiff) { best = p; bestDiff = diff; }
    }
    return best;
  }, [hoverDist, trackProfile]);

  const handleMapMouseMove = useCallback(
    (e: any) => {
      if (!onHoverDist || trackProfile.length === 0) return;
      const { lng, lat } = e.lngLat;
      let best = trackProfile[0];
      let bestDistSq = Infinity;
      for (const p of trackProfile) {
        const dlat = p.lat - lat;
        const dlng = p.lng - lng;
        const dsq = dlat * dlat + dlng * dlng;
        if (dsq < bestDistSq) { bestDistSq = dsq; best = p; }
      }
      // ~0.003° ≈ 330 m threshold
      onHoverDist(bestDistSq < 0.003 * 0.003 ? best.d : null);
    },
    [onHoverDist, trackProfile],
  );

  const handleMapMouseLeave = useCallback(() => {
    onHoverDist?.(null);
  }, [onHoverDist]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: (minLng + maxLng) / 2,
          latitude: (minLat + maxLat) / 2,
          zoom: 10,
        }}
        style={{ width: '100%', height: 320 }}
        mapStyle={MAP_STYLE}
        onLoad={(e) => {
          e.target.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            { padding: 40, duration: 0 },
          );
        }}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {/* Base trail */}
        <Source id="trail" type="geojson" data={geojson} lineMetrics>
          <Layer
            id="trail-shadow"
            type="line"
            source="trail"
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{ 'line-color': '#000', 'line-width': 7, 'line-opacity': 0.15 * baseOpacity }}
          />
          <Layer
            id="trail-line"
            type="line"
            source="trail"
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{
              'line-width': 4,
              'line-opacity': baseOpacity,
              'line-gradient': [
                'interpolate',
                ['linear'],
                ['line-progress'],
                ...gradientStops,
              ],
            }}
          />
        </Source>

        {/* Segment highlight overlay */}
        {selectedRange && highlightGeoJSON && (
          <Source id="trail-highlight" type="geojson" data={highlightGeoJSON}>
            <Layer
              id="trail-highlight-glow"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': '#fff', 'line-width': 9, 'line-opacity': 0.4, 'line-blur': 4 }}
            />
            <Layer
              id="trail-highlight-line"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': '#f59e0b', 'line-width': 5 }}
            />
          </Source>
        )}

        {/* Start marker */}
        {trackProfile.length > 0 && (
          <StartEndMarker lng={trackProfile[0].lng} lat={trackProfile[0].lat} color="#10b981" label="S" />
        )}

        {/* End marker (linear only) */}
        {!isCircular && trackProfile.length > 1 && (
          <StartEndMarker
            lng={trackProfile[trackProfile.length - 1].lng}
            lat={trackProfile[trackProfile.length - 1].lat}
            color="#ef4444"
            label="E"
          />
        )}

        {/* Hover dot — synced with elevation chart */}
        {hoverPoint && (
          <Marker latitude={hoverPoint.lat} longitude={hoverPoint.lng} anchor="center">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-400 shadow-md" />
          </Marker>
        )}
      </Map>

      {/* Distance legend */}
      <div className="flex items-center justify-between bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        <span>{name}</span>
        <span>{totalDist.toFixed(1)} km</span>
      </div>
    </div>
  );
}

function StartEndMarker({
  lat,
  lng,
  color,
  label,
}: {
  lat: number;
  lng: number;
  color: string;
  label: string;
}) {
  return (
    <Marker latitude={lat} longitude={lng} anchor="center">
      <div
        style={{ backgroundColor: color }}
        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white shadow-md ring-2 ring-white"
      >
        {label}
      </div>
    </Marker>
  );
}
