'use client';

import { useCallback, useEffect, RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

export function useMapTerrain(mapRef: RefObject<MapRef | null>, mapStyle: any) {
  const syncTerrain = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.isStyleLoaded()) return;

    // if (!map.getSource('open-terrain')) {
    //   map.addSource('open-terrain', {
    //     type: 'raster-dem',
    //     tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
    //     encoding: 'terrarium',
    //     tileSize: 256,
    //     maxzoom: 14,
    //   });
    // }
    //
    // if (!map.getTerrain()) {
    //   map.setTerrain({ source: 'open-terrain', exaggeration: 1.5 });
    // }
  }, [mapRef]);

  useEffect(() => {
    syncTerrain();
  }, [mapStyle, syncTerrain]);

  return { syncTerrain };
}
