'use client';

import { Layer, Source } from 'react-map-gl/maplibre';
import type { FeatureCollection, Point } from 'geojson';
import { EFFORT_COLORS } from './trails-map-constants';
import { SelectedTrailInfo } from './trail-popup';

interface TrailsMapLayersProps {
  geojson: FeatureCollection<Point> | null;
  selectedTrail: SelectedTrailInfo | null;
  trackPreview: {
    geojson: FeatureCollection;
    gradientStops: (string | number)[];
  } | null;
  mapType: string;
}

export function TrailsMapLayers({
  geojson,
  selectedTrail,
  trackPreview,
  mapType,
}: TrailsMapLayersProps) {
  return (
    <>
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
          <Layer
            id="track-preview-direction-arrows"
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
              'icon-opacity': 0.6,
            }}
          />
        </Source>
      )}
    </>
  );
}
