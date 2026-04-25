'use client';

import { useState, useRef, useCallback } from 'react';
import { Video, X, Loader2, Download, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { calculateBearing } from '@/lib/geometry';
import type maplibregl from 'maplibre-gl';

type TrackPoint = { lat: number; lng: number; d: number; e: number | null };
type RecordingState = 'idle' | 'preparing' | 'recording' | 'processing';

interface Labels {
  exportVideo: string;
  viewVideo: string;
  reRecord: string;
  recording: string;
  processing: string;
  cancelRecording: string;
  videoPreviewTitle: string;
  downloadVideo: string;
}

interface TrailVideoExportProps {
  trackProfile: TrackPoint[];
  mapInstanceRef: React.RefObject<maplibregl.Map | null>;
  trailName: string;
  onStartRecording: () => void;
  labels: Labels;
}

const MARKER_SOURCE = 'video-export-marker';
const MARKER_LAYER_GLOW = 'video-export-marker-glow';
const MARKER_LAYER_CORE = 'video-export-marker-core';

function getBestMimeType(): string {
  const types = ['video/mp4;codecs=h264', 'video/webm;codecs=vp9', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
}

function getMaptilerStyleUrl(): string {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  return `https://api.maptiler.com/maps/outdoor-v2/style.json${key ? `?key=${key}` : ''}`;
}

function addMarkerLayers(map: maplibregl.Map, lng: number, lat: number) {
  if (map.getSource(MARKER_SOURCE)) return;
  map.addSource(MARKER_SOURCE, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {},
    },
  });
  map.addLayer({
    id: MARKER_LAYER_GLOW,
    type: 'circle',
    source: MARKER_SOURCE,
    paint: {
      'circle-radius': 14,
      'circle-color': '#3b82f6',
      'circle-opacity': 0.35,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  });
  map.addLayer({
    id: MARKER_LAYER_CORE,
    type: 'circle',
    source: MARKER_SOURCE,
    paint: {
      'circle-radius': 7,
      'circle-color': '#ffffff',
      'circle-stroke-width': 3,
      'circle-stroke-color': '#3b82f6',
    },
  });
}

function removeMarkerLayers(map: maplibregl.Map) {
  if (map.getLayer(MARKER_LAYER_GLOW)) map.removeLayer(MARKER_LAYER_GLOW);
  if (map.getLayer(MARKER_LAYER_CORE)) map.removeLayer(MARKER_LAYER_CORE);
  if (map.getSource(MARKER_SOURCE)) map.removeSource(MARKER_SOURCE);
}

function updateMarker(map: maplibregl.Map, lng: number, lat: number) {
  const source = map.getSource(MARKER_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (!source) return;
  source.setData({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {},
  });
}

export function TrailVideoExport({
  trackProfile,
  mapInstanceRef,
  trailName,
  onStartRecording,
  labels,
}: TrailVideoExportProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [progress, setProgress] = useState(0);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoExt, setVideoExt] = useState('mp4');
  const [dialogOpen, setDialogOpen] = useState(false);

  const rafRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const cancelledRef = useRef(false);
  const resolveAnimRef = useRef<(() => void) | null>(null);
  const originalStyleRef = useRef<maplibregl.StyleSpecification | null>(null);

  const restoreStyle = useCallback((map: maplibregl.Map) => {
    if (originalStyleRef.current) {
      map.setStyle(originalStyleRef.current);
      originalStyleRef.current = null;
    }
  }, []);

  const cleanupMarkers = useCallback((map: maplibregl.Map) => {
    removeMarkerLayers(map);
  }, []);

  const startRecording = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map || trackProfile.length < 2) return;

    cancelledRef.current = false;
    setState('preparing');

    // 1. Expandir mapa a fullscreen
    onStartRecording();
    await new Promise((r) => setTimeout(r, 400));
    if (cancelledRef.current) { setState('idle'); return; }

    // 2. Guardar estilo actual y cambiar a MapTiler outdoor
    originalStyleRef.current = map.getStyle() as maplibregl.StyleSpecification;
    map.setStyle(getMaptilerStyleUrl());

    // 3. Esperar a que el estilo y los tiles carguen
    await new Promise<void>((resolve) => {
      const onIdle = () => { map.off('idle', onIdle); resolve(); };
      map.once('idle', onIdle);
    });
    if (cancelledRef.current) { restoreStyle(map); setState('idle'); return; }

    // 4. Añadir marcador en la posición inicial
    const start = trackProfile[0];
    addMarkerLayers(map, start.lng, start.lat);

    // 5. Vista inicial cinemática
    map.easeTo({ pitch: 55, bearing: 0, zoom: 12, duration: 800 });
    await new Promise((r) => setTimeout(r, 900));
    if (cancelledRef.current) { cleanupMarkers(map); restoreStyle(map); setState('idle'); return; }

    // 6. Iniciar captura
    const canvas = map.getCanvas();
    const stream = canvas.captureStream(30);
    const mimeType = getBestMimeType();
    const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
    setVideoExt(ext);
    const chunks: Blob[] = [];

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
    });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      cleanupMarkers(map);
      restoreStyle(map);

      if (cancelledRef.current) {
        setState('idle');
        setProgress(0);
        return;
      }

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setVideoBlobUrl(url);
      setDialogOpen(true);
      setState('idle');
      setProgress(0);
    };

    recorder.start(100);
    setState('recording');

    // 7. Animación cinemática
    const totalKm = trackProfile[trackProfile.length - 1].d;
    const DURATION_MS = Math.max(30_000, Math.min(90_000, totalKm * 6_000));
    let currentBearing: number | null = null;
    let startTime: number | null = null;

    await new Promise<void>((resolve) => {
      resolveAnimRef.current = resolve;

      const step = (time: number) => {
        if (cancelledRef.current) return resolve();

        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const t = Math.min(elapsed / DURATION_MS, 1);

        const fracIdx = t * (trackProfile.length - 1);
        const idx = Math.floor(fracIdx);
        const nextIdx = Math.min(idx + 1, trackProfile.length - 1);
        const ratio = fracIdx - idx;

        const p1 = trackProfile[idx];
        const p2 = trackProfile[nextIdx];
        const lat = p1.lat + (p2.lat - p1.lat) * ratio;
        const lng = p1.lng + (p2.lng - p1.lng) * ratio;

        // Actualizar marcador en el canvas
        updateMarker(map, lng, lat);

        // Bearing suavizado con lookAhead
        const lookAheadIdx = Math.min(idx + 15, trackProfile.length - 1);
        const target = trackProfile[lookAheadIdx];
        const targetBearing = calculateBearing(
          { lat, lon: lng },
          { lat: target.lat, lon: target.lng },
        );

        if (currentBearing === null) {
          currentBearing = targetBearing;
        } else {
          let diff = targetBearing - currentBearing;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          currentBearing += diff * 0.04;
          currentBearing = (currentBearing + 360) % 360;
        }

        map.easeTo({
          center: [lng, lat],
          bearing: currentBearing,
          pitch: 60,
          zoom: 14.5,
          duration: 200,
          easing: (x: number): number => x,
        });

        setProgress(Math.round(t * 100));

        if (t >= 1) return resolve();
        rafRef.current = requestAnimationFrame(step);
      };

      rafRef.current = requestAnimationFrame(step);
    });

    // 8. Finalizar
    if (!cancelledRef.current) {
      setState('processing');
      recorder.stop();
    }
  }, [trackProfile, mapInstanceRef, onStartRecording, cleanupMarkers, restoreStyle]);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    cancelAnimationFrame(rafRef.current);
    resolveAnimRef.current?.();
    resolveAnimRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setState('idle');
    setProgress(0);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false); // conserva el blob para poder volver a abrir
  }, []);

  const discardAndReRecord = useCallback(() => {
    if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    setVideoBlobUrl(null);
    setDialogOpen(false);
    // startRecording se llama en el siguiente tick para que el estado se actualice
    setTimeout(() => startRecording(), 0);
  }, [videoBlobUrl, startRecording]);

  return (
    <>
      {/* Botón — idle sin vídeo: grabar; idle con vídeo: ver */}
      {state === 'idle' && (
        <button
          onClick={videoBlobUrl ? () => setDialogOpen(true) : startRecording}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
        >
          <Video className="h-3.5 w-3.5" />
          {videoBlobUrl ? labels.viewVideo : labels.exportVideo}
        </button>
      )}

      {/* Overlay fijo durante grabación / preparación / procesado */}
      {(state === 'preparing' || state === 'recording' || state === 'processing') && (
        <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-end pb-10">
          <div className="pointer-events-auto w-[88%] max-w-sm rounded-2xl border border-white/20 bg-slate-900/85 px-5 py-4 shadow-2xl backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {state === 'recording' ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                ) : (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                )}
                <span className="text-[11px] font-black tracking-widest text-white uppercase">
                  {state === 'processing' ? labels.processing : labels.recording}
                </span>
              </div>
              {state === 'recording' && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full text-slate-400 hover:text-red-400"
                  onClick={cancelRecording}
                  title={labels.cancelRecording}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-red-500 transition-all duration-200"
                style={{ width: `${state === 'processing' ? 100 : progress}%` }}
              />
            </div>

            {state === 'recording' && (
              <p className="mt-1.5 text-right font-mono text-[10px] font-bold text-slate-400">
                {progress}%
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dialog de preview */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{labels.videoPreviewTitle}</DialogTitle>
          </DialogHeader>

          <div className="px-6">
            {videoBlobUrl && (
              <video
                src={videoBlobUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full rounded-xl"
                style={{ maxHeight: '60vh' }}
              />
            )}
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-3 px-6 pt-4 pb-6">
            <button
              onClick={discardAndReRecord}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              {labels.reRecord}
            </button>
            {videoBlobUrl && (
              <a
                href={videoBlobUrl}
                download={`${trailName}.${videoExt}`}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <Download className="h-4 w-4" />
                {labels.downloadVideo}
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
