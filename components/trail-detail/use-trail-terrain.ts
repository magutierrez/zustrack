'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

const TERRAIN_SOURCE_ID = 'trail-terrain-dem';
const TERRAIN_TILES = [
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
];

export function useTrailTerrain(mapRef: RefObject<MapRef | null>, mapStyle: object, enable3D: boolean) {
  const [terrainLoading, setTerrainLoading] = useState(false);
  const idleHandlerRef = useRef<(() => void) | null>(null);

  const clearIdleHandler = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && idleHandlerRef.current) {
      map.off('idle', idleHandlerRef.current);
      idleHandlerRef.current = null;
    }
  }, [mapRef]);

  const syncTerrain = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.isStyleLoaded()) return;

    if (enable3D) {
      if (!map.getSource(TERRAIN_SOURCE_ID)) {
        map.addSource(TERRAIN_SOURCE_ID, {
          type: 'raster-dem',
          tiles: TERRAIN_TILES,
          tileSize: 256,
          maxzoom: 15,
          encoding: 'terrarium',
        } as Parameters<typeof map.addSource>[1]);
      }
      map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.5 });

      clearIdleHandler();
      setTerrainLoading(true);
      const handler = () => {
        setTerrainLoading(false);
        idleHandlerRef.current = null;
      };
      idleHandlerRef.current = handler;
      map.once('idle', handler);
    } else {
      clearIdleHandler();
      setTerrainLoading(false);
      if (map.getTerrain()) map.setTerrain(null);
      if (map.getSource(TERRAIN_SOURCE_ID)) map.removeSource(TERRAIN_SOURCE_ID);
    }
  }, [mapRef, enable3D, clearIdleHandler]);

  // Re-sync when style reloads (layer change)
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const onStyleLoad = () => syncTerrain();
    map.on('style.load', onStyleLoad);
    if (map.isStyleLoaded()) syncTerrain();
    return () => { map.off('style.load', onStyleLoad); };
  }, [mapRef, syncTerrain]);

  // Re-sync when mapStyle object or enable3D changes
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (map.isStyleLoaded()) {
      syncTerrain();
    } else {
      map.once('idle', syncTerrain);
      return () => { map.off('idle', syncTerrain); };
    }
  }, [mapStyle, syncTerrain, mapRef]);

  useEffect(() => {
    return () => {
      clearIdleHandler();
    };
  }, [clearIdleHandler]);

  return { terrainLoading };
}
