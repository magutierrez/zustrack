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

  const [manualDuration, setManualDuration] = useState({ hours: initialHours, minutes: initialMinutes });

  useEffect(() => {
    setManualDuration({ hours: initialHours, minutes: initialMinutes });
  }, [initialHours, initialMinutes]);

  const handleDurationChange = useCallback(
    (h: number, m: number) => {
      const totalMinutes = h * 60 + m;
      if (totalMinutes > 0 && totalDistance > 0) {
        const newSpeed = (totalDistance / totalMinutes) * 60;
        const clampedSpeed = Math.max(1, Math.min(60, Math.round(newSpeed * 10) / 10));
        // eslint-disable-next-line react-doctor/rerender-functional-setstate
        setConfig({ ...config, speed: clampedSpeed });
      }
      setManualDuration({ hours: h, minutes: m });
    },
    [config, totalDistance, setConfig],
  );

  return { initialHours, initialMinutes, manualHours: manualDuration.hours, manualMinutes: manualDuration.minutes, handleDurationChange };
}
