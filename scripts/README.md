# Scripts

All scripts require the following env vars. The easiest way to load them is:

```bash
export $(grep -v '^#' .env.local | xargs)
```

Required vars:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## GPX Import Pipeline (recommended)

The import is split into three independent, resumable steps. Run them in order.

### Step 1 — Parse & import GPX files

```bash
node scripts/step1-import-gpx.mjs --dir ./gpx_trails --country es
```

Parses all `.gpx` files in `--dir`, computes trail metrics locally (distance, elevation gain/loss, slope, difficulty, track profile, etc.) and batch-upserts them into the `trails` table. No external APIs are called — ~1 000 trails in under 30 s.

Leaves `region`, `place`, `dominant_surface`, `surface_breakdown`, `dominant_path_type`, `path_type_breakdown`, `escape_points`, and `water_sources` as `null` (filled by steps 2 and 3).

| Flag | Description |
|------|-------------|
| `--dir ./gpx_trails` | Directory containing `.gpx` files (default: `./gpx_trails`) |
| `--country es` | Country code stored in every row (default: `es`) |
| `--dry-run` | Print the first 5 parsed rows without writing to Supabase |
| `--limit N` | Process at most N files |
| `--skip-existing` | Skip files whose numeric ID already exists in Supabase |

---

### Step 2 — Reverse-geocode (Nominatim)

```bash
node scripts/step2-geocode.mjs --country es
```

Reads trails where `region IS NULL`, calls Nominatim reverse geocoding for each trail's start point, and updates `region` (state/province) and `place` (municipality). Sleeps 1 100 ms between requests to respect Nominatim's 1 req/s rate limit.

Resumable: re-running without `--force` skips already geocoded trails.

| Flag | Description |
|------|-------------|
| `--country es` | Only process trails with this country code (default: `es`) |
| `--dry-run` | Print geocoding results without writing to Supabase |
| `--limit N` | Process at most N trails |
| `--force` | Re-geocode trails that already have `region`/`place` |

---

### Step 3 — OSM enrichment (Overpass)

```bash
node scripts/step3-osm.mjs --country es
```

Reads trails where `dominant_surface`, `escape_points`, and `water_sources` are all `null`, queries the Overpass API for each trail's bounding box, and updates:
- `dominant_surface` / `surface_breakdown`
- `dominant_path_type` / `path_type_breakdown`
- `escape_points` (towns, roads, refuges within 2.5 km)
- `water_sources` (springs, drinking water, taps within 1.5 km)

Sleeps 1 100 ms between requests. Resumable — trails with no nearby OSM features remain null but won't be re-queried on subsequent runs.

| Flag | Description |
|------|-------------|
| `--country es` | Only process trails with this country code (default: `es`) |
| `--dry-run` | Print OSM results without writing to Supabase |
| `--limit N` | Process at most N trails |
| `--force` | Re-enrich trails that already have OSM data |

---

### Shared library

`scripts/lib.mjs` — ES module used by all three step scripts. Exports:
- `haversineKm(lat1, lon1, lat2, lon2)` — Haversine distance in km
- `sleep(ms)` — Promise-based delay
- `createSupabase()` — Creates a service-role Supabase client from env vars
- `parseCLIArgs()` — Parses `--country`, `--dir`, `--limit`, `--dry-run`, `--force`, `--skip-existing`

---

## Legacy all-in-one import

```bash
node scripts/import-trails.mjs --country es --dir ./gpx_trails [--dry-run] [--limit 10]
```

Runs GPX parsing + Nominatim geocoding + Overpass enrichment in a single pass for each file. Slower (~2.2 s per trail due to rate limiting) and not resumable — if it crashes, you start over. Kept for reference; prefer the three-step pipeline above.

---

## Fix scripts

### fix-elevation.mjs

```bash
node scripts/fix-elevation.mjs [--dir ./gpx_trails] [--limit N] [--dry-run]
```

Scans GPX files for missing or zero elevation data (>80 % of points at 0 m). Corrects elevation by querying the **IGN WCS LiDAR 5 m** service (Spain), then recalculates all elevation-derived metrics (`elevation_gain_m`, `elevation_loss_m`, `elevation_max_m`, `elevation_min_m`, `avg_elevation_m`, `estimated_duration_min`, `difficulty_score`, `effort_level`) and patches the affected Supabase rows.

---

### fix-corrupted-tracks.mjs

```bash
node scripts/fix-corrupted-tracks.mjs [--dry-run] [--country it] [--threshold 0.5] [--id 12345]
```

Detects and repairs trails with unnatural "straight lines" (large distance gaps between consecutive points, usually caused by lost GPS signal or paused recording).
- Splits the track into continuous segments based on the `--threshold` (default 0.5 km).
- Keeps only the **longest continuous segment**.
- Recalculates all trail metrics (distance, gain, difficulty, etc.) based on the new cleaned track.
- Updates the Supabase record.

---

### fix-elevation-it.mjs

```bash
node scripts/fix-elevation-it.mjs [--dir ./gpx_trails/it] [--limit N] [--dry-run]
```

Specific elevation correction for **Italy** (or global). Unlike the Spanish version that uses IGN LiDAR, this script uses the **Open-Meteo Elevation API**. 
- It includes automatic retry logic with exponential backoff to handle API rate limits (429 errors).
- Recalculates all elevation-derived metrics and updates Supabase.

---

### fix-bad-elevation.mjs

```bash
node scripts/fix-bad-elevation.mjs [--dry-run] [--limit N] [--country es]
```

Detects trails with corrupted GPS elevation data — sentinel values like `-9000` or `-1450 m` — using two criteria:
- `elevation_min_m < -100`
- `elevation_gain_m > 10 000` (physically impossible)

Sets bad points to `null` in `track_profile`, recalculates all elevation-derived metrics, and patches Supabase. Supports filtering by `--country`.

---

### fix-slopes.mjs

```bash
node scripts/fix-slopes.mjs [--dry-run] [--limit N] [--min-slope 40] [--country it]
```

Re-reads `track_profile` from Supabase and recalculates `max_slope_pct` using the **95th percentile** over segments ≥ 20 m (more robust than the original absolute maximum). Also updates `difficulty_score`, `effort_level`, and `child_friendly`. Use `--min-slope` to only re-process trails whose current `max_slope_pct` exceeds a threshold. Supports filtering by `--country`.

---

### fix-gpx.mjs

```bash
node scripts/fix-gpx.mjs
```

Local-only preprocessing script. Reads GPX files from disk, detects and repairs missing `<bounds>` metadata and zero/missing elevation data using the IGN LiDAR WCS service, and writes the corrected GPX files back to disk. Run this before step 1 if your source GPX files have bad elevation data.

---

### backup-db.mjs

```bash
node scripts/backup-db.mjs
```

Downloads all rows from every table in Supabase (`trails`, and any other tables listed in the `TABLES` constant) and writes them as JSON files into `backups/YYYY-MM-DD_HH-MM-SS/`. The `backups/` directory is git-ignored.
