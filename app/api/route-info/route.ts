import { NextRequest, NextResponse } from 'next/server';
import { calculateWaterReliability } from '@/lib/utils';
import { z } from 'zod';

interface Point {
  lat: number;
  lon: number;
}

const bodySchema = z.object({
  points: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
        distanceFromStart: z.number().optional(),
      }),
    )
    .min(1)
    .max(500),
  activityType: z.enum(['cycling', 'walking']).optional(),
});

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { points } = parsed.data;

    // 1. Calculate Bounding Box with buffer
    const lats = points.map((p) => p.lat);
    const lons = points.map((p) => p.lon);
    const minLat = Math.min(...lats) - 0.02; // ~2km buffer
    const maxLat = Math.max(...lats) + 0.02;
    const minLon = Math.min(...lons) - 0.02;
    const maxLon = Math.max(...lons) + 0.02;
    const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;

    // 2. Fetch OSM Data with Fallback
    const fetchOsmData = async () => {
      const overpassQuery = `[out:json][timeout:30];
        (
          way["highway"](${bbox});
          node["place"~"village|town|hamlet"](${bbox});
          way["highway"~"primary|secondary|tertiary"](${bbox});
          node["amenity"="drinking_water"](${bbox});
          node["natural"="spring"](${bbox});
          node["man_made"="water_tap"](${bbox});
          node["tourism"~"alpine_hut|wilderness_hut"](${bbox});
          way["tourism"~"alpine_hut|wilderness_hut"](${bbox});
        );
        out center;`;

      try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(overpassQuery)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'zustrackapp/1.0',
          },
        });

        if (response.ok) return await response.json();
        throw new Error(`Overpass failed with status: ${response.status}`);
      } catch (error) {
        console.error('Overpass API failed, trying Ohsome API fallback:', error);

        // Ohsome Fallback
        const ohsomeFilter =
          '(type:way and highway=*) or (type:node and place in (village, town, hamlet)) or (type:node and (amenity=drinking_water or natural=spring or man_made=water_tap)) or (tourism in (alpine_hut, wilderness_hut))';
        const ohsomeBbox = `${minLon},${minLat},${maxLon},${maxLat}`;
        const ohsomeUrl = `https://api.ohsome.org/v1/elements/centroid?bboxes=${ohsomeBbox}&filter=${encodeURIComponent(ohsomeFilter)}&properties=tags`;

        try {
          const response = await fetch(ohsomeUrl, {
            headers: { 'User-Agent': 'zustrackapp/1.0' },
          });

          if (response.ok) {
            const data = await response.json();
            return {
              elements: (data.features || []).map((f: any) => {
                // Extract tags from properties (Ohsome flattens them)
                const tags: any = f.properties.tags || {};
                if (Object.keys(tags).length === 0) {
                  Object.entries(f.properties).forEach(([k, v]) => {
                    if (!k.startsWith('@') && k !== 'tags') {
                      tags[k] = v;
                    }
                  });
                }

                return {
                  type: f.properties['@osmId']?.includes('way') ? 'way' : 'node',
                  center: {
                    lat: f.geometry.coordinates[1],
                    lon: f.geometry.coordinates[0],
                  },
                  lat: f.geometry.coordinates[1],
                  lon: f.geometry.coordinates[0],
                  tags,
                };
              }),
            };
          }
        } catch (ohsomeError) {
          console.error('Ohsome API fallback also failed:', ohsomeError);
        }
      }
      return { elements: [] };
    };

    // 3. OpenCellID Sampling: Query small areas around strategic points to stay within 4M sq.m limit
    const samplingInterval = Math.max(2, Math.floor(points.length / 8));
    const sampledPoints = points.filter((_, i) => i % samplingInterval === 0);

    const cellTowersPromises = process.env.OPENCELLID_API_KEY
      ? sampledPoints.map((p) => {
          const b = {
            minLat: p.lat - 0.008,
            maxLat: p.lat + 0.008,
            minLon: p.lon - 0.01,
            maxLon: p.lon + 0.01,
          };
          return fetch(
            `https://opencellid.org/cell/getInArea?key=${process.env.OPENCELLID_API_KEY}&BBOX=${b.minLat.toFixed(4)},${b.minLon.toFixed(4)},${b.maxLat.toFixed(4)},${b.maxLon.toFixed(4)}&format=json`,
          )
            .then((r) => (r.ok ? r.json() : { cells: [] }))
            .catch(() => ({ cells: [] }));
        })
      : [];

    const [osmData, elevationResponse, ...cellResponses] = await Promise.all([
      fetchOsmData(),
      fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${points.map((p) => p.lat).join(',')}&longitude=${points.map((p) => p.lon).join(',')}`,
      ),
      ...cellTowersPromises,
    ]);

    const elevationResponseJson = elevationResponse.ok
      ? await elevationResponse.json()
      : { elevation: [] };

    const allCellTowers = cellResponses.flatMap((r: any) => r.cells || []);
    const cellTowers = Array.from(
      new Map(allCellTowers.map((c: any) => [`${c.lat},${c.lon}`, c])).values(),
    );

    const elements = osmData.elements || [];
    const elevations = elevationResponseJson.elevation || [];

    const getDistSq = (p1: Point, p2: { lat: number; lon: number }) =>
      Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lon - p2.lon, 2)) * 111.32;

    const highwayElements = elements.filter((el: any) => el.tags?.highway);
    const escapeElements = elements.filter(
      (el: any) =>
        el.tags?.place ||
        (el.tags?.highway && ['primary', 'secondary'].includes(el.tags.highway)) ||
        (el.tags?.tourism && ['alpine_hut', 'wilderness_hut'].includes(el.tags.tourism)),
    );
    const waterElements = elements.filter(
      (el: any) =>
        el.tags?.amenity === 'drinking_water' ||
        el.tags?.natural === 'spring' ||
        el.tags?.man_made === 'water_tap',
    );

    const pathData = points.map((p, idx) => {
      let closestWay = null;
      let minWayDist = Infinity;
      let closestEscape: any = null;
      let minEscapeDist = Infinity;
      let nearbyInfraCount = 0;
      let minCellDist = Infinity;

      for (const element of highwayElements) {
        if (!element.center) continue;
        const dist = getDistSq(p, element.center);
        if (dist < 0.1 && dist < minWayDist) {
          minWayDist = dist;
          closestWay = element;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        if (dist < 3) nearbyInfraCount++;
      }

      if (cellTowers.length > 0) {
        for (const cell of cellTowers) {
          const dist = getDistSq(p, { lat: cell.lat, lon: cell.lon });
          if (dist < minCellDist) minCellDist = dist;
          if (minCellDist < 1) break;
        }
      }

      for (const element of escapeElements) {
        const center = element.center || { lat: element.lat, lon: element.lon };
        const dist = getDistSq(p, center);
        if (dist < 2.5 && dist < minEscapeDist) {
          minEscapeDist = dist;
          closestEscape = element;
        }
      }

      const tags = closestWay?.tags || {};
      const escapeTags = closestEscape?.tags || {};

      const waterSources: any[] = waterElements
        .map((el: any) => {
          const center = el.center || { lat: el.lat, lon: el.lon };
          const dist = getDistSq(p, center);
          if (dist > 1.5) return null;

          const isNatural = el.tags?.natural === 'spring';
          return {
            lat: center.lat,
            lon: center.lon,
            name: el.tags?.name || (isNatural ? 'Manantial' : 'Fuente'),
            type: isNatural ? 'natural' : 'urban',
            distanceFromRoute: Math.round(dist * 10) / 10,
            reliability: calculateWaterReliability(isNatural ? 'natural' : 'urban', new Date()),
          };
        })
        .filter(Boolean);

      let coverage: 'none' | 'low' | 'full' | 'unknown' = 'unknown';
      if (process.env.OPENCELLID_API_KEY && cellTowers.length > 0) {
        coverage = 'full';
        if (minCellDist > 5) coverage = 'none';
        else if (minCellDist > 2.5) coverage = 'low';
      }

      return {
        lat: p.lat,
        lon: p.lon,
        pathType: tags.highway,
        surface: tags.surface || (tags.highway === 'cycleway' ? 'asphalt' : undefined),
        elevation: elevations[idx] !== undefined ? Math.round(elevations[idx]) : 0,
        distanceFromStart: p.distanceFromStart,
        mobileCoverage: coverage,
        waterSources,
        escapePoint: closestEscape
          ? {
              lat: closestEscape.center?.lat || closestEscape.lat,
              lon: closestEscape.center?.lon || closestEscape.lon,
              name:
                escapeTags.name ||
                (escapeTags.tourism
                  ? 'Refugio'
                  : escapeTags.highway
                    ? 'Carretera principal'
                    : 'Núcleo urbano'),
              type: escapeTags.tourism ? 'shelter' : escapeTags.place ? 'town' : 'road',
              distanceFromRoute: Math.round(minEscapeDist * 10) / 10,
            }
          : undefined,
      };
    });

    return NextResponse.json({ pathData });
  } catch (error) {
    console.error('Route info error:', error);
    return NextResponse.json({ error: 'Failed to fetch route info' }, { status: 500 });
  }
}
