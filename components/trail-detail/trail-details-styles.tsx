'use client';

export function TrailDetailsStyles() {
  return (
    <style>{`
      .trail-scrollbar::-webkit-scrollbar { width: 4px; }
      .trail-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .trail-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 10px; }
      .trail-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }

      /* MapLibre navigation control — match secondary icon buttons */
      .maplibregl-ctrl-group {
        background: transparent !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        border: none !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 0 !important;
      }
      /* All buttons: base size, secondary bg, no individual shadow by default */
      .maplibregl-ctrl-group button {
        width: 40px !important;
        height: 40px !important;
        background-color: var(--secondary) !important;
        border: none !important;
        box-shadow: none !important;
      }
      /* Zoom-in: top of the unified card */
      .maplibregl-ctrl-group button.maplibregl-ctrl-zoom-in {
        border-radius: calc(var(--radius) - 2px) calc(var(--radius) - 2px) 0 0 !important;
        border-bottom: 1px solid color-mix(in oklch, var(--border) 60%, transparent) !important;
      }
      /* Zoom-out: bottom of the unified card — carries the shadow for the whole pair */
      .maplibregl-ctrl-group button.maplibregl-ctrl-zoom-out {
        border-radius: 0 0 calc(var(--radius) - 2px) calc(var(--radius) - 2px) !important;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
      }
      /* Compass: separate card with gap */
      .maplibregl-ctrl-group button.maplibregl-ctrl-compass {
        border-radius: calc(var(--radius) - 2px) !important;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        margin-top: 6px !important;
      }
      .maplibregl-ctrl-group button:hover {
        background-color: color-mix(in oklch, var(--secondary) 80%, transparent) !important;
      }
      .dark .maplibregl-ctrl-group button .maplibregl-ctrl-icon {
        filter: invert(1) brightness(0.85) !important;
      }

      /* MapLibre popup — adapt to dark/light via CSS tokens */
      .maplibregl-popup-content {
        background: var(--card) !important;
        border: 1px solid var(--border) !important;
        color: var(--foreground) !important;
        border-radius: 8px !important;
        padding: 0 !important;
        box-shadow: 0 4px 16px rgb(0 0 0 / 0.12) !important;
      }
      /* Tip arrow (anchor=bottom → tip points down, uses border-top-color) */
      .maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
        border-top-color: var(--card) !important;
      }
      .maplibregl-popup-anchor-top .maplibregl-popup-tip {
        border-bottom-color: var(--card) !important;
      }
      .maplibregl-popup-anchor-left .maplibregl-popup-tip {
        border-right-color: var(--card) !important;
      }
      .maplibregl-popup-anchor-right .maplibregl-popup-tip {
        border-left-color: var(--card) !important;
      }
      /* Hide default close button (component renders its own) */
      .maplibregl-popup-close-button {
        display: none !important;
      }
    `}</style>
  );
}
