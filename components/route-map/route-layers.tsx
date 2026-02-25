'use client';

import { Source, Layer } from 'react-map-gl/maplibre';

interface RouteLayersProps {
  mapType: string;
  routeData: any;
  highlightedData: any;
  rangeHighlightData: any;
  activeFilter: any;
  selectedRange: any;
  noCoverageData?: any;
}

export function RouteLayers({
  mapType,
  routeData,
  highlightedData,
  rangeHighlightData,
  activeFilter,
  selectedRange,
  noCoverageData,
}: RouteLayersProps) {
  return (
    <>
      {routeData && (
        <Source id="route-source" type="geojson" data={routeData}>
          <Layer
            id="route-hover-target"
            type="line"
            paint={{
              'line-color': 'transparent',
              'line-width': 30, // Big hit area for mouse
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
          <Layer
            id="route-casing"
            type="line"
            paint={{
              'line-color': '#FFFFFF',
              'line-width': 8,
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
          <Layer
            id="route-base"
            type="line"
            paint={{
              'line-color': mapType === 'standard' ? '#1368CE' : '#ffffff',
              'line-width': 5,
              'line-opacity': activeFilter || selectedRange ? 0.3 : 1,
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />

          <Layer
            id="route-direction-arrows"
            type="symbol"
            layout={{
              'symbol-placement': 'line',
              'symbol-spacing': 80, // More frequent arrows
              'text-field': '>',
              'text-size': ['interpolate', ['linear'], ['zoom'], 10, 12, 18, 24],
              'text-keep-upright': false,
              'text-allow-overlap': true,
              'text-rotate': 0, // In line-placement, 0 is along the line
              'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            }}
            paint={{
              'text-color': mapType === 'standard' ? '#000' : '#ffffff',
              'text-opacity': activeFilter || selectedRange ? 0.4 : 1,
              'text-halo-color': mapType === 'standard' ? '#ffffff' : '#000000',
              'text-halo-width': 2,
            }}
          />
        </Source>
      )}

      {highlightedData && (
        <Source id="highlight-source" type="geojson" data={highlightedData}>
          <Layer
            id="highlight-glow"
            beforeId="route-direction-arrows"
            type="line"
            paint={{
              'line-color': '#4f86d1',
              'line-width': 8,
              'line-opacity': 0.4,
              'line-blur': 4,
            }}
          />
          <Layer
            id="highlight-line"
            beforeId="route-direction-arrows"
            type="line"
            paint={{
              'line-color': ['coalesce', ['get', 'color'], '#3ecf8e'],
              'line-width': 6,
              'line-opacity': 1,
            }}
          />
        </Source>
      )}

      {rangeHighlightData && !activeFilter && (
        <Source id="range-source" type="geojson" data={rangeHighlightData}>
          <Layer
            id="range-glow"
            type="line"
            paint={{
              'line-color': '#007aff',
              'line-width': 10,
              'line-opacity': 0.3,
              'line-blur': 6,
            }}
          />
          <Layer
            id="range-line"
            type="line"
            paint={{ 'line-color': '#007aff', 'line-width': 5, 'line-opacity': 1 }}
          />
        </Source>
      )}

      {noCoverageData && (
        <Source id="no-coverage-source" type="geojson" data={noCoverageData}>
          <Layer
            id="no-coverage-heat"
            type="heatmap"
            paint={{
              'heatmap-weight': ['coalesce', ['get', 'weight'], 1],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 0.4, 14, 1.5],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 12, 12, 20, 16, 35],
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0,   'rgba(0,0,0,0)',
                0.2, 'rgba(251,191,36,0.25)',
                0.5, 'rgba(245,158,11,0.55)',
                0.8, 'rgba(239,68,68,0.75)',
                1,   'rgba(185,28,28,0.9)',
              ],
              'heatmap-opacity': 0.85,
            }}
          />
        </Source>
      )}
    </>
  );
}
