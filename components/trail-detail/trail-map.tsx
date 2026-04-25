'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import Map, { NavigationControl, Source, Layer, Marker, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { getSlopeColorHex } from '@/lib/slope-colors';
import { transformRequest } from '@/lib/map-transform';
import { addArrowImage } from '@/lib/map-utils';
import type { TrailMapLayerType } from '@/lib/types';
import { useTrailMapStyle } from './use-trail-map-style';
import { TrailLayerControl } from './trail-layer-control';
import { useTrailTerrain } from './use-trail-terrain';
import { Button } from '@/components/ui/button';
import type { EscapePoint } from './escape-points-section';
import type { WaterSource } from './water-sources-section';
import { MapPopup } from '@/components/route-map/map-popup';
import type { MapPopupInfo } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { calculateBearing } from '@/lib/geometry';

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

// Colors per escape point type
const ESCAPE_COLORS: Record<EscapePoint['type'], string> = {
  town: '#f97316', // orange
  road: '#3b82f6', // blue
  shelter: '#a855f7', // purple
};

interface TrailMapProps {
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
  mapExpanded?: boolean;
  onMapReady?: (map: maplibregl.Map) => void;
}

/** Build color-stop stops for MapLibre line-gradient from slope values */
function buildGradientStops(points: TrackPoint[]): (string | number)[] {
  const n = points.length;
  if (n < 2) return [0, '#10b981', 1, '#10b981'];

  const startDist = points[0].d;
  const endDist = points[n - 1].d;
  const totalDist = endDist - startDist;

  if (totalDist <= 0) return [0, '#10b981', 1, '#10b981'];

  // 1. Raw point-to-point slopes
  const rawSlopes = new Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) {
    const distDiffM = (points[i].d - points[i - 1].d) * 1000;
    const eleDiffM = (points[i].e ?? 0) - (points[i - 1].e ?? 0);
    if (distDiffM > 0.1) rawSlopes[i] = (eleDiffM / distDiffM) * 100;
  }

  // 2. 400 m sliding-window smoothing (same as hazard chart)
  const halfWindowKm = 0.2;
  const smoothSlopes = new Array<number>(n).fill(0);
  let left = 0,
    right = -1,
    wSum = 0,
    wCount = 0;
  for (let i = 0; i < n; i++) {
    const center = points[i].d;
    while (right + 1 < n && points[right + 1].d <= center + halfWindowKm) {
      right++;
      wSum += rawSlopes[right];
      wCount++;
    }
    while (left <= right && points[left].d < center - halfWindowKm) {
      wSum -= rawSlopes[left];
      left++;
      wCount--;
    }
    smoothSlopes[i] = wCount > 0 ? wSum / wCount : 0;
  }

  const stops: (string | number)[] = [];
  let lastProgress = -1;

  for (let i = 0; i < n; i++) {
    const p = points[i];
    const progress = Math.min(1, Math.max(0, (p.d - startDist) / totalDist));
    // MapLibre requires strictly ascending stop values — skip duplicates
    if (progress <= lastProgress && i > 0) continue;

    stops.push(progress, getSlopeColorHex(smoothSlopes[i]));
    lastProgress = progress;
  }

  if (stops.length === 0) return [0, '#10b981', 1, '#10b981'];
  // Ensure the gradient always starts at 0 and ends at 1
  if ((stops[0] as number) > 0) stops.unshift(0, stops[1]);
  if ((stops[stops.length - 2] as number) < 1) stops.push(1, stops[stops.length - 1]);

  return stops;
}

function isActivePOI(
  activePOI: { lat: number; lng: number } | null | undefined,
  lat: number,
  lng: number,
) {
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
  mapExpanded,
  onMapReady,
}: TrailMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [mapType, setMapType] = useState<TrailMapLayerType>('osm');
  const [enable3D, setEnable3D] = useState(false);
  const mapStyle = useTrailMapStyle(mapType);
  const { terrainLoading } = useTrailTerrain(mapRef, mapStyle, enable3D);
  const isMobile = useIsMobile();

  const [popupInfo, setPopupInfo] = useState<MapPopupInfo | null>(null);

  const handleMapClick = useCallback(
    (e: any) => {
      const { lng, lat } = e.lngLat;
      if (trackProfile.length === 0) return;

      let best = trackProfile[0];
      let bestIdx = 0;
      let bestDistSq = Infinity;

      for (let i = 0; i < trackProfile.length; i++) {
        const p = trackProfile[i];
        const dlat = p.lat - lat;
        const dlng = p.lng - lng;
        const dsq = dlat * dlat + dlng * dlng;
        if (dsq < bestDistSq) {
          bestDistSq = dsq;
          best = p;
          bestIdx = i;
        }
      }

      // ~0.003° ≈ 330 m threshold
      if (bestDistSq > 0.003 * 0.003) {
        setPopupInfo(null);
        return;
      }

      let slope = 0;
      let bearing = 0;

      if (bestIdx < trackProfile.length - 1) {
        const p1 = trackProfile[bestIdx];
        const p2 = trackProfile[bestIdx + 1];
        bearing = calculateBearing({ lat: p1.lat, lon: p1.lng }, { lat: p2.lat, lon: p2.lng });
        const distDiff = (p2.d - p1.d) * 1000;
        const eleDiff = (p2.e || 0) - (p1.e || 0);
        slope = distDiff > 0.1 ? (eleDiff / distDiff) * 100 : 0;
      }

      setPopupInfo({
        point: {
          lat: best.lat,
          lon: best.lng,
          distanceFromStart: best.d,
          ele: best.e ?? undefined,
          slope,
        },
        weather: {
          temperature: 0,
          apparentTemperature: 0,
          humidity: 0,
          precipitation: 0,
          precipitationProbability: 0,
          weatherCode: 0,
          windSpeed: 0,
          windDirection: 0,
          windGusts: 0,
          cloudCover: 0,
          visibility: 0,
          time: new Date().toISOString(),
        },
        windEffect: 'tailwind',
        index: -1,
        bearing,
      });
    },
    [trackProfile],
  );

  // Tilt map when switching 3D on/off.
  // When enabling 3D, wait for the terrain tiles to finish loading before pitching
  // so the camera doesn't tilt over an empty/glitchy terrain.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (!enable3D) {
      map.easeTo({ pitch: 0, duration: 600 });
    } else if (!terrainLoading) {
      map.easeTo({ pitch: 60, duration: 600 });
    }
  }, [enable3D, terrainLoading, mapRef]);

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

  // Highlight GeoJSON and gradient for the selected segment
  const { highlightGeoJSON, highlightGradientStops } = useMemo(() => {
    if (!selectedRange) return { highlightGeoJSON: null, highlightGradientStops: null };
    const pts = trackProfile.filter((p) => p.d >= selectedRange.start && p.d <= selectedRange.end);
    if (pts.length < 2) return { highlightGeoJSON: null, highlightGradientStops: null };

    const geojson: GeoJSON.FeatureCollection = {
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

    return {
      highlightGeoJSON: geojson,
      highlightGradientStops: buildGradientStops(pts),
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
          [
            [Math.min(...ptLngs), Math.min(...ptLats)],
            [Math.max(...ptLngs), Math.max(...ptLats)],
          ],
          { padding: isMobile ? { top: 30, bottom: 100, left: 40, right: 40 } : 60, duration: 800 },
        );
      }
    } else {
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: isMobile ? { top: 30, bottom: 100, left: 40, right: 40 } : 40, duration: 800 },
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
      if (diff < bestDiff) {
        best = p;
        bestDiff = diff;
      }
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
        if (dsq < bestDistSq) {
          bestDistSq = dsq;
          best = p;
        }
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
        onClick={handleMapClick}
        onLoad={(e) => {
          const map = e.target as maplibregl.Map;
          addArrowImage(map);
          map.on('style.load', () => addArrowImage(map));
          map.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            { padding: isMobile ? { top: 30, bottom: 100, left: 40, right: 40 } : 40, duration: 0 },
          );
          onMapReady?.(map);
        }}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        attributionControl={false}
        transformRequest={transformRequest}
      >
        {!isMobile && <NavigationControl position="bottom-right" />}
        {(!isMobile || mapExpanded) && (
          <TrailLayerControl
            mapType={mapType}
            setMapType={setMapType}
            className={mapExpanded && isMobile ? 'absolute top-[104px] right-3 z-10' : 'absolute top-2 right-3 z-10'}
          />
        )}
        {(!isMobile || mapExpanded) && (
          <div className="absolute top-14 right-3 z-10">
            <Button
              variant={enable3D ? 'default' : 'secondary'}
              size="icon"
              className="h-10 w-10 text-xs font-bold shadow-md"
              onClick={() => setEnable3D((v) => !v)}
              disabled={terrainLoading}
              title={enable3D ? '2D' : '3D'}
            >
              {enable3D ? '2D' : '3D'}
            </Button>
          </div>
        )}

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
            id="trail-casing"
            type="line"
            source="trail"
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{
              'line-color': '#ffffff',
              'line-width': 6.5,
              'line-opacity': 0.9 * baseOpacity,
            }}
          />
          <Layer
            id="trail-line"
            type="line"
            source="trail"
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{
              'line-width': 4,
              'line-opacity': baseOpacity,
              'line-gradient': ['interpolate', ['linear'], ['line-progress'], ...gradientStops],
            }}
          />
          <Layer
            id="trail-direction-arrows"
            type="symbol"
            layout={{
              'symbol-placement': 'line',
              'symbol-spacing': 120,
              'icon-image': 'route-arrow',
              'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.45, 18, 0.85],
              'icon-allow-overlap': true,
              'icon-keep-upright': false,
              'icon-rotation-alignment': 'map',
            }}
            paint={{
              'icon-color': mapType === 'osm' ? '#1368CE' : '#000000',
              'icon-opacity': 0.6 * baseOpacity,
            }}
          />
        </Source>
        {/* Segment highlight overlay */}
        {selectedRange && highlightGeoJSON && highlightGradientStops && (
          <Source id="trail-highlight" type="geojson" data={highlightGeoJSON} lineMetrics>
            <Layer
              id="trail-highlight-glow"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': '#fff',
                'line-width': 10,
                'line-opacity': 0.6,
                'line-blur': 3,
              }}
            />
            <Layer
              id="trail-highlight-line"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-width': 6,
                'line-gradient': [
                  'interpolate',
                  ['linear'],
                  ['line-progress'],
                  ...highlightGradientStops,
                ],
              }}
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
                  className="h-0 w-0 border-t-[6px] border-r-[5px] border-l-[5px] border-r-transparent border-l-transparent"
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
                <div className="h-0 w-0 border-t-[6px] border-r-[5px] border-l-[5px] border-t-sky-500 border-r-transparent border-l-transparent" />
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
                <div className="h-0 w-0 border-t-[6px] border-r-[5px] border-l-[5px] border-t-violet-500 border-r-transparent border-l-transparent" />
              </div>
            </Marker>
          )}

        {/* Start marker */}
        {trackProfile.length > 0 && (
          <StartEndMarker
            lng={trackProfile[0].lng}
            lat={trackProfile[0].lat}
            color="#10b981"
            label="S"
          />
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

        {popupInfo && !isMobile && (
          <MapPopup popupInfo={popupInfo} onClose={() => setPopupInfo(null)} hideNotes={true} />
        )}
      </Map>

      {popupInfo && isMobile && (
        <MapPopup
          popupInfo={popupInfo}
          onClose={() => setPopupInfo(null)}
          mobileMode
          hideNotes={true}
        />
      )}
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
