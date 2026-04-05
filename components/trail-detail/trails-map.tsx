'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Map, {
  NavigationControl,
  Source,
  Layer,
  Popup,
  type MapRef,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre';
import type { PositionAnchor } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, Point, LineString } from 'geojson';
import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { TrailSearchParams } from '@/lib/trails';
import { transformRequest } from '@/lib/map-transform';
import { getSlopeColorHex } from '@/lib/slope-colors';
import type { TrailMapLayerType } from '@/lib/types';
import { useTrailMapStyle } from './use-trail-map-style';
import { TrailLayerControl } from './trail-layer-control';

const EFFORT_COLORS: Record<string, string> = {
  easy: '#10b981',
  moderate: '#0ea5e9',
  hard: '#f59e0b',
  very_hard: '#f43f5e',
};

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
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

interface SelectedTrailInfo {
  lng: number;
  lat: number;
  name: string;
  trail_code: string | null;
  distance_km: number;
  effort_level: string;
  slug: string;
  country: string;
  elevation_gain_m?: number;
  elevation_loss_m?: number;
  elevation_min_m?: number;
  elevation_max_m?: number;
}

interface TrailsMapProps {
  searchParams: TrailSearchParams;
  locale: string;
  labels: {
    viewTrail: string;
    loading: string;
    noTrails: string;
    effort: {
      easy: string;
      moderate: string;
      hard: string;
      veryHard: string;
    };
    km: string;
    meters: string;
    elevationGain: string;
    elevationLoss: string;
    lowPoint: string;
    highPoint: string;
  };
}

function buildGeoUrl(sp: TrailSearchParams): string {
  const params = new URLSearchParams();
  if (sp.q)       params.set('q',       sp.q);
  if (sp.effort)  params.set('effort',  sp.effort);
  if (sp.type)    params.set('type',    sp.type);
  if (sp.shape)   params.set('shape',   sp.shape);
  if (sp.child)   params.set('child',   sp.child);
  if (sp.pet)     params.set('pet',     sp.pet);
  if (sp.minDist) params.set('minDist', sp.minDist);
  if (sp.maxDist) params.set('maxDist', sp.maxDist);
  if (sp.minGain) params.set('minGain', sp.minGain);
  if (sp.maxGain) params.set('maxGain', sp.maxGain);
  if (sp.season)  params.set('season',  sp.season);
  if (sp.region)  params.set('region',  sp.region);
  const qs = params.toString();
  return `/api/trails/geo${qs ? `?${qs}` : ''}`;
}

function getEffortLabel(effort: string, labels: TrailsMapProps['labels']): string {
  if (effort === 'easy') return labels.effort.easy;
  if (effort === 'moderate') return labels.effort.moderate;
  if (effort === 'hard') return labels.effort.hard;
  if (effort === 'very_hard') return labels.effort.veryHard;
  return effort;
}

interface TrackPreview {
  geojson: FeatureCollection<LineString>;
  color: string;
  gradientStops: (string | number)[];
}

export function TrailsMap({ searchParams, locale, labels }: TrailsMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapType, setMapType] = useState<TrailMapLayerType>('osm');
  const mapStyle = useTrailMapStyle(mapType);
  const [geojson, setGeojson] = useState<FeatureCollection<Point> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrail, setSelectedTrail] = useState<SelectedTrailInfo | null>(null);
  const [trackPreview, setTrackPreview] = useState<TrackPreview | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [cursor, setCursor] = useState<string>('grab');

  // Fetch GeoJSON whenever filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedTrail(null);
    setTrackPreview(null);

    fetch(buildGeoUrl(searchParams))
      .then((r) => r.json())
      .then((data: FeatureCollection<Point>) => {
        if (cancelled) return;
        setGeojson(data);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    searchParams.q,
    searchParams.effort,
    searchParams.type,
    searchParams.shape,
    searchParams.child,
    searchParams.pet,
    searchParams.minDist,
    searchParams.maxDist,
    searchParams.minGain,
    searchParams.maxGain,
    searchParams.season,
    searchParams.region,
  ]);

  // Fit bounds to all features after data loads
  useEffect(() => {
    if (!geojson?.features?.length || !mapRef.current) return;

    const coords = geojson.features.map((f) => f.geometry.coordinates as [number, number]);
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    if (minLng === maxLng && minLat === maxLat) {
      mapRef.current.flyTo({ center: [minLng, minLat], zoom: 12 });
    } else {
      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 50, maxZoom: 14, duration: 800 },
      );
    }
  }, [geojson]);

  const clearTrailSelection = useCallback(() => {
    setSelectedTrail(null);
    setTrackPreview(null);
    setTrackLoading(false);
  }, []);

  const handleClick = useCallback(
    async (e: MapLayerMouseEvent) => {
      const features = e.features;
      if (!features?.length) {
        clearTrailSelection();
        return;
      }

      const feature = features[0];

      if (feature.layer.id === 'trail-clusters') {
        const clusterId = feature.properties?.cluster_id as number;
        const mapInstance = mapRef.current?.getMap();
        const source = mapInstance?.getSource('trails') as GeoJSONSource | undefined;
        if (!source || !clusterId) return;

        try {
          const zoom = await source.getClusterExpansionZoom(clusterId);
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
          mapRef.current?.easeTo({ center: coords, zoom, duration: 500 });
        } catch {
          // ignore
        }
      } else if (feature.layer.id === 'trail-points') {
        const props = feature.properties ?? {};
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        const effortLevel = props.effort_level as string;

        setSelectedTrail({
          lng: coords[0],
          lat: coords[1],
          name: props.name as string,
          trail_code: props.trail_code as string | null,
          distance_km: props.distance_km as number,
          effort_level: effortLevel,
          slug: props.slug as string,
          country: props.country as string,
          elevation_gain_m: props.elevation_gain_m as number | undefined,
          elevation_loss_m: props.elevation_loss_m as number | undefined,
          elevation_min_m: props.elevation_min_m as number | undefined,
          elevation_max_m: props.elevation_max_m as number | undefined,
        });
        setTrackPreview(null);
        setTrackLoading(true);

        // Fetch track preview and zoom to trail bounds
        fetch(`/api/trails/${props.id as number}/track`)
          .then((r) => r.json())
          .then(
            (data: {
              profile: TrackPoint[];
              coordinates: [number, number][];
              bbox: [number, number, number, number] | null;
            }) => {
              setTrackLoading(false);
              if (data.coordinates.length >= 2) {
                setTrackPreview({
                  color: EFFORT_COLORS[effortLevel] ?? '#94a3b8',
                  gradientStops: buildGradientStops(data.profile),
                  geojson: {
                    type: 'FeatureCollection',
                    features: [
                      {
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: data.coordinates },
                        properties: {},
                      },
                    ],
                  },
                });
              }

              if (data.bbox) {
                mapRef.current?.fitBounds(
                  [
                    [data.bbox[0], data.bbox[1]],
                    [data.bbox[2], data.bbox[3]],
                  ],
                  { padding: { top: 80, bottom: 60, left: 60, right: 60 }, maxZoom: 14, duration: 700 },
                );
              } else {
                mapRef.current?.flyTo({ center: coords, zoom: 13, duration: 600 });
              }
            },
          )
          .catch(() => {
            setTrackLoading(false);
            mapRef.current?.flyTo({ center: coords, zoom: 13, duration: 600 });
          });
      }
    },
    [clearTrailSelection],
  );

  const handleMouseEnter = useCallback(() => setCursor('pointer'), []);
  const handleMouseLeave = useCallback(() => setCursor('grab'), []);

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80">
          <span className="text-sm text-slate-500 dark:text-slate-400">{labels.loading}</span>
        </div>
      )}

      {!loading && geojson?.features?.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80">
          <span className="text-sm text-slate-500 dark:text-slate-400">{labels.noTrails}</span>
        </div>
      )}

      <Map
        ref={mapRef}
        mapStyle={mapStyle}
        mapLib={maplibregl}
        initialViewState={{ longitude: -3.7, latitude: 40.4, zoom: 5 }}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={['trail-clusters', 'trail-points']}
        cursor={cursor}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        transformRequest={transformRequest}
      >
        <NavigationControl position="bottom-right" />
        <TrailLayerControl mapType={mapType} setMapType={setMapType} />

        {geojson && (
          <Source
            id="trails"
            type="geojson"
            data={geojson}
            cluster
            clusterMaxZoom={11}
            clusterRadius={45}
          >
            {/* Cluster circles */}
            <Layer
              id="trail-clusters"
              type="circle"
              filter={['has', 'point_count']}
              paint={{
                'circle-color': [
                  'step',
                  ['get', 'point_count'],
                  '#60a5fa',
                  20,
                  '#818cf8',
                  100,
                  '#f472b6',
                ],
                'circle-radius': ['step', ['get', 'point_count'], 16, 20, 24, 100, 32],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': selectedTrail ? 0.3 : 1,
                'circle-stroke-opacity': selectedTrail ? 0.3 : 1,
              }}
            />

            {/* Cluster count label */}
            <Layer
              id="trail-cluster-count"
              type="symbol"
              filter={['has', 'point_count']}
              layout={{
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Noto Sans Bold'],
                'text-size': 12,
              }}
              paint={{
                'text-color': '#ffffff',
                'text-opacity': selectedTrail ? 0.3 : 1,
              }}
            />

            {/* Individual trail points colored by effort */}
            <Layer
              id="trail-points"
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={{
                'circle-color': [
                  'match',
                  ['get', 'effort_level'],
                  'easy',
                  EFFORT_COLORS.easy,
                  'moderate',
                  EFFORT_COLORS.moderate,
                  'hard',
                  EFFORT_COLORS.hard,
                  'very_hard',
                  EFFORT_COLORS.very_hard,
                  '#94a3b8',
                ],
                'circle-radius': 7,
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': selectedTrail ? 0.3 : 1,
                'circle-stroke-opacity': selectedTrail ? 0.3 : 1,
              }}
            />
          </Source>
        )}

        {/* Trail track preview — shown on click */}
        {trackPreview && (
          <Source id="track-preview" type="geojson" data={trackPreview.geojson} lineMetrics>
            {/* Outer Glow / Shadow */}
            <Layer
              id="track-preview-shadow"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-color': '#000000',
                'line-width': 10,
                'line-opacity': 0.25,
                'line-blur': 3,
              }}
            />
            {/* High-contrast casing */}
            <Layer
              id="track-preview-casing"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-color': '#ffffff',
                'line-width': 7,
                'line-opacity': 1,
              }}
            />
            {/* Main colored line with slope gradient */}
            <Layer
              id="track-preview-line"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-width': 4.5,
                'line-opacity': 1,
                'line-gradient': [
                  'interpolate',
                  ['linear'],
                  ['line-progress'],
                  ...trackPreview.gradientStops,
                ],
              }}
            />
          </Source>
        )}

        {selectedTrail && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="relative p-4">
              <button
                onClick={clearTrailSelection}
                className="absolute top-3 right-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-2 flex flex-wrap items-center gap-2 pr-6">
                {selectedTrail.trail_code && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: EFFORT_COLORS[selectedTrail.effort_level] ?? '#94a3b8' }}
                  >
                    {selectedTrail.trail_code}
                  </span>
                )}
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm"
                  style={{
                    backgroundColor: `${EFFORT_COLORS[selectedTrail.effort_level] ?? '#94a3b8'}20`,
                    color: EFFORT_COLORS[selectedTrail.effort_level] ?? '#94a3b8',
                  }}
                >
                  {getEffortLabel(selectedTrail.effort_level, labels)}
                </span>
              </div>

              <h3 className="mb-3 pr-6 text-sm font-bold leading-tight text-slate-900 dark:text-white line-clamp-2">
                {selectedTrail.name}
              </h3>

              <div className="mb-4 grid grid-cols-3 gap-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-slate-500">
                    {labels.km}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                    {selectedTrail.distance_km.toFixed(1)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-500">
                    D+
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                    {selectedTrail.elevation_gain_m != null ? `${selectedTrail.elevation_gain_m}m` : '--'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-red-500">
                    D-
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                    {selectedTrail.elevation_loss_m != null ? `${selectedTrail.elevation_loss_m}m` : '--'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-slate-500 line-clamp-1" title={labels.lowPoint}>
                    {labels.lowPoint}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                    {selectedTrail.elevation_min_m != null ? `${selectedTrail.elevation_min_m}m` : '--'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-slate-500 line-clamp-1" title={labels.highPoint}>
                    {labels.highPoint}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                    {selectedTrail.elevation_max_m != null ? `${selectedTrail.elevation_max_m}m` : '--'}
                  </span>
                </div>
              </div>

              {trackLoading ? (
                <div className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <svg className="h-3.5 w-3.5 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span className="text-xs font-medium text-slate-500">{labels.loading}</span>
                </div>
              ) : (
                <Link
                  href={`/${locale}/trail/${selectedTrail.country}/${selectedTrail.slug}`}
                  className="flex h-9 w-full items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {labels.viewTrail}
                </Link>
              )}
            </div>
          </div>
        )}
      </Map>
    </div>
  );
}
