'use client';

import { useMemo } from 'react';

export type MapLayerType = 'standard' | 'satellite' | 'hybrid' | 'topography';

export function useMapStyle(mapType: MapLayerType, resolvedTheme: string | undefined) {
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  return useMemo(() => {
    if (mapType === 'standard') {
      return `https://api.maptiler.com/maps/019c8145-75e2-716d-a93a-c5165bc0a7ad/style.json?key=${maptilerKey}`;
    }

    if (mapType === 'topography') {
      return {
        version: 8,
        sources: {
          opentopo: {
            type: 'raster',
            tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution:
              'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
          },
        },
        layers: [
          {
            id: 'topography-layer',
            type: 'raster',
            source: 'opentopo',
          },
        ],
      };
    }

    return {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri',
        },
        'esri-labels': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'satellite',
          type: 'raster',
          source: 'esri-satellite',
        },
        ...(mapType === 'hybrid'
          ? [
              {
                id: 'labels',
                type: 'raster',
                source: 'esri-labels',
                paint: { 'raster-opacity': 0.8 },
              },
            ]
          : []),
      ],
    };
  }, [resolvedTheme, mapType]);
}
