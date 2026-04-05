import type { Map } from 'maplibre-gl';

/**
 * Draws a chevron onto a canvas and registers it as an SDF image named
 * 'route-arrow'. SDF allows MapLibre to colourise the icon via `icon-color`
 * without needing a glyphs/font endpoint — works on all map styles.
 * Must be called on initial load and again after every style swap.
 */
export function addArrowImage(map: Map) {
  const size = 35;
  const canvas = document.createElement('canvas');
  if (typeof document === 'undefined') return;
  
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.11;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Chevron pointing right — MapLibre rotates it to follow the line
  ctx.beginPath();
  ctx.moveTo(size * 0.26, size * 0.18);
  ctx.lineTo(size * 0.68, size * 0.5);
  ctx.lineTo(size * 0.26, size * 0.82);
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, size, size);
  if (map.hasImage('route-arrow')) map.removeImage('route-arrow');
  map.addImage('route-arrow', imageData, { sdf: true });
}
