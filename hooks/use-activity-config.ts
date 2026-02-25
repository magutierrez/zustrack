'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouteStore } from '@/store/route-store';

export function useActivityConfig() {
  const config = useRouteStore((s) => s.config);
  const setConfig = useRouteStore((s) => s.setConfig);
  const totalDistance = useRouteStore((s) => s.recalculatedTotalDistance);

  const estimatedDuration =
    totalDistance > 0 && config.speed > 0 ? (totalDistance / config.speed) * 60 : 0;
  const initialHours = Math.floor(estimatedDuration / 60);
  const initialMinutes = Math.round(estimatedDuration % 60);

  const [manualHours, setManualHours] = useState(initialHours);
  const [manualMinutes, setManualMinutes] = useState(initialMinutes);

  useEffect(() => {
    setManualHours(initialHours);
    setManualMinutes(initialMinutes);
  }, [config.speed, totalDistance]);

  const handleDurationChange = useCallback(
    (h: number, m: number) => {
      const totalMinutes = h * 60 + m;
      if (totalMinutes > 0 && totalDistance > 0) {
        const newSpeed = (totalDistance / totalMinutes) * 60;
        const clampedSpeed = Math.max(1, Math.min(60, Math.round(newSpeed * 10) / 10));
        setConfig({ ...config, speed: clampedSpeed });
      }
      setManualHours(h);
      setManualMinutes(m);
    },
    [config, totalDistance, setConfig],
  );

  return { initialHours, initialMinutes, manualHours, manualMinutes, handleDurationChange };
}
