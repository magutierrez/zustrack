'use client';

import { useCallback, useEffect, useRef, RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

export function useMapTerrain(
  mapRef: RefObject<MapRef | null>,
  mapStyle: any,
  isPlayerActive: boolean,
) {
  const isPlayerActiveRef = useRef(isPlayerActive);
  isPlayerActiveRef.current = isPlayerActive;

  const syncTerrain = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.isStyleLoaded()) return;

    if (isPlayerActiveRef.current) {
      const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
      if (!map.getSource('terrain-dem')) {
        map.addSource('terrain-dem', {
          type: 'raster-dem',
          url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`,
          tileSize: 256,
          maxzoom: 12,
        });
      }
      map.setTerrain({ source: 'terrain-dem', exaggeration: 1 });
    } else {
      if (map.getTerrain()) map.setTerrain(null);
      if (map.getSource('terrain-dem')) map.removeSource('terrain-dem');
    }
  }, [mapRef]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const onStyleLoad = () => syncTerrain();
    map.on('style.load', onStyleLoad);

    if (map.isStyleLoaded()) syncTerrain();

    return () => {
      map.off('style.load', onStyleLoad);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef, syncTerrain]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (map.isStyleLoaded()) {
      syncTerrain();
    } else {
      map.once('idle', syncTerrain);
      return () => {
        map.off('idle', syncTerrain);
      };
    }
  }, [mapStyle, isPlayerActive, syncTerrain, mapRef]);

  return { syncTerrain };
}
