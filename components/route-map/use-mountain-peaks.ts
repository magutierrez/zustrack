'use client';

import { useEffect } from 'react';
import { useRouteStore } from '@/store/route-store';
import type { RoutePoint } from '@/lib/types';

interface UseMountainPeaksParams {
  showMountainPeaks: boolean;
  points: RoutePoint[];
}

export function useMountainPeaks({ showMountainPeaks, points }: UseMountainPeaksParams): void {
  const mountainPeaksLoaded = useRouteStore((s) => s.mountainPeaksLoaded);
  const mountainPeaksLoading = useRouteStore((s) => s.mountainPeaksLoading);
  const { setMountainPeaks, setMountainPeaksLoading } = useRouteStore();

  useEffect(() => {
    if (!showMountainPeaks || mountainPeaksLoaded || mountainPeaksLoading || points.length === 0)
      return;

    let north = -Infinity, south = Infinity, east = -Infinity, west = Infinity;
    for (const p of points) {
      if (p.lat > north) north = p.lat;
      if (p.lat < south) south = p.lat;
      if (p.lon > east) east = p.lon;
      if (p.lon < west) west = p.lon;
    }
    // Add ~3 km padding so peaks just outside the track are also shown
    const PAD = 0.03;
    const bbox = { north: north + PAD, south: south - PAD, east: east + PAD, west: west - PAD };

    setMountainPeaksLoading(true);
    fetch('/api/mountain-peaks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bbox }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMountainPeaks(data.peaks ?? []);
      })
      .catch(() => {
        setMountainPeaksLoading(false);
      });
  }, [showMountainPeaks, mountainPeaksLoaded, mountainPeaksLoading, points, setMountainPeaks, setMountainPeaksLoading]);
}
