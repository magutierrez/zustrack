'use client';

import useSWR, { mutate } from 'swr';
import { db, SavedRoute } from '@/lib/db';

export type { SavedRoute };
import { useSession } from 'next-auth/react';
import { parseGPX, sampleRoutePoints } from '@/lib/gpx-parser';

const ROUTES_CACHE_KEY = 'local-saved-routes';

export function useSavedRoutes() {
  const { data: session } = useSession();
  const userIdentifier = session?.user?.email || session?.user?.id;

  const {
    data: routes = [],
    isLoading,
    error,
  } = useSWR(userIdentifier ? [ROUTES_CACHE_KEY, userIdentifier] : null, async ([, identifier]) => {
    try {
      // Fetch routes for the user, ordered by creation date (newest first)
      return await db.saved_routes
        .where('user_email')
        .equals(identifier)
        .reverse()
        .sortBy('created_at');
    } catch (e) {
      console.error('Error fetching routes:', e);
      return [];
    }
  });

  const saveRoute = async (
    name: string,
    content: string,
    activityType: 'cycling' | 'walking',
    distance: number,
    elevationGain: number,
    elevationLoss: number,
  ) => {
    if (!userIdentifier) return null;

    try {
      // Check if a route with same name and similar distance already exists for this user
      // We filter in memory because Dexie doesn't support complex SQL-like WHERE clauses directly
      // combined with index ranges in a simple way for this specific logic.
      const existing = await db.saved_routes
        .where('user_email')
        .equals(userIdentifier)
        .filter((r) => r.name === name && Math.abs(r.distance - distance) < 0.01)
        .first();

      if (existing) {
        return existing.id;
      }

      // Extract elevation points for preview
      let elevationPoints: number[] = [];
      try {
        const parsed = parseGPX(content);
        const sampled = sampleRoutePoints(parsed.points, 30);
        elevationPoints = sampled.map((p) => Math.round(p.ele || 0));
      } catch (e) {
        console.warn('Failed to extract elevation points for preview:', e);
      }

      let routeId: string;
      try {
        routeId = crypto.randomUUID();
      } catch (e) {
        routeId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }

      await db.saved_routes.add({
        id: routeId,
        user_email: userIdentifier,
        name,
        gpx_content: content,
        activity_type: activityType,
        distance,
        elevation_gain: elevationGain,
        elevation_loss: elevationLoss,
        elevation_points: elevationPoints,
        created_at: new Date().toISOString(),
      });

      await mutate([ROUTES_CACHE_KEY, userIdentifier]);
      return routeId;
    } catch (e) {
      console.error('Error saving route:', e);
      throw e;
    }
  };

  const deleteRoute = async (id: string) => {
    if (!userIdentifier) return;
    try {
      await db.saved_routes.delete(id);
      mutate([ROUTES_CACHE_KEY, userIdentifier]);
    } catch (e) {
      console.error('Error deleting route:', e);
    }
  };

  const updateRouteName = async (id: string, newName: string) => {
    if (!userIdentifier) return;
    try {
      await db.saved_routes.update(id, { name: newName });
      mutate([ROUTES_CACHE_KEY, userIdentifier]);
    } catch (e) {
      console.error('Error updating route name:', e);
    }
  };

  return {
    routes,
    isLoading: isLoading && !!userIdentifier,
    error,
    saveRoute,
    deleteRoute,
    updateRouteName,
    refresh: () => mutate([ROUTES_CACHE_KEY, userIdentifier]),
  };
}
