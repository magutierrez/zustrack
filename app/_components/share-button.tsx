'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import polyline from '@mapbox/polyline';
import LZString from 'lz-string';

import { Button } from '@/components/ui/button';
import { useRouteStore } from '@/store/route-store';
import { sampleRoutePoints } from '@/lib/gpx-parser';

interface SharedRoutePayload {
  p: string;   // @mapbox/polyline encoded coords
  e: string;   // delta-encoded elevations, lz-compressed separately for better ratio
  n: string;   // route name
  td: number;  // totalDistance (km)
  tg: number;  // totalElevationGain (m)
  tl: number;  // totalElevationLoss (m)
  a?: string;  // activity type
}

export function ShareButton() {
  const t = useTranslations('ShareButton');
  const gpxData = useRouteStore((s) => s.gpxData);
  const fetchedActivityType = useRouteStore((s) => s.fetchedActivityType);
  const recalculatedTotalDistance = useRouteStore((s) => s.recalculatedTotalDistance);
  const recalculatedElevationGain = useRouteStore((s) => s.recalculatedElevationGain);
  const recalculatedElevationLoss = useRouteStore((s) => s.recalculatedElevationLoss);
  const [copied, setCopied] = useState(false);

  if (!gpxData) return null;

  const handleShare = () => {
    const sampled = sampleRoutePoints(gpxData.points, 300);

    // Encode [lat, lon] pairs with @mapbox/polyline at precision 5
    const coords: [number, number][] = sampled.map((p) => [p.lat, p.lon]);
    const encodedPolyline = polyline.encode(coords, 5);

    // Delta-encode elevations as comma-separated integers (highly compressible)
    const eles = sampled.map((p) => Math.round(p.ele ?? 0));
    const deltas = eles.map((e, i) => (i === 0 ? e : e - eles[i - 1]));
    const elevationString = deltas.join(',');

    const payload: SharedRoutePayload = {
      p: encodedPolyline,
      e: elevationString,
      n: gpxData.name,
      td: parseFloat((recalculatedTotalDistance || gpxData.totalDistance).toFixed(3)),
      tg: Math.round(recalculatedElevationGain || gpxData.totalElevationGain),
      tl: Math.round(recalculatedElevationLoss || gpxData.totalElevationLoss),
    };
    if (fetchedActivityType) payload.a = fetchedActivityType;

    // Compress the whole payload with lz-string and put it in the URL fragment.
    // Fragments (#) are never sent to the server → no 414 risk, unlimited size.
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));

    const url = new URL(window.location.href);
    url.searchParams.delete('routeId');
    // Clear any old query-param style shared params
    ['p', 'e', 'n', 'td', 'tg', 'tl', 'activity'].forEach((k) => url.searchParams.delete(k));
    url.hash = `route=${compressed}`;

    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={handleShare}
      title={copied ? t('copied') : t('share')}
    >
      {copied ? <Check className="h-5 w-5 text-green-500" /> : <Share2 className="h-5 w-5" />}
      <span className="sr-only">{t('share')}</span>
    </Button>
  );
}
