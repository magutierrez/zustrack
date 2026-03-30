fix-elevation

export $(grep -v '^#' .env.local | xargs) && node scripts/fix-elevation.mjs --dir ./gpx_trails