'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouteStore } from '@/store/route-store';
import { useSavedRoutes } from '@/hooks/use-saved-routes';
import { stripGpxExtension } from '@/lib/utils';

export function useEditableRouteName(routeId: string | null) {
  const gpxData = useRouteStore((s) => s.gpxData);
  const { setGpxData, setGpxFileName } = useRouteStore();
  const { updateRouteName } = useSavedRoutes();

  const currentName = stripGpxExtension(gpxData?.name ?? '');

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentName);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep editValue in sync when the name changes from outside (e.g. route reload)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isEditing) setEditValue(currentName);
  }, [currentName, isEditing]);

  const startEditing = useCallback(() => {
    setEditValue(currentName);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [currentName]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue(currentName);
  }, [currentName]);

  const commitName = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === currentName) {
      cancelEditing();
      return;
    }

    if (gpxData) {
      setGpxData({ ...gpxData, name: trimmed });
      setGpxFileName(trimmed);
    }

    if (routeId) {
      await updateRouteName(routeId, trimmed);
    }

    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [
    editValue,
    currentName,
    gpxData,
    routeId,
    setGpxData,
    setGpxFileName,
    updateRouteName,
    cancelEditing,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commitName();
      if (e.key === 'Escape') cancelEditing();
    },
    [commitName, cancelEditing],
  );

  return {
    currentName,
    isEditing,
    editValue,
    saved,
    inputRef,
    setEditValue,
    startEditing,
    cancelEditing,
    commitName,
    handleKeyDown,
  };
}
