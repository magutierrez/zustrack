'use client';

import { Download } from 'lucide-react';

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

function buildGpx(name: string, points: TrackPoint[]): string {
  const trkpts = points
    .map(
      (p) =>
        `    <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lng.toFixed(7)}">${
          p.e !== null ? `<ele>${p.e.toFixed(1)}</ele>` : ''
        }</trkpt>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="zustrack" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</name></metadata>
  <trk>
    <name>${name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

export function TrailGpxDownload({
  name,
  trackProfile,
  label,
}: {
  name: string;
  trackProfile: TrackPoint[];
  label: string;
}) {
  if (!trackProfile.length) return null;

  const handleDownload = () => {
    const gpx = buildGpx(name, trackProfile);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, '-')}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
