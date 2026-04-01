/**
 * Converts a trail's track_profile to a valid GPX XML string
 * that parseGPX() in lib/gpx-parser.ts can process.
 */
export function trailToGpx(
  name: string,
  points: { lat: number; lng: number; e: number | null }[],
): string {
  const safeName = name.replace(/[<>&"']/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] ?? c),
  );

  const trkpts = points
    .map(
      (p) =>
        `    <trkpt lat="${p.lat}" lon="${p.lng}">${p.e != null ? `<ele>${p.e}</ele>` : ''}</trkpt>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="zustrack">
  <trk>
    <name>${safeName}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}
