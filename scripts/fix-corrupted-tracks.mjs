#!/usr/bin/env node
/**
 * Fix Corrupted Tracks Script
 *
 * Instead of deleting trails with straight lines (large gaps), this script:
 * 1. Detects gaps in the track profile.
 * 2. Splits the track into continuous segments.
 * 3. Keeps only the LONGEST segment.
 * 4. Recalculates all metrics (distance, elevation, difficulty, etc.).
 * 5. Updates Supabase.
 *
 * Usage:
 *   node scripts/fix-corrupted-tracks.mjs [--dry-run] [--country it] [--threshold 0.5] [--id 12345]
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const hasFlag = (flag) => args.includes(flag);

const DRY_RUN = hasFlag('--dry-run');
const COUNTRY = getArg('--country');
const ID = getArg('--id');
const THRESHOLD = getArg('--threshold') ? parseFloat(getArg('--threshold')) : 0.5; // 500m default
const PAGE_SIZE = 500;

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

// ---------------------------------------------------------------------------
// Helpers (adapted from importer)
// ---------------------------------------------------------------------------

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeSlopeBreakdown(trackProfile) {
  if (!trackProfile || trackProfile.length < 2) return null;
  let flat = 0, gentle = 0, steep = 0, extreme = 0, total = 0;
  for (let i = 1; i < trackProfile.length; i++) {
    const prev = trackProfile[i - 1];
    const curr = trackProfile[i];
    const segDistKm = curr.d - prev.d;
    if (segDistKm <= 0) continue;
    total += segDistKm;
    if (prev.e !== null && curr.e !== null) {
      const slopePct = Math.abs((curr.e - prev.e) / (segDistKm * 1000)) * 100;
      if (slopePct <= 1) flat += segDistKm;
      else if (slopePct <= 5) gentle += segDistKm;
      else if (slopePct <= 10) steep += segDistKm;
      else extreme += segDistKm;
    } else {
      flat += segDistKm;
    }
  }
  if (total === 0) return null;
  return {
    flat:    Math.round((flat    / total) * 100),
    gentle:  Math.round((gentle  / total) * 100),
    steep:   Math.round((steep   / total) * 100),
    extreme: Math.round((extreme / total) * 100),
  };
}

function recalculateMetrics(points) {
  if (points.length < 2) return null;

  let distanceKm = 0, elevGain = 0, elevLoss = 0, maxSlope = 0;
  const eles = points.map(p => p.e).filter(e => e !== null);

  const newProfile = [{ ...points[0], d: 0 }];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const segDistKm = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
    distanceKm += segDistKm;
    
    if (prev.e !== null && curr.e !== null) {
      const diff = curr.e - prev.e;
      if (diff > 2) elevGain += diff;
      else if (diff < -2) elevLoss += Math.abs(diff);
      if (segDistKm > 0.001) {
        const slopePct = Math.abs((diff / (segDistKm * 1000)) * 100);
        if (slopePct < 150 && slopePct > maxSlope) maxSlope = slopePct;
      }
    }
    newProfile.push({ ...curr, d: Math.round(distanceKm * 1000) / 1000 });
  }

  const elevMax = eles.length ? Math.max(...eles) : null;
  const elevMin = eles.length ? Math.min(...eles) : null;
  const avgElev = eles.length ? eles.reduce((a, b) => a + b, 0) / eles.length : null;

  const distScore  = Math.min(1, distanceKm / 40) * 40;
  const gainScore  = Math.min(1, elevGain    / 2000) * 40;
  const slopeScore = Math.min(1, maxSlope    / 50) * 20;
  const difficultyScore = Math.round((distScore + gainScore + slopeScore) * 10) / 10;

  let effortLevel;
  if (difficultyScore < 25) effortLevel = 'easy';
  else if (difficultyScore < 50) effortLevel = 'moderate';
  else if (difficultyScore < 75) effortLevel = 'hard';
  else effortLevel = 'very_hard';

  return {
    distance_km: Math.round(distanceKm * 100) / 100,
    elevation_gain_m: Math.round(elevGain),
    elevation_loss_m: Math.round(elevLoss),
    elevation_max_m: elevMax !== null ? Math.round(elevMax * 10) / 10 : null,
    elevation_min_m: elevMin !== null ? Math.round(elevMin * 10) / 10 : null,
    avg_elevation_m: avgElev !== null ? Math.round(avgElev) : null,
    max_slope_pct: Math.round(maxSlope * 10) / 10,
    difficulty_score: difficultyScore,
    effort_level: effortLevel,
    estimated_duration_min: Math.round((distanceKm / 4) * 60 + elevGain / 10),
    child_friendly: distanceKm <= 8 && elevGain <= 300 && maxSlope <= 20,
    pet_friendly: distanceKm <= 15 && elevGain <= 600,
    slope_breakdown: computeSlopeBreakdown(newProfile),
    track_profile: newProfile,
    start_lat: newProfile[0].lat,
    start_lng: newProfile[0].lng,
    end_lat: newProfile[newProfile.length - 1].lat,
    end_lng: newProfile[newProfile.length - 1].lng,
  };
}

async function main() {
  console.log(`\n🛠️  Fix Corrupted Tracks (Split & Keep Longest)`);
  console.log(`   Threshold : > ${THRESHOLD} km gap`);
  if (ID) console.log(`   Target ID : ${ID}`);
  if (COUNTRY) console.log(`   Country   : ${COUNTRY}`);
  console.log(`   Dry run   : ${DRY_RUN}\n`);

  let from = 0;
  let fixedCount = 0;

  while (true) {
    let query = supabase
      .from('trails')
      .select('*')
      .not('track_profile', 'is', null)
      .order('id')
      .range(from, from + PAGE_SIZE - 1);

    if (ID) query = query.eq('id', ID);
    if (COUNTRY) query = query.eq('country', COUNTRY);

    const { data: trails, error } = await query;
    if (error) { console.error('Fetch error:', error.message); break; }
    if (!trails || trails.length === 0) break;

    for (const trail of trails) {
      const profile = trail.track_profile;
      if (!profile || profile.length < 2) continue;

      const segments = [];
      let currentSegment = [profile[0]];

      for (let i = 1; i < profile.length; i++) {
        const prev = profile[i - 1];
        const curr = profile[i];
        const gap = curr.d - prev.d;

        if (gap > THRESHOLD) {
          segments.push(currentSegment);
          currentSegment = [curr];
        } else {
          currentSegment.push(curr);
        }
      }
      segments.push(currentSegment);

      if (segments.length > 1) {
        console.log(`Trail ${trail.id} (${trail.slug}): Found ${segments.length} segments.`);
        
        // Find longest segment by distance
        let longestIdx = 0;
        let maxDist = 0;
        
        segments.forEach((seg, idx) => {
          if (seg.length < 2) return;
          const d = seg[seg.length - 1].d - seg[0].d;
          console.log(`  Seg ${idx}: ${seg.length} pts, ${d.toFixed(2)} km`);
          if (d > maxDist) {
            maxDist = d;
            longestIdx = idx;
          }
        });

        const bestSegment = segments[longestIdx];
        console.log(`  ✅ Keeping Segment ${longestIdx} (${maxDist.toFixed(2)} km)`);

        if (!DRY_RUN) {
          const updates = recalculateMetrics(bestSegment);
          if (updates) {
            const { error: updateError } = await supabase
              .from('trails')
              .update(updates)
              .eq('id', trail.id);
            
            if (updateError) {
              console.error(`  ✗ Update error: ${updateError.message}`);
            } else {
              console.log(`  💾 Updated in database.`);
              fixedCount++;
            }
          }
        } else {
          fixedCount++;
        }
      }
    }

    if (ID) break; // Single ID mode
    if (trails.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`\n✅ Done! Fixed ${fixedCount} trail(s).`);
}

main().catch(console.error);
