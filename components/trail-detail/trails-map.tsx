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
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, Point, LineString } from 'geojson';
import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import Link from 'next/link';
import type { TrailSearchParams } from '@/lib/trails';
import { transformRequest } from '@/lib/map-transform';
import type { TrailMapLayerType } from '@/lib/types';
import { useTrailMapStyle } from './use-trail-map-style';
import { TrailLayerControl } from './trail-layer-control';


const EFFORT_COLORS: Record<string, string> = {
  easy: '#10b981',
  moderate: '#0ea5e9',
  hard: '#f59e0b',
  very_hard: '#f43f5e',
};

interface PopupInfo {
  lng: number;
  lat: number;
  name: string;
  trail_code: string | null;
  distance_km: number;
  effort_level: string;
  slug: string;
  country: string;
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
  };
}

function buildGeoUrl(sp: TrailSearchParams): string {
  const params = new URLSearchParams();
  if (sp.q) params.set('q', sp.q);
  if (sp.effort) params.set('effort', sp.effort);
  if (sp.type) params.set('type', sp.type);
  if (sp.shape) params.set('shape', sp.shape);
  if (sp.child) params.set('child', sp.child);
  if (sp.pet) params.set('pet', sp.pet);
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
}

export function TrailsMap({ searchParams, locale, labels }: TrailsMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapType, setMapType] = useState<TrailMapLayerType>('ign-raster');
  const mapStyle = useTrailMapStyle(mapType);
  const [geojson, setGeojson] = useState<FeatureCollection<Point> | null>(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [trackPreview, setTrackPreview] = useState<TrackPreview | null>(null);
  const [cursor, setCursor] = useState<string>('grab');

  // Fetch GeoJSON whenever filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPopup(null);
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
    setPopup(null);
    setTrackPreview(null);
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

        setPopup({
          lng: coords[0],
          lat: coords[1],
          name: props.name as string,
          trail_code: props.trail_code as string | null,
          distance_km: props.distance_km as number,
          effort_level: effortLevel,
          slug: props.slug as string,
          country: props.country as string,
        });
        setTrackPreview(null);

        // Fetch track preview and zoom to trail bounds
        fetch(`/api/trails/${props.id as number}/track`)
          .then((r) => r.json())
          .then(
            (data: {
              coordinates: [number, number][];
              bbox: [number, number, number, number] | null;
            }) => {
              if (data.coordinates.length >= 2) {
                setTrackPreview({
                  color: EFFORT_COLORS[effortLevel] ?? '#94a3b8',
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
                  { padding: 60, maxZoom: 14, duration: 700 },
                );
              } else {
                mapRef.current?.flyTo({ center: coords, zoom: 13, duration: 600 });
              }
            },
          )
          .catch(() => {
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
              paint={{ 'text-color': '#ffffff' }}
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
              }}
            />
          </Source>
        )}

        {/* Trail track preview — shown on click */}
        {trackPreview && (
          <Source id="track-preview" type="geojson" data={trackPreview.geojson}>
            <Layer
              id="track-preview-shadow"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#000000', 'line-width': 5, 'line-opacity': 0.12 }}
            />
            <Layer
              id="track-preview-line"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': trackPreview.color, 'line-width': 3, 'line-opacity': 0.85 }}
            />
          </Source>
        )}

        {popup && (
          <Popup
            longitude={popup.lng}
            latitude={popup.lat}
            anchor="bottom"
            onClose={clearTrailSelection}
            closeButton={false}
            maxWidth="260px"
          >
            <div className="p-2 text-slate-900 dark:text-white">
              <div className="mb-1 flex items-center gap-2">
                {popup.trail_code && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundColor: EFFORT_COLORS[popup.effort_level] ?? '#94a3b8' }}
                  >
                    {popup.trail_code}
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {getEffortLabel(popup.effort_level, labels)}
                </span>
              </div>
              <p className="mb-1 text-sm leading-snug font-semibold">{popup.name}</p>
              <p className="mb-2 text-xs text-slate-500">
                {popup.distance_km.toFixed(1)} {labels.km}
              </p>
              <Link
                href={`/${locale}/trail/${popup.country}/${popup.slug}`}
                className="block rounded-md bg-slate-900 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {labels.viewTrail}
              </Link>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
