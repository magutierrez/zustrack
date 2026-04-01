'use client';

import { useMemo } from 'react';
import type { TrailMapLayerType } from '@/lib/types';

function rasterStyle(sourceId: string, tiles: string[], attribution: string) {
  return {
    version: 8 as const,
    sources: {
      [sourceId]: {
        type: 'raster' as const,
        tiles,
        tileSize: 256,
        attribution,
      },
    },
    layers: [
      {
        id: `${sourceId}-layer`,
        type: 'raster' as const,
        source: sourceId,
      },
    ],
  };
}

export function useTrailMapStyle(mapType: TrailMapLayerType) {
  return useMemo(() => {
    switch (mapType) {
      case 'ign-raster':
        return rasterStyle(
          'ign-raster',
          [
            'https://www.ign.es/wmts/mapa-raster?request=GetTile&service=WMTS&VERSION=1.0.0&Format=image/jpeg&layer=MTN&tilematrixset=GoogleMapsCompatible&TileMatrix={z}&TileRow={y}&TileCol={x}',
          ],
          '© Instituto Geográfico Nacional de España',
        );

      case 'ign-base':
        return rasterStyle(
          'ign-base',
          [
            'https://www.ign.es/wmts/ign-base?request=GetTile&service=WMTS&VERSION=1.0.0&Format=image/png&layer=IGNBaseTodo&tilematrixset=GoogleMapsCompatible&TileMatrix={z}&TileRow={y}&TileCol={x}',
          ],
          '© Instituto Geográfico Nacional de España',
        );

      case 'osm':
        return rasterStyle(
          'osm',
          ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        );

      case 'pnoa':
        return rasterStyle(
          'pnoa',
          [
            'https://www.ign.es/wmts/pnoa-ma?request=GetTile&service=WMTS&VERSION=1.0.0&Format=image/jpeg&layer=OI.OrthoimageCoverage&tilematrixset=GoogleMapsCompatible&TileMatrix={z}&TileRow={y}&TileCol={x}',
          ],
          '© PNOA - Instituto Geográfico Nacional de España',
        );

      case 'opentopomap':
        return rasterStyle(
          'opentopomap',
          ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
          'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
        );
    }
  }, [mapType]);
}
