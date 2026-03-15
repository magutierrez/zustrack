'use client';

import { useCallback, useEffect, useRef, RefObject, useState } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

export function useMapTerrain(
  mapRef: RefObject<MapRef | null>,
  mapStyle: any,
  isPlayerActive: boolean,
  enable3DTerrain: boolean,
) {
  const [terrainLoading, setTerrainLoading] = useState(false);
  const [terrainJustLoaded, setTerrainJustLoaded] = useState(false);
  const idleHandlerRef = useRef<(() => void) | null>(null);
  const justLoadedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const shouldEnable = isPlayerActive || enable3DTerrain;

    if (shouldEnable) {
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

      clearIdleHandler();
      setTerrainLoading(true);
      const handler = () => {
        setTerrainLoading(false);
        setTerrainJustLoaded(true);
        if (justLoadedTimerRef.current) clearTimeout(justLoadedTimerRef.current);
        justLoadedTimerRef.current = setTimeout(() => setTerrainJustLoaded(false), 700);
        idleHandlerRef.current = null;
      };
      idleHandlerRef.current = handler;
      map.once('idle', handler);
    } else {
      clearIdleHandler();
      setTerrainLoading(false);
      if (map.getTerrain()) map.setTerrain(null);
      if (map.getSource('terrain-dem')) map.removeSource('terrain-dem');
    }
  }, [mapRef, isPlayerActive, enable3DTerrain, clearIdleHandler]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const onStyleLoad = () => syncTerrain();
    map.on('style.load', onStyleLoad);

    if (map.isStyleLoaded()) syncTerrain();

    return () => {
      map.off('style.load', onStyleLoad);
    };
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
  }, [mapStyle, syncTerrain, mapRef]);

  useEffect(() => {
    return () => {
      clearIdleHandler();
      if (justLoadedTimerRef.current) clearTimeout(justLoadedTimerRef.current);
    };
  }, [clearIdleHandler]);

  return { syncTerrain, terrainLoading, terrainJustLoaded };
}
