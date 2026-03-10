'use client';

import { useEffect } from 'react';
import { useRouteStore } from '@/store/route-store';
import { getAnnotationsFromDb, saveAnnotationsToDb } from '@/lib/db';
import type { Annotation } from '@/lib/types';

export function useAnnotations() {
  const savedRouteId = useRouteStore((s) => s.savedRouteId);
  const annotations = useRouteStore((s) => s.annotations);
  const setAnnotations = useRouteStore((s) => s.setAnnotations);

  useEffect(() => {
    if (!savedRouteId) {
      setAnnotations([]);
      return;
    }
    getAnnotationsFromDb(savedRouteId).then(setAnnotations);
  }, [savedRouteId, setAnnotations]);

  const addAnnotation = async (lat: number, lon: number, distanceFromStart: number, text: string) => {
    if (!savedRouteId) return;
    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      lat,
      lon,
      distanceFromStart,
      text,
      createdAt: new Date().toISOString(),
    };
    const updated = [...annotations, newAnnotation];
    setAnnotations(updated);
    await saveAnnotationsToDb(savedRouteId, updated);
  };

  const updateAnnotation = async (id: string, text: string) => {
    if (!savedRouteId) return;
    const updated = annotations.map((a) => (a.id === id ? { ...a, text } : a));
    setAnnotations(updated);
    await saveAnnotationsToDb(savedRouteId, updated);
  };

  const deleteAnnotation = async (id: string) => {
    if (!savedRouteId) return;
    const updated = annotations.filter((a) => a.id !== id);
    setAnnotations(updated);
    await saveAnnotationsToDb(savedRouteId, updated);
  };

  return { annotations, addAnnotation, updateAnnotation, deleteAnnotation };
}
