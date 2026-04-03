#!/usr/bin/env node
/**
 * Step 3 — Enrich trails with Overpass OSM data
 *
 * Fills `dominant_surface`, `surface_breakdown`, `dominant_path_type`,
 * `path_type_breakdown`, `escape_points`, and `water_sources` for trails
 * that don't have them yet.
 *
 * Usage:
 *   node scripts/step3-osm.mjs --country es [--dry-run] [--limit N] [--force]
 *
 * Flags:
 *   --country   Country code to process (default: es)
 *   --dry-run   Print what would be updated without writing to Supabase
 *   --limit N   Process at most N trails
 *   --force     Re-enrich trails that already have OSM data
 *
 * Required env vars (from .env.local):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createSupabase, parseCLIArgs, sleep } from './lib.mjs';

const { country, limit, dryRun, force } = parseCLIArgs();
const PAGE_SIZE = 500;

// ---------------------------------------------------------------------------
// Overpass enrichment
// ---------------------------------------------------------------------------

async function fetchOsmEnrichment(bbox, trackProfile) {
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

  let elements = [];
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'zustrackapp/1.0',
      },
      signal: AbortSignal.timeout(35000),
    });
    if (response.ok) {
      const data = await response.json();
      elements = data.elements || [];
    }
  } catch (err) {
    console.warn(`    ⚠  Overpass error: ${err.message}`);
    return null;
  }

  // Fast distance approximation (same as route-info API)
  const distKm = (p1, p2) =>
    Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2)) * 111.32;

  const highwayEls = elements.filter((el) => el.tags?.highway);
  const escapeEls  = elements.filter(
    (el) =>
      el.tags?.place ||
      (el.tags?.highway && ['primary', 'secondary'].includes(el.tags.highway)) ||
      (el.tags?.tourism && ['alpine_hut', 'wilderness_hut'].includes(el.tags.tourism)),
  );
  const waterEls = elements.filter(
    (el) =>
      el.tags?.amenity === 'drinking_water' ||
      el.tags?.natural === 'spring' ||
      el.tags?.man_made === 'water_tap',
  );

  // --- Surface and path type breakdown ---
  const surfaceCounts   = {};
  const pathTypeCounts  = {};
  let matchedPoints = 0;

  for (const tp of trackProfile) {
    let bestDist = Infinity;
    let bestEl   = null;
    for (const el of highwayEls) {
      if (!el.center) continue;
      const d = distKm(tp, el.center);
      if (d < 0.1 && d < bestDist) {
        bestDist = d;
        bestEl   = el;
      }
    }
    if (bestEl) {
      matchedPoints++;
      const surface  = bestEl.tags.surface || (bestEl.tags.highway === 'cycleway' ? 'asphalt' : 'unknown');
      const pathType = bestEl.tags.highway || 'unknown';
      surfaceCounts[surface]    = (surfaceCounts[surface]    || 0) + 1;
      pathTypeCounts[pathType]  = (pathTypeCounts[pathType]  || 0) + 1;
    }
  }

  let dominantSurface = null, surfaceBreakdown  = null;
  let dominantPathType = null, pathTypeBreakdown = null;

  if (matchedPoints > 0) {
    const toBreakdown = (counts) => {
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return Object.fromEntries(sorted.map(([k, v]) => [k, Math.round((v / matchedPoints) * 100)]));
    };
    surfaceBreakdown  = toBreakdown(surfaceCounts);
    dominantSurface   = Object.entries(surfaceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    pathTypeBreakdown = toBreakdown(pathTypeCounts);
    dominantPathType  = Object.entries(pathTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  // --- Escape points (deduplicated, max 5) ---
  const seenEscape  = new Set();
  const escapePoints = [];
  for (const tp of trackProfile) {
    for (const el of escapeEls) {
      const center = el.center || { lat: el.lat, lon: el.lon };
      if (!center) continue;
      const d = distKm(tp, { lat: center.lat, lng: center.lon });
      if (d > 2.5) continue;
      const key = `${Math.round(center.lat * 100)},${Math.round((center.lon ?? center.lng) * 100)}`;
      if (seenEscape.has(key)) continue;
      seenEscape.add(key);
      const tags = el.tags || {};
      escapePoints.push({
        lat: center.lat,
        lng: center.lon ?? center.lng,
        name:
          tags.name ||
          (tags.tourism ? 'Refugio' : tags.highway ? 'Carretera principal' : 'Núcleo urbano'),
        type:               tags.tourism ? 'shelter' : tags.place ? 'town' : 'road',
        distanceFromRoute:  Math.round(d * 10) / 10,
      });
      if (escapePoints.length >= 5) break;
    }
    if (escapePoints.length >= 5) break;
  }

  // --- Water sources (deduplicated, max 10) ---
  const seenWater  = new Set();
  const waterSources = [];
  for (const tp of trackProfile) {
    for (const el of waterEls) {
      const center = el.center || { lat: el.lat, lon: el.lon };
      if (!center) continue;
      const d = distKm(tp, { lat: center.lat, lng: center.lon });
      if (d > 1.5) continue;
      const key = `${Math.round(center.lat * 100)},${Math.round((center.lon ?? center.lng) * 100)}`;
      if (seenWater.has(key)) continue;
      seenWater.add(key);
      const isNatural = el.tags?.natural === 'spring';
      waterSources.push({
        lat: center.lat,
        lng: center.lon ?? center.lng,
        name:              el.tags?.name || (isNatural ? 'Manantial' : 'Fuente'),
        type:              isNatural ? 'natural' : 'urban',
        distanceFromRoute: Math.round(d * 10) / 10,
        reliability:       isNatural ? 'medium' : 'high',
      });
      if (waterSources.length >= 10) break;
    }
    if (waterSources.length >= 10) break;
  }

  return {
    dominant_surface:    dominantSurface,
    surface_breakdown:   surfaceBreakdown,
    dominant_path_type:  dominantPathType,
    path_type_breakdown: pathTypeBreakdown,
    escape_points:       escapePoints.length > 0 ? escapePoints  : null,
    water_sources:       waterSources.length  > 0 ? waterSources : null,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🗺️  Step 3 — OSM Enrichment (Overpass)');
  console.log(`   Country  : ${country}`);
  console.log(`   Dry run  : ${dryRun}`);
  console.log(`   Limit    : ${limit ?? 'all'}`);
  console.log(`   Force    : ${force}\n`);

  // Load trails that need enrichment
  console.log('   Loading trails from Supabase...');
  const sb = createSupabase();
  const trails = [];
  let from = 0;

  while (true) {
    let q = sb
      .from('trails')
      .select('id, bbox_min_lat, bbox_min_lng, bbox_max_lat, bbox_max_lng, track_profile')
      .eq('country', country)
      .range(from, from + PAGE_SIZE - 1);

    if (!force) {
      // Only pick up trails missing ALL three OSM enrichment columns
      q = q.is('dominant_surface', null).is('escape_points', null).is('water_sources', null);
    }

    const { data, error } = await q;
    if (error) { console.error('Failed to load trails:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    trails.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const toProcess = limit ? trails.slice(0, limit) : trails;
  console.log(`   Trails to enrich: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log('✅ Nothing to do. Use --force to re-enrich existing trails.');
    return;
  }

  let success = 0, errors = 0, nullData = 0;
  const writer = dryRun ? null : createSupabase();

  for (let i = 0; i < toProcess.length; i++) {
    const trail = toProcess[i];
    const { bbox_min_lat, bbox_min_lng, bbox_max_lat, bbox_max_lng, track_profile } = trail;

    if (!bbox_min_lat || !track_profile || track_profile.length === 0) {
      console.warn(`  ⚠  id=${trail.id}: missing bbox or track_profile — skipped`);
      errors++;
      await sleep(1100);
      continue;
    }

    const bbox = `${bbox_min_lat},${bbox_min_lng},${bbox_max_lat},${bbox_max_lng}`;

    try {
      const osmData = await fetchOsmEnrichment(bbox, track_profile);

      if (!osmData) {
        // Overpass returned an error — skip, will retry next run
        errors++;
        await sleep(1100);
        continue;
      }

      const allNull =
        !osmData.dominant_surface &&
        !osmData.escape_points &&
        !osmData.water_sources;
      if (allNull) nullData++;

      if (dryRun) {
        console.log(
          `  [dry-run] id=${trail.id} → surface="${osmData.dominant_surface}" ` +
          `escapes=${osmData.escape_points?.length ?? 0} ` +
          `water=${osmData.water_sources?.length ?? 0}`,
        );
        success++;
      } else {
        const { error } = await writer
          .from('trails')
          .update(osmData)
          .eq('id', trail.id);

        if (error) {
          console.error(`  ✗  id=${trail.id}: ${error.message}`);
          errors++;
        } else {
          success++;
        }
      }
    } catch (err) {
      console.error(`  ✗  id=${trail.id}: ${err.message}`);
      errors++;
    }

    await sleep(1100); // Overpass rate limit: ~1 req/s

    if ((i + 1) % 50 === 0) {
      console.log(`  ⏳ Enriched ${i + 1}/${toProcess.length}...`);
    }
  }

  console.log('\n✅ Done!');
  console.log(`   Success        : ${success}`);
  console.log(`   No OSM data    : ${nullData}  (remote trails with no nearby OSM features)`);
  console.log(`   Errors         : ${errors}`);
  if (dryRun) console.log('\n   Run without --dry-run to write to Supabase.');
  console.log('\n🏁 All steps complete! Run step2/step3 again without --force to fill any gaps.');
}

main();
