'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { Session } from 'next-auth';
import { parseHashPayload, decodeSharedRoute } from '@/lib/route-sharing';
import { getRouteFromDb } from '@/lib/db';
import { useRouteStore } from '@/store/route-store';

export function useSharedRouteLoader(
  session: Session | null,
  routeId: string | null,
  skipSetupRedirect = false,
) {
  const router = useRouter();
  const gpxData = useRouteStore((s) => s.gpxData);
  const {
    setGpxData,
    setGpxFileName,
    setFetchedRoute,
    setLockedMetrics,
    setSavedRouteId,
    setRecalculatedTotalDistance,
    setRecalculatedElevationGain,
    setRecalculatedElevationLoss,
  } = useRouteStore();

  const [hashPayload, setHashPayload] = useState<ReturnType<typeof parseHashPayload>>(null);

  // Parse the hash fragment on the client (fragments never reach the server)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHashPayload(parseHashPayload());
  }, []);

  // Load shared route from the decompressed hash payload
  useEffect(() => {
    if (!hashPayload || gpxData) return;
    try {
      const decoded = decodeSharedRoute(hashPayload);
      if (decoded.points.length < 2) return;

      // Lock the original metrics so the recalculation pipeline cannot overwrite them
      setLockedMetrics({ distance: hashPayload.td, gain: hashPayload.tg, loss: hashPayload.tl });
      setRecalculatedTotalDistance(hashPayload.td);
      setRecalculatedElevationGain(hashPayload.tg);
      setRecalculatedElevationLoss(hashPayload.tl);

      // Set gpxData after locking so useRouteAnalysis effects see the lock immediately
      setGpxData(decoded);
      setGpxFileName(decoded.name);

      // Propagate activity type so fetchedActivityType is set in the store
      setFetchedRoute({
        rawGpxContent: '',
        gpxFileName: decoded.name,
        activityType: (hashPayload.a as 'cycling' | 'walking') || 'cycling',
        distance: hashPayload.td,
        elevationGain: hashPayload.tg,
        elevationLoss: hashPayload.tl,
      });
    } catch (err) {
      console.error('Error decoding shared route:', err);
    }
  }, [
    hashPayload,
    gpxData,
    setGpxData,
    setGpxFileName,
    setFetchedRoute,
    setLockedMetrics,
    setRecalculatedTotalDistance,
    setRecalculatedElevationGain,
    setRecalculatedElevationLoss,
  ]);

  // Fetch route data from DB (skip when loading from shared hash).
  // We check window.location.hash directly (synchronous) instead of relying on the
  // hashPayload state, which is set in a separate useEffect and would be null on the
  // first render — causing a redirect race condition.
  useEffect(() => {
    if (window.location.hash.startsWith('#route=')) return;
    const userIdentifier = session?.user?.email || session?.user?.id;
    if (routeId && userIdentifier) {
      const fetchRoute = async () => {
        const route = await getRouteFromDb(routeId, userIdentifier);
        if (route) {
          setSavedRouteId(routeId);
          setFetchedRoute({
            rawGpxContent: route.gpx_content,
            gpxFileName: route.name,
            activityType: route.activity_type,
            distance: route.distance,
            elevationGain: route.elevation_gain,
            elevationLoss: route.elevation_loss,
          });
        } else {
          router.replace('/app/setup');
        }
      };
      fetchRoute();
    } else if (!routeId && !skipSetupRedirect) {
      router.replace('/app/setup');
    }
  }, [routeId, skipSetupRedirect, session?.user?.email, session?.user?.id, setSavedRouteId, setFetchedRoute, router]);

  return {
    activityFromHash: (hashPayload?.a as 'cycling' | 'walking') ?? null,
  };
}
