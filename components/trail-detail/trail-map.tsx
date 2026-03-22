'use client';

import Map, { NavigationControl, Source, Layer, Marker } from 'react-map-gl/maplibre';
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
}

const MAP_STYLE = `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;

/** Build color-stop stops for MapLibre line-gradient from slope values */
function buildGradientStops(points: TrackPoint[]): (string | number)[] {
  if (points.length < 2) return [0, '#10b981'];
  const totalDist = points[points.length - 1].d;
  if (totalDist === 0) return [0, '#10b981'];

  const stops: (string | number)[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const progress = p.d / totalDist;
    let slope = 0;
    if (i > 0) {
      const prev = points[i - 1];
      const distM = haversineDistance(prev.lat, prev.lng, p.lat, p.lng) * 1000;
      if (distM > 1 && prev.e !== null && p.e !== null) {
        slope = ((p.e - prev.e) / distM) * 100;
      }
    }
    stops.push(Math.min(1, Math.max(0, progress)), getSlopeColorHex(slope));
  }
  return stops;
}

export default function TrailMap({ trackProfile, name, isCircular }: TrailMapProps) {
  // Build GeoJSON from track profile
  const totalDist = trackProfile.length > 0 ? trackProfile[trackProfile.length - 1].d : 0;
  const coordinates = trackProfile.map((p) => [p.lng, p.lat]);
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      },
    ],
  };

  // Gradient stops for slope coloring
  const gradientStops = buildGradientStops(trackProfile);

  // Compute initial bounds
  const lats = trackProfile.map((p) => p.lat);
  const lngs = trackProfile.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const initialViewState = {
    longitude: (minLng + maxLng) / 2,
    latitude: (minLat + maxLat) / 2,
    zoom: 10,
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: 320 }}
        mapStyle={MAP_STYLE}
        onLoad={(e) => {
          // Fit to trail bounds with padding
          e.target.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            { padding: 40, duration: 0 },
          );
        }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        <Source id="trail" type="geojson" data={geojson} lineMetrics>
          {/* Shadow for legibility */}
          <Layer
            id="trail-shadow"
            type="line"
            source="trail"
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{ 'line-color': '#000', 'line-width': 7, 'line-opacity': 0.15 }}
          />
          {/* Slope-colored line using line-gradient */}
          <Layer
            id="trail-line"
            type="line"
            source="trail"
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{
              'line-width': 4,
              'line-gradient': [
                'interpolate',
                ['linear'],
                ['line-progress'],
                ...gradientStops,
              ],
            }}
          />
        </Source>

        {/* Start marker */}
        {trackProfile.length > 0 && (
          <StartEndMarker
            lng={trackProfile[0].lng}
            lat={trackProfile[0].lat}
            color="#10b981"
            label="S"
          />
        )}

        {/* End marker (only for linear routes) */}
        {!isCircular && trackProfile.length > 1 && (
          <StartEndMarker
            lng={trackProfile[trackProfile.length - 1].lng}
            lat={trackProfile[trackProfile.length - 1].lat}
            color="#ef4444"
            label="E"
          />
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

// Simple dot marker for start/end points
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
