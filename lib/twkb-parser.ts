export interface Point {
  lat: number;
  lon: number;
}

interface TWKBContext {
  offset: number;
  buffer: Uint8Array;
}

/**
 * Decodes a Base64 encoded TWKB (Tiny Well-Known Binary) string into an array of points.
 * Supports multiple geometries, precision handling, and metadata (IDs, BBox, etc.).
 */
export function decodeTWKB(base64: string): Point[] {
  const binaryString =
    typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');

  const buffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }

  const ctx: TWKBContext = { offset: 0, buffer };
  const allPoints: Point[] = [];

  while (ctx.offset < buffer.length) {
    try {
      const typeAndPrecision = buffer[ctx.offset++];
      const type = typeAndPrecision & 0x0f;

      // Precision is ZigZag encoded in the high 4 bits
      const precisionRaw = (typeAndPrecision & 0xf0) >> 4;
      const precision = (precisionRaw >> 1) ^ -(precisionRaw & 1);
      const multiplier = Math.pow(10, precision);

      const metadata = buffer[ctx.offset++];
      const hasBoundingBox = !!(metadata & 0x01);
      const hasSize = !!(metadata & 0x02);
      const hasIDs = !!(metadata & 0x04);
      const hasExtendedPrecision = !!(metadata & 0x08);
      const isEmpty = !!(metadata & 0x10);

      if (isEmpty) continue;

      if (hasSize) readVarUInt(ctx);

      if (hasBoundingBox) {
        // Skip BBox: 2 coordinates per dimension (min/max)
        const dims = 2 + (hasExtendedPrecision ? 1 : 0); // basic is 2D (XY)
        for (let i = 0; i < dims * 2; i++) readVarInt(ctx);
      }

      const nPoints = readVarUInt(ctx);
      let lastX = 0;
      let lastY = 0;

      for (let i = 0; i < nPoints; i++) {
        if (hasIDs) readVarInt(ctx);

        const dx = readVarInt(ctx);
        const dy = readVarInt(ctx);

        lastX += dx;
        lastY += dy;

        const lat = lastY / multiplier;
        const lon = lastX / multiplier;

        // Validation: Ignore points that are clearly out of WGS84 bounds or (0,0)
        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && (lat !== 0 || lon !== 0)) {
          allPoints.push({ lat, lon });
        }
      }
    } catch (e) {
      console.warn('TWKB decoding interrupted at offset', ctx.offset, e);
      break;
    }
  }

  return allPoints;
}

function readVarUInt(ctx: TWKBContext): number {
  let value = 0;
  let shift = 0;
  while (ctx.offset < ctx.buffer.length) {
    const byte = ctx.buffer[ctx.offset++];
    value += (byte & 0x7f) * Math.pow(2, shift);
    if (!(byte & 0x80)) break;
    shift += 7;
  }
  return value;
}

function readVarInt(ctx: TWKBContext): number {
  const value = readVarUInt(ctx);
  // ZigZag decoding: (n >> 1) ^ -(n & 1)
  return value % 2 === 1 ? -(Math.floor(value / 2) + 1) : value / 2;
}
