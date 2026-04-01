'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import Map, { NavigationControl, Source, Layer, Marker, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getSlopeColorHex } from '@/lib/slope-colors';
import { haversineDistance } from '@/lib/gpx-parser';
import { transformRequest } from '@/lib/map-transform';
import type { TrailMapLayerType } from '@/lib/types';
import { useTrailMapStyle } from './use-trail-map-style';
import { TrailLayerControl } from './trail-layer-control';
import { useTrailTerrain } from './use-trail-terrain';
import { Button } from '@/components/ui/button';
import type { EscapePoint } from './escape-points-section';
import type { WaterSource } from './water-sources-section';

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

// Colors per escape point type
const ESCAPE_COLORS: Record<EscapePoint['type'], string> = {
  town: '#f97316',   // orange
  road: '#3b82f6',   // blue
  shelter: '#a855f7', // purple
};

interface TrailMapProps {
  trackProfile: TrackPoint[];
  name: string;
  isCircular: boolean;
  selectedRange?: { start: number; end: number } | null;
  onReset?: () => void;
  hoverDist?: number | null;
  onHoverDist?: (dist: number | null) => void;
  escapePoints?: EscapePoint[];
  waterSources?: WaterSource[];
  focusPoint?: { lat: number; lng: number } | null;
  onFocusPointConsumed?: () => void;
  activePOI?: { lat: number; lng: number } | null;
}


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

function isActivePOI(activePOI: { lat: number; lng: number } | null | undefined, lat: number, lng: number) {
  if (!activePOI) return false;
  return Math.abs(activePOI.lat - lat) < 0.00001 && Math.abs(activePOI.lng - lng) < 0.00001;
}

export default function TrailMap({
  trackProfile,
  name: _name,
  isCircular,
  selectedRange,
  onReset: _onReset,
  hoverDist,
  onHoverDist,
  escapePoints,
  waterSources,
  focusPoint,
  onFocusPointConsumed,
  activePOI,
}: TrailMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [mapType, setMapType] = useState<TrailMapLayerType>('ign-raster');
  const [enable3D, setEnable3D] = useState(false);
  const mapStyle = useTrailMapStyle(mapType);
  const { terrainLoading } = useTrailTerrain(mapRef, mapStyle, enable3D);

  // Tilt map when switching 3D on/off
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.easeTo({ pitch: enable3D ? 60 : 0, duration: 600 });
  }, [enable3D, mapRef]);

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

  // Fly to POI focus point when set
  useEffect(() => {
    if (!focusPoint) return;
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [focusPoint.lng, focusPoint.lat], zoom: 14, duration: 800 });
    onFocusPointConsumed?.();
  }, [focusPoint, onFocusPointConsumed]);

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
    <div className="h-full w-full overflow-hidden">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: (minLng + maxLng) / 2,
          latitude: (minLat + maxLat) / 2,
          zoom: 10,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        onLoad={(e) => {
          e.target.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            { padding: 40, duration: 0 },
          );
        }}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        attributionControl={false}
        transformRequest={transformRequest}
      >
        <NavigationControl position="bottom-right" />
        <TrailLayerControl mapType={mapType} setMapType={setMapType} />
        <div className="absolute top-[100px] right-3 z-10">
          <Button
            variant={enable3D ? 'default' : 'secondary'}
            size="icon"
            className="h-10 w-10 shadow-md text-xs font-bold"
            onClick={() => setEnable3D((v) => !v)}
            disabled={terrainLoading}
            title={enable3D ? '2D' : '3D'}
          >
            {enable3D ? '2D' : '3D'}
          </Button>
        </div>

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

        {/* Escape point marker — only shown when selected via "Show on map" */}
        {escapePoints?.map((ep, i) => {
          if (!isActivePOI(activePOI, ep.lat, ep.lng)) return null;
          const color = ESCAPE_COLORS[ep.type];
          return (
            <Marker key={`ep-${i}`} latitude={ep.lat} longitude={ep.lng} anchor="bottom">
              <div className="flex flex-col items-center">
                <div
                  style={{ backgroundColor: color }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-black text-white shadow-lg ring-2 ring-white ring-offset-1"
                >
                  {ep.type === 'town' ? 'T' : ep.type === 'road' ? 'R' : 'S'}
                </div>
                <div
                  style={{ borderTopColor: color }}
                  className="h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent"
                />
              </div>
            </Marker>
          );
        })}

        {/* Water source marker — only shown when selected via "Show on map" */}
        {waterSources?.map((ws, i) => {
          if (!isActivePOI(activePOI, ws.lat, ws.lng)) return null;
          return (
            <Marker key={`ws-${i}`} latitude={ws.lat} longitude={ws.lng} anchor="bottom">
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-[9px] font-black text-white shadow-lg ring-2 ring-white ring-offset-1">
                  💧
                </div>
                <div className="h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-sky-500" />
              </div>
            </Marker>
          );
        })}

        {/* Elevation point marker — shown when activePOI is a high/low point (not an escape/water POI) */}
        {activePOI &&
          !escapePoints?.some((ep) => isActivePOI(activePOI, ep.lat, ep.lng)) &&
          !waterSources?.some((ws) => isActivePOI(activePOI, ws.lat, ws.lng)) && (
            <Marker latitude={activePOI.lat} longitude={activePOI.lng} anchor="bottom">
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-[11px] font-black text-white shadow-lg ring-2 ring-white ring-offset-1">
                  ▲
                </div>
                <div className="h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-violet-500" />
              </div>
            </Marker>
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
