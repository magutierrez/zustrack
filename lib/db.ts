import Dexie, { Table } from 'dexie';
import type { Annotation } from '@/lib/types';

export interface SavedRoute {
  id: string;
  user_email: string;
  name: string;
  gpx_content: string;
  activity_type: 'cycling' | 'walking';
  distance: number;
  elevation_gain: number;
  elevation_loss: number;
  elevation_points?: number[]; // Added for mini-preview
  route_info?: string; // JSON-serialized pathData from /api/route-info
  annotations?: string; // JSON-serialized Annotation[]
  created_at: string;
}

class ZustrackDB extends Dexie {
  saved_routes!: Table<SavedRoute>;

  constructor() {
    super('ZustrackDB');
    this.version(1).stores({
      saved_routes: 'id, user_email, created_at', // Primary key and indexed props
    });
  }
}

export const db = new ZustrackDB();

export async function saveRouteToDb(
  userEmail: string,
  name: string,
  rawGpxContent: string,
  activityType: 'cycling' | 'walking',
  distance: number,
  elevationGain: number,
  elevationLoss: number,
): Promise<string | null> {
  let routeId: string;
  try {
    routeId = crypto.randomUUID();
  } catch (_) {
    // Fallback if crypto.randomUUID is not available (e.g., in some non-secure contexts)
    routeId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  if (!routeId) {
    return null;
  }

  try {
    await db.saved_routes.add({
      id: routeId,
      user_email: userEmail,
      name,
      gpx_content: rawGpxContent,
      activity_type: activityType,
      distance,
      elevation_gain: elevationGain,
      elevation_loss: elevationLoss,
      created_at: new Date().toISOString(),
    });
    return routeId;
  } catch (error) {
    console.error('Error saving route to DB:', error);
    return null;
  }
}

export async function getRouteFromDb(
  routeId: string,
  userIdentifier: string,
): Promise<{
  name: string;
  gpx_content: string;
  activity_type: 'cycling' | 'walking';
  distance: number;
  elevation_gain: number;
  elevation_loss: number;
} | null> {
  try {
    const route = await db.saved_routes.get(routeId);

    if (route && route.user_email === userIdentifier) {
      return {
        name: route.name,
        gpx_content: route.gpx_content,
        activity_type: route.activity_type,
        distance: route.distance || 0,
        elevation_gain: route.elevation_gain || 0,
        elevation_loss: route.elevation_loss || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting route from DB:', error);
    return null;
  }
}

export async function getRouteInfoFromDb(routeId: string): Promise<unknown[] | null> {
  try {
    const route = await db.saved_routes.get(routeId);
    if (route?.route_info) {
      return JSON.parse(route.route_info) as unknown[];
    }
    return null;
  } catch (error) {
    console.error('Error reading route info from DB:', error);
    return null;
  }
}

export async function saveRouteInfoToDb(routeId: string, pathData: unknown[]): Promise<void> {
  try {
    await db.saved_routes.update(routeId, { route_info: JSON.stringify(pathData) });
  } catch (error) {
    console.error('Error saving route info to DB:', error);
  }
}

export async function getAnnotationsFromDb(routeId: string): Promise<Annotation[]> {
  try {
    const route = await db.saved_routes.get(routeId);
    if (route?.annotations) {
      return JSON.parse(route.annotations) as Annotation[];
    }
    return [];
  } catch (error) {
    console.error('Error reading annotations from DB:', error);
    return [];
  }
}

export async function saveAnnotationsToDb(routeId: string, annotations: Annotation[]): Promise<void> {
  try {
    await db.saved_routes.update(routeId, { annotations: JSON.stringify(annotations) });
  } catch (error) {
    console.error('Error saving annotations to DB:', error);
  }
}
