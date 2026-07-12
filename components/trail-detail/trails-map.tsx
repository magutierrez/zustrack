'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Map, {
  Layer,
  type MapLayerMouseEvent,
  type MapRef,
  NavigationControl,
  Source,
} from 'react-map-gl/maplibre';
import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, LineString, Point } from 'geojson';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { TrailSearchParams } from '@/lib/trails';
import { transformRequest } from '@/lib/map-transform';
import { addArrowImage } from '@/lib/map-utils';
import { getSlopeColorHex } from '@/lib/slope-colors';
import type { TrailMapLayerType } from '@/lib/types';
import { useTrailMapStyle } from './use-trail-map-style';
import { TrailLayerControl } from './trail-layer-control';
import { EFFORT_COLORS } from './trails-map-constants';
import { TrailPopup, type SelectedTrailInfo } from './trail-popup';
import { TrailsMapLayers } from './trails-map-layers';

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

interface TrailsMapProps {
  searchParams: TrailSearchParams;
  locale: string;
  country: string;
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

function buildGeoUrl(sp: TrailSearchParams, country: string): string {
  const params = new URLSearchParams();
  params.set('country', country);
  if (sp.q)       params.set('q',       sp.q);
  if (sp.effort) params.set('effort', sp.effort);
  if (sp.type) params.set('type', sp.type);
  if (sp.shape) params.set('shape', sp.shape);
  if (sp.child) params.set('child', sp.child);
  if (sp.pet) params.set('pet', sp.pet);
  if (sp.minDist) params.set('minDist', sp.minDist);
  if (sp.maxDist) params.set('maxDist', sp.maxDist);
  if (sp.minGain) params.set('minGain', sp.minGain);
  if (sp.maxGain) params.set('maxGain', sp.maxGain);
  if (sp.season) params.set('season', sp.season);
  if (sp.region) params.set('region', sp.region);
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

export function TrailsMap({ searchParams, locale, country, labels }: TrailsMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapType, setMapType] = useState<TrailMapLayerType>('osm');
  const mapStyle = useTrailMapStyle(mapType);

  const initialView = useMemo(() => {
    if (country === 'it') return { longitude: 12.5, latitude: 41.9, zoom: 5 };
    return { longitude: -3.7, latitude: 40.4, zoom: 5 };
  }, [country]);

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

    fetch(buildGeoUrl(searchParams, country))
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
    country,
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

  const handleMapClick = useCallback(
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
                  {
                    padding: { top: 80, bottom: 60, left: 60, right: 60 },
                    maxZoom: 14,
                    duration: 700,
                  },
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
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-50/80 dark:bg-zinc-900/80">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{labels.loading}</span>
        </div>
      )}

      {!loading && geojson?.features?.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-50/80 dark:bg-zinc-900/80">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{labels.noTrails}</span>
        </div>
      )}

      <Map
        ref={mapRef}
        mapStyle={mapStyle}
        mapLib={maplibregl}
        initialViewState={initialView}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={['trail-clusters', 'trail-points']}
        cursor={cursor}
        onClick={handleMapClick}
        onLoad={(e) => {
          const map = e.target as maplibregl.Map;
          addArrowImage(map);
          map.on('style.load', () => addArrowImage(map));
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        transformRequest={transformRequest}
      >
        <NavigationControl position="bottom-right" />
        <TrailLayerControl mapType={mapType} setMapType={setMapType} />

        <TrailsMapLayers
          geojson={geojson}
          selectedTrail={selectedTrail}
          trackPreview={trackPreview}
          mapType={mapType}
        />

        {selectedTrail && (
          <TrailPopup
            selectedTrail={selectedTrail}
            clearTrailSelection={clearTrailSelection}
            getEffortLabel={(effort) => getEffortLabel(effort, labels)}
            labels={labels}
            locale={locale}
            trackLoading={trackLoading}
          />
        )}
      </Map>
    </div>
  );
}
