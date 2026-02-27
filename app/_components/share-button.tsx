'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import polyline from '@mapbox/polyline';

import { Button } from '@/components/ui/button';
import { useRouteStore } from '@/store/route-store';
import { sampleRoutePoints } from '@/lib/gpx-parser';

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
    const encodedP = polyline.encode(coords, 5);

    // Delta-encode elevations (rounded to integer meters) then base64
    const eles = sampled.map((p) => Math.round(p.ele ?? 0));
    const deltas = eles.map((e, i) => (i === 0 ? e : e - eles[i - 1]));
    const encodedE = btoa(deltas.join(','));

    // Encode the currently displayed (recalculated) metrics as ground truth
    // so the recipient sees identical values regardless of point sampling
    const totalDistance = recalculatedTotalDistance || gpxData.totalDistance;
    const totalGain = recalculatedElevationGain || gpxData.totalElevationGain;
    const totalLoss = recalculatedElevationLoss || gpxData.totalElevationLoss;

    const url = new URL(window.location.href);
    url.searchParams.delete('routeId');
    url.searchParams.set('p', encodedP);
    url.searchParams.set('e', encodedE);
    url.searchParams.set('n', gpxData.name);
    url.searchParams.set('td', totalDistance.toFixed(3));
    url.searchParams.set('tg', Math.round(totalGain).toString());
    url.searchParams.set('tl', Math.round(totalLoss).toString());
    if (fetchedActivityType) {
      url.searchParams.set('activity', fetchedActivityType);
    }

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
