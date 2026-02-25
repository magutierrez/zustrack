/* Tipos GeoJSON y TWKB (basados en tu index.d.ts) */

export type Position = number[];
export type BBox = number[];

export interface GeoJSONObject {
  type:
    | 'Point'
    | 'LineString'
    | 'Polygon'
    | 'MultiPoint'
    | 'MultiLineString'
    | 'MultiPolygon'
    | 'GeometryCollection';
  bbox?: BBox | undefined;
}

export interface Point extends GeoJSONObject {
  type: 'Point';
  coordinates: Position;
}

export interface LineString extends GeoJSONObject {
  type: 'LineString';
  coordinates: Position[];
}

export interface Polygon extends GeoJSONObject {
  type: 'Polygon';
  coordinates: Position[][];
}

export interface MultiPoint extends GeoJSONObject {
  type: 'MultiPoint';
  coordinates: Position[];
}

export interface MultiLineString extends GeoJSONObject {
  type: 'MultiLineString';
  coordinates: Position[][];
}

export interface MultiPolygon extends GeoJSONObject {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}

export interface GeometryCollection extends GeoJSONObject {
  type: 'GeometryCollection';
  geometries: Geometry[];
}

export type Geometry =
  | Point
  | LineString
  | Polygon
  | MultiPoint
  | MultiLineString
  | MultiPolygon
  | GeometryCollection;

export interface EncodingParameters {
  precisionZ?: number;
  precisionM?: number;
  includeBbox?: boolean;
  includeSize?: boolean;
  ids?: number[];
}

interface FullEncodingParameters {
  precisionXY: number;
  precisionZ: number;
  precisionM: number;
  includeBbox: boolean;
  includeSize: boolean;
  ids?: number[];
}

/* array utility */

function append(array1: number[], array2: number[] | Uint8Array): void {
  const n = array2.length;
  for (let i = 0; i < n; i++) {
    array1.push(array2[i]);
  }
}

function join(array1: number[], array2: number[]): number[] {
  const array3: number[] = [];
  const n1 = array1.length;
  for (let i = 0; i < n1; i++) array3.push(array1[i]);
  const n2 = array2.length;
  for (let j = 0; j < n2; j++) array3.push(array2[j]);
  return array3;
}

interface ArrayReader {
  i: number;
  data: number[] | Uint8Array;
  next: () => number;
}

function newArrayReader(array: number[] | Uint8Array): ArrayReader {
  return {
    i: 0,
    data: array,
    next: function () {
      return this.data[this.i++];
    },
  };
}

/* base64 utility */

const B64: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D',
  4: 'E',
  5: 'F',
  6: 'G',
  7: 'H',
  8: 'I',
  9: 'J',
  10: 'K',
  11: 'L',
  12: 'M',
  13: 'N',
  14: 'O',
  15: 'P',
  16: 'Q',
  17: 'R',
  18: 'S',
  19: 'T',
  20: 'U',
  21: 'V',
  22: 'W',
  23: 'X',
  24: 'Y',
  25: 'Z',
  26: 'a',
  27: 'b',
  28: 'c',
  29: 'd',
  30: 'e',
  31: 'f',
  32: 'g',
  33: 'h',
  34: 'i',
  35: 'j',
  36: 'k',
  37: 'l',
  38: 'm',
  39: 'n',
  40: 'o',
  41: 'p',
  42: 'q',
  43: 'r',
  44: 's',
  45: 't',
  46: 'u',
  47: 'v',
  48: 'w',
  49: 'x',
  50: 'y',
  51: 'z',
  52: '0',
  53: '1',
  54: '2',
  55: '3',
  56: '4',
  57: '5',
  58: '6',
  59: '7',
  60: '8',
  61: '9',
  62: '+',
  63: '/',
};

const C64: Record<string, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
  H: 7,
  I: 8,
  J: 9,
  K: 10,
  L: 11,
  M: 12,
  N: 13,
  O: 14,
  P: 15,
  Q: 16,
  R: 17,
  S: 18,
  T: 19,
  U: 20,
  V: 21,
  W: 22,
  X: 23,
  Y: 24,
  Z: 25,
  a: 26,
  b: 27,
  c: 28,
  d: 29,
  e: 30,
  f: 31,
  g: 32,
  h: 33,
  i: 34,
  j: 35,
  k: 36,
  l: 37,
  m: 38,
  n: 39,
  o: 40,
  p: 41,
  q: 42,
  r: 43,
  s: 44,
  t: 45,
  u: 46,
  v: 47,
  w: 48,
  x: 49,
  y: 50,
  z: 51,
  0: 52,
  1: 53,
  2: 54,
  3: 55,
  4: 56,
  5: 57,
  6: 58,
  7: 59,
  8: 60,
  9: 61,
  '+': 62,
  '/': 63,
};

function encodeBase64(bytes: number[] | Uint8Array): string {
  let string = '';
  const length = bytes.length;
  let i = 0;
  let b = 0;
  while (i < length - 2) {
    b = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    string += B64[b >> 18] + B64[(b >> 12) & 63] + B64[(b >> 6) & 63] + B64[b & 63];
    i += 3;
  }
  const r = length - i;
  if (r === 1) {
    b = bytes[i] << 4;
    string += B64[b >> 6] + B64[b & 63] + '==';
  } else if (r === 2) {
    b = (bytes[i] << 10) | (bytes[i + 1] << 2);
    string += B64[b >> 12] + B64[(b >> 6) & 63] + B64[b & 63] + '=';
  }
  return string;
}

function decodeBase64(string: string): number[] {
  const bytes: number[] = [];
  const length = string.length;
  let i = 0;
  let b = 0;
  let c1, c2, c3, c4;
  while (i < length - 4) {
    c1 = C64[string[i]];
    c2 = C64[string[i + 1]];
    c3 = C64[string[i + 2]];
    c4 = C64[string[i + 3]];
    b = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;
    bytes.push(b >> 16);
    bytes.push((b >> 8) & 255);
    bytes.push(b & 255);
    i += 4;
  }
  const r = length - i;
  if (r > 0) {
    c1 = C64[string[i]];
    c2 = C64[string[i + 1]];
    c3 = C64[string[i + 2]];
    c4 = C64[string[i + 3]];
    bytes.push((c1 << 2) | (c2 >> 4));
    if (c3 !== undefined) {
      bytes.push(((c2 & 15) << 4) | (c3 >> 2));
      if (c4 !== undefined) {
        bytes.push(((c3 & 3) << 6) | c4);
      }
    }
  }
  return bytes;
}

/* VLQ utility */

function round(x: number): number {
  return x < 0 ? -Math.round(-x) : Math.round(x);
}

function zigzag(int: number): number {
  return int < 0 ? -2 * int - 1 : 2 * int;
}

function zagzig(int: number): number {
  return int & 1 ? (-int - 1) / 2 : int / 2;
}

function int2bytes(int: number, unsigned: boolean = false): number[] {
  const bytes: number[] = [];
  const k = unsigned ? int : int < 0 ? -2 * int - 1 : 2 * int;
  if (k < 4294967296) {
    let lo = k;
    while (lo > 127) {
      bytes.push((lo & 127) | 128);
      lo >>>= 7;
    }
    bytes.push(lo);
  } else {
    let lo = k >>> 0;
    let hi = (k / 4294967296) | 0;
    for (let i = 0; i < 5; i++) {
      bytes.push((lo & 127) | 128);
      lo >>>= 7;
    }
    while (hi > 127) {
      bytes.push((hi & 127) | 128);
      hi >>>= 7;
    }
    bytes.push(hi);
  }
  return bytes;
}

function bytes2int(reader: ArrayReader, unsigned: boolean = false): number {
  const bytes: number[] = [];
  let byte = 255;
  let length = 0;
  while (byte > 127) {
    byte = reader.next();
    bytes.push(byte);
    length++;
  }
  let k = 0;
  if (length < 6) {
    let i = 0;
    let lo = 0;
    let shift = 0;
    while (i < length) {
      lo += (bytes[i] & 127) << shift;
      shift += 7;
      i++;
    }
    k = lo >>> 0;
  } else {
    let i = 0;
    let lo = 0;
    let hi = 0;
    let shift = 0;
    while (i < 5) {
      lo += (bytes[i] & 127) << shift;
      shift += 7;
      i++;
    }
    shift = 0;
    while (i < length) {
      hi += (bytes[i] & 127) << shift;
      shift += 7;
      i++;
    }
    k = (lo >>> 0) + (hi >>> 0) * 4294967296;
  }
  return unsigned ? k : k & 1 ? (-k - 1) / 2 : k / 2;
}

/* geometry encoding */

function encodeSingleCoordinates(
  coordinates: Position,
  previous: number[],
  factors: number[],
  dimension: number,
): number[] {
  const buffer: number[] = [];
  for (let i = 0; i < dimension; i++) {
    const delta = round(coordinates[i] * factors[i]) - previous[i];
    append(buffer, int2bytes(delta));
    previous[i] += delta;
  }
  return buffer;
}

function encodeCoordinatesArray(
  array: Position[],
  previous: number[],
  factors: number[],
  dimension: number,
  minPointCount: number = 0,
): number[] {
  const buffer: number[] = [];
  const delta = [0, 0, 0, 0];
  const n = array.length;
  let count = 0;
  let maxPointLeft = n;
  if (n === 0) return [0];
  if (n < 128) buffer.push(0);
  for (let i = 0; i < n; i++) {
    const coordinates = array[i];
    let diff = 0;
    for (let j = 0; j < dimension; j++) {
      delta[j] = round(coordinates[j] * factors[j]) - previous[j];
      diff += Math.abs(delta[j]);
    }
    if (diff === 0 && i > 0 && maxPointLeft > minPointCount) {
      maxPointLeft -= 1;
      continue;
    }
    count += 1;
    for (let j = 0; j < dimension; j++) {
      append(buffer, int2bytes(delta[j]));
      previous[j] += delta[j];
    }
  }
  if (n < 128) {
    buffer[0] = count;
    return buffer;
  } else {
    return join(int2bytes(count, true), buffer);
  }
}

function encodePoint(
  geojson: Point,
  previous: number[],
  factors: number[],
  dimension: number,
): number[] {
  return encodeSingleCoordinates(geojson.coordinates, previous, factors, dimension);
}

function encodeLineString(
  geojson: LineString,
  previous: number[],
  factors: number[],
  dimension: number,
): number[] {
  return encodeCoordinatesArray(geojson.coordinates, previous, factors, dimension, 2);
}

function encodePolygon(
  geojson: Polygon,
  previous: number[],
  factors: number[],
  dimension: number,
): number[] {
  const buffer: number[] = [];
  const polygon = geojson.coordinates;
  const n = polygon.length;
  append(buffer, int2bytes(n, true));
  for (let i = 0; i < n; i++) {
    const ring = polygon[i];
    append(buffer, encodeCoordinatesArray(ring, previous, factors, dimension, 4));
  }
  return buffer;
}

function encodeMultiPoint(
  geojson: MultiPoint,
  previous: number[],
  factors: number[],
  dimension: number,
  ids?: number[],
): number[] {
  const buffer: number[] = [];
  const multipoint = geojson.coordinates;
  const n = multipoint.length;
  let count = 0;
  const coordinatesBuffer: number[] = [];
  const encodeId = ids !== undefined;
  const idListBuffer: number[] = [];
  for (let i = 0; i < n; i++) {
    const point = multipoint[i];
    if (point.length === 0) continue;
    count += 1;
    if (encodeId && ids) append(idListBuffer, int2bytes(ids[i]));
    append(coordinatesBuffer, encodeSingleCoordinates(point, previous, factors, dimension));
  }
  append(buffer, int2bytes(count, true));
  if (encodeId) append(buffer, idListBuffer);
  append(buffer, coordinatesBuffer);
  return buffer;
}

function encodeMultiLineString(
  geojson: MultiLineString,
  previous: number[],
  factors: number[],
  dimension: number,
  ids?: number[],
): number[] {
  const buffer: number[] = [];
  const multilinestring = geojson.coordinates;
  const n = multilinestring.length;
  append(buffer, int2bytes(n, true));
  if (ids !== undefined) {
    const idListBuffer = encodeIdList(ids, n);
    append(buffer, idListBuffer);
  }
  for (let i = 0; i < n; i++) {
    const linestring = multilinestring[i];
    append(buffer, encodeCoordinatesArray(linestring, previous, factors, dimension));
  }
  return buffer;
}

function encodeMultiPolygon(
  geojson: MultiPolygon,
  previous: number[],
  factors: number[],
  dimension: number,
  ids?: number[],
): number[] {
  const buffer: number[] = [];
  const multipolygon = geojson.coordinates;
  const n = multipolygon.length;
  append(buffer, int2bytes(n, true));
  if (ids !== undefined) {
    const idListBuffer = encodeIdList(ids, n);
    append(buffer, idListBuffer);
  }
  for (let i = 0; i < n; i++) {
    const polygon = multipolygon[i];
    const m = polygon.length;
    append(buffer, int2bytes(m, true));
    for (let j = 0; j < m; j++) {
      const ring = polygon[j];
      append(buffer, encodeCoordinatesArray(ring, previous, factors, dimension));
    }
  }
  return buffer;
}

function encodeGeometryCollection(
  geojson: GeometryCollection,
  params: FullEncodingParameters,
  ids?: number[],
): number[] {
  const buffer: number[] = [];
  const geometries = geojson.geometries;
  const n = geometries.length;
  append(buffer, int2bytes(n, true));
  if (ids !== undefined) {
    const idListBuffer = encodeIdList(ids, n);
    append(buffer, idListBuffer);
  }
  for (let i = 0; i < n; i++) {
    append(buffer, encodeGeoJSON(geometries[i], params));
  }
  return buffer;
}

function encodeGeometry(
  geojson: Geometry,
  params: FullEncodingParameters,
  previous: number[],
  factors: number[],
  dimension: number,
  ids?: number[],
): number[] {
  const type = geojson.type;
  if (type === 'Point') return encodePoint(geojson as Point, previous, factors, dimension);
  if (type === 'LineString')
    return encodeLineString(geojson as LineString, previous, factors, dimension);
  if (type === 'Polygon') return encodePolygon(geojson as Polygon, previous, factors, dimension);
  if (type === 'MultiPoint')
    return encodeMultiPoint(geojson as MultiPoint, previous, factors, dimension, ids);
  if (type === 'MultiLineString')
    return encodeMultiLineString(geojson as MultiLineString, previous, factors, dimension, ids);
  if (type === 'MultiPolygon')
    return encodeMultiPolygon(geojson as MultiPolygon, previous, factors, dimension, ids);
  if (type === 'GeometryCollection')
    return encodeGeometryCollection(geojson as GeometryCollection, params, ids);
  return [];
}

/* geometry decoding */

function decodeSingleCoordinates(
  reader: ArrayReader,
  previous: number[],
  factors: number[],
  dimension: number,
): Position {
  const coordinates: Position = [];
  for (let i = 0; i < dimension; i++) {
    const delta = bytes2int(reader);
    const p = (previous[i] + delta) / factors[i];
    coordinates.push(p);
    previous[i] += delta;
  }
  return coordinates;
}

function decodeCoordinatesArray(
  reader: ArrayReader,
  previous: number[],
  factors: number[],
  dimension: number,
): Position[] {
  const array: Position[] = [];
  const n = bytes2int(reader, true);
  for (let i = 0; i < n; i++) {
    const coordinates: Position = [];
    for (let j = 0; j < dimension; j++) {
      const delta = bytes2int(reader);
      const p = (previous[j] + delta) / factors[j];
      coordinates.push(p);
      previous[j] += delta;
    }
    array.push(coordinates);
  }
  return array;
}

function closePolygonRing(array: Position[], dimension: number): void {
  const n = array.length;
  if (n < 3) return;
  const first = array[0];
  const last = array[n - 1];
  const copy: Position = [];
  let closed = true;
  for (let i = 0; i < dimension; i++) {
    copy.push(first[i]);
    if (first[i] !== last[i]) closed = false;
  }
  if (!closed) {
    array.push(copy);
  }
}

function decodePoint(
  reader: ArrayReader,
  previous: number[],
  factors: number[],
  dimension: number,
): Position {
  return decodeSingleCoordinates(reader, previous, factors, dimension);
}

function decodeLineString(
  reader: ArrayReader,
  previous: number[],
  factors: number[],
  dimension: number,
): Position[] {
  return decodeCoordinatesArray(reader, previous, factors, dimension);
}

function decodePolygon(
  reader: ArrayReader,
  previous: number[],
  factors: number[],
  dimension: number,
): Position[][] {
  const polygon: Position[][] = [];
  const n = bytes2int(reader, true);
  for (let i = 0; i < n; i++) {
    const ring = decodeCoordinatesArray(reader, previous, factors, dimension);
    closePolygonRing(ring, dimension);
    polygon.push(ring);
  }
  return polygon;
}

function decodeMultiPoint(
  reader: ArrayReader,
  previous: number[],
  factors: number[],
  dimension: number,
  includeIds: boolean,
): Position[] {
  const multipoint: Position[] = [];
  const n = bytes2int(reader, true);
  if (includeIds) decodeIdList(reader, n);
  for (let i = 0; i < n; i++) {
    multipoint.push(decodeSingleCoordinates(reader, previous, factors, dimension));
  }
  return multipoint;
}

function decodeMultiLineString(
  reader: ArrayReader,
  previous: number[],
  factors: number[],
  dimension: number,
  includeIds: boolean,
): Position[][] {
  const multilinestring: Position[][] = [];
  const n = bytes2int(reader, true);
  if (includeIds) decodeIdList(reader, n);
  for (let i = 0; i < n; i++) {
    multilinestring.push(decodeCoordinatesArray(reader, previous, factors, dimension));
  }
  return multilinestring;
}

function decodeMultiPolygon(
  reader: ArrayReader,
  previous: number[],
  factors: number[],
  dimension: number,
  includeIds: boolean,
): Position[][][] {
  const multipolygon: Position[][][] = [];
  const n = bytes2int(reader, true);
  if (includeIds) decodeIdList(reader, n);
  for (let i = 0; i < n; i++) {
    const polygon: Position[][] = [];
    const m = bytes2int(reader, true);
    for (let j = 0; j < m; j++) {
      const ring = decodeCoordinatesArray(reader, previous, factors, dimension);
      closePolygonRing(ring, dimension);
      polygon.push(ring);
    }
    multipolygon.push(polygon);
  }
  return multipolygon;
}

function decodeGeometryCollection(reader: ArrayReader, includeIds: boolean): Geometry[] {
  const collection: Geometry[] = [];
  const n = bytes2int(reader, true);
  if (includeIds) decodeIdList(reader, n);
  for (let i = 0; i < n; i++) {
    collection.push(decodeGeoJSON(reader));
  }
  return collection;
}

function decodeGeometry(
  reader: ArrayReader,
  type: string,
  previous: number[],
  factors: number[],
  dimension: number,
  includeIds: boolean,
): any {
  if (type === 'Point') return decodePoint(reader, previous, factors, dimension);
  if (type === 'LineString') return decodeLineString(reader, previous, factors, dimension);
  if (type === 'Polygon') return decodePolygon(reader, previous, factors, dimension);
  if (type === 'MultiPoint')
    return decodeMultiPoint(reader, previous, factors, dimension, includeIds);
  if (type === 'MultiLineString')
    return decodeMultiLineString(reader, previous, factors, dimension, includeIds);
  if (type === 'MultiPolygon')
    return decodeMultiPolygon(reader, previous, factors, dimension, includeIds);
  if (type === 'GeometryCollection') return decodeGeometryCollection(reader, includeIds);
  return undefined;
}

/* TWKB metadata */

function encodeIdList(ids: number[], count: number): number[] {
  const buffer: number[] = [];
  const n = ids.length;
  if (n !== count)
    throw new Error(`invalid ID list: id count (${n}) does not match geometry count (${count})`);
  for (let i = 0; i < n; i++) {
    append(buffer, int2bytes(ids[i]));
  }
  return buffer;
}

function decodeIdList(reader: ArrayReader, count: number): number[] {
  const ids: number[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(bytes2int(reader));
  }
  return ids;
}

function encodeBoundingBox(bbox: BBox | undefined, factors: number[], dimension: number): number[] {
  const buffer: number[] = [];
  if (!Array.isArray(bbox) || bbox.length !== dimension * 2)
    throw new Error('invalid bounding box: ' + bbox);
  for (let i = 0; i < dimension; i++) {
    const min = Math.round(bbox[i] * factors[i]);
    const max = Math.round(bbox[i + dimension] * factors[i]);
    const delta = max - min;
    append(buffer, int2bytes(min));
    append(buffer, int2bytes(delta));
  }
  return buffer;
}

function decodeBoundingBox(reader: ArrayReader, factors: number[], dimension: number): BBox {
  const bbox: BBox = [];
  for (let i = 0; i < dimension * 2; i++) bbox.push(0);
  for (let i = 0; i < dimension; i++) {
    const min = bytes2int(reader);
    const delta = bytes2int(reader);
    const max = min + delta;
    bbox[i] = min / factors[i];
    bbox[i + dimension] = max / factors[i];
  }
  return bbox;
}

function encodeSizeInfo(bboxBufferSize: number, geometryBufferSize: number): number[] {
  return int2bytes(bboxBufferSize + geometryBufferSize, true);
}

function decodeSizeInfo(reader: ArrayReader): number {
  return bytes2int(reader, true);
}

function detectEmpty(geojson: Geometry): boolean {
  if (geojson.type === 'GeometryCollection') {
    return geojson.geometries.length === 0;
  } else {
    return (geojson.coordinates as any[]).length === 0;
  }
}

function detectDimension(geojson: Geometry): number {
  const type = geojson.type;
  if (type === 'GeometryCollection') {
    let dimension = 0;
    for (let i = 0; i < geojson.geometries.length; i++) {
      const d = detectDimension(geojson.geometries[i]);
      if (d > dimension) dimension = d;
    }
    return dimension;
  } else {
    const coordinates = geojson.coordinates as any;
    if (type === 'Point') return coordinates.length;
    if (type === 'LineString') return coordinates[0].length;
    if (type === 'Polygon') return coordinates[0][0].length;
    if (type === 'MultiPoint') {
      for (let i = 0; i < coordinates.length; i++) {
        if (coordinates[i].length !== 0) return coordinates[i].length;
      }
      return 0;
    }
    if (type === 'MultiLineString') {
      for (let i = 0; i < coordinates.length; i++) {
        if (coordinates[i].length !== 0) return coordinates[i][0].length;
      }
      return 0;
    }
    if (type === 'MultiPolygon') {
      for (let i = 0; i < coordinates.length; i++) {
        if (coordinates[i].length !== 0) return coordinates[i][0][0].length;
      }
      return 0;
    }
  }
  return 0;
}

/* TWKB main */

const GEOMETRY_CODE: Record<string, number> = {
  Point: 1,
  LineString: 2,
  Polygon: 3,
  MultiPoint: 4,
  MultiLineString: 5,
  MultiPolygon: 6,
  GeometryCollection: 7,
};

const GEOMETRY_NAME: Record<number, string> = {
  1: 'Point',
  2: 'LineString',
  3: 'Polygon',
  4: 'MultiPoint',
  5: 'MultiLineString',
  6: 'MultiPolygon',
  7: 'GeometryCollection',
};

function encodeGeoJSON(geojson: Geometry, params: FullEncodingParameters): number[] {
  const buffer: number[] = [];
  const type = geojson.type;
  const code = GEOMETRY_CODE[type];
  if (!code) throw new Error('unknown geometry type: ' + type);
  const precisionXY = params.precisionXY;
  const precisionZ = params.precisionZ;
  const precisionM = params.precisionM;

  const headerByte = code | (zigzag(precisionXY) << 4);
  buffer.push(headerByte);

  let isEmpty = detectEmpty(geojson);
  const dimension = isEmpty ? 0 : detectDimension(geojson);
  if (dimension === 0) isEmpty = true;
  if (dimension === 1 || dimension > 4) {
    throw new Error('invalid coordinates dimension: ' + dimension);
  }

  const hasZ = dimension > 2;
  const hasM = dimension > 3;
  let ids: number[] | undefined;

  if (params.ids !== undefined) {
    if (code < 4) throw new Error('invalid ID list: not supported on simple geometry');
    ids = params.ids;
    params.ids = undefined;
  }

  const factorXY = Math.pow(10, precisionXY);
  const factorZ = Math.pow(10, precisionZ);
  const factorM = Math.pow(10, precisionM);
  const factors = [factorXY, factorXY, factorZ, factorM];

  let metadataByte = 0;
  if (params.includeBbox) metadataByte |= 1;
  if (params.includeSize) metadataByte |= 2;
  if (ids !== undefined) metadataByte |= 4;
  if (hasZ) metadataByte |= 8;
  if (isEmpty) metadataByte |= 16;
  buffer.push(metadataByte);

  if (hasZ) {
    let dimensionByte = 0;
    dimensionByte |= 1;
    dimensionByte |= params.precisionZ << 2;
    if (hasM) {
      dimensionByte |= 2;
      dimensionByte |= params.precisionM << 5;
    }
    buffer.push(dimensionByte);
  }

  if (isEmpty) {
    if (params.includeSize) {
      append(buffer, encodeSizeInfo(0, 0));
    }
    return buffer;
  }

  const previous = [0, 0, 0, 0];
  const geometryBuffer = encodeGeometry(geojson, params, previous, factors, dimension, ids);

  let bboxBuffer: number[] = [];
  if (params.includeBbox) {
    bboxBuffer = encodeBoundingBox(geojson.bbox, factors, dimension);
  }

  if (params.includeSize) {
    append(buffer, encodeSizeInfo(bboxBuffer.length, geometryBuffer.length));
  }

  if (params.includeBbox) {
    append(buffer, bboxBuffer);
  }

  append(buffer, geometryBuffer);
  return buffer;
}

function decodeGeoJSON(reader: ArrayReader): Geometry {
  const geojson: any = {};
  const headerByte = reader.next();
  const code = headerByte & 15;
  const type = GEOMETRY_NAME[code];
  geojson.type = type;
  const precisionXY = zagzig(headerByte >> 4);

  const metadataByte = reader.next();
  const isEmpty = (metadataByte & 16) !== 0;
  const hasExtraDimension = (metadataByte & 8) !== 0;
  const includeIds = (metadataByte & 4) !== 0;
  const includeSize = (metadataByte & 2) !== 0;
  const includeBbox = (metadataByte & 1) !== 0;

  let hasZ = false;
  let precisionZ = 0;
  let hasM = false;
  let precisionM = 0;

  if (hasExtraDimension) {
    const dimensionByte = reader.next();
    hasZ = (dimensionByte & 1) !== 0;
    if (hasZ) {
      precisionZ = (dimensionByte >> 2) & 7;
    }
    hasM = (dimensionByte & 2) !== 0;
    if (hasM) {
      precisionM = (dimensionByte >> 5) & 7;
    }
  }

  if (isEmpty) {
    if (type === 'GeometryCollection') {
      geojson.geometries = [];
    } else {
      geojson.coordinates = [];
    }
    return geojson as Geometry;
  }

  const dimension = hasM ? 4 : hasZ ? 3 : 2;
  const factorXY = Math.pow(10, precisionXY);
  const factorZ = Math.pow(10, precisionZ);
  const factorM = Math.pow(10, precisionM);
  const factors = [factorXY, factorXY, factorZ, factorM];

  if (includeSize) {
    decodeSizeInfo(reader);
  }

  if (includeBbox) {
    geojson.bbox = decodeBoundingBox(reader, factors, dimension);
  }

  const previous = [0, 0, 0, 0];
  const data = decodeGeometry(reader, type, previous, factors, dimension, includeIds);

  if (type === 'GeometryCollection') {
    geojson.geometries = data;
  } else {
    geojson.coordinates = data;
  }

  return geojson as Geometry;
}

export const DEFAULT_PRECISION = 6;

export const DEFAULT_ENCODING_PARAMETERS: EncodingParameters = {
  precisionM: 0,
  precisionZ: 0,
  includeBbox: false,
  includeSize: false,
  ids: undefined,
};

function createEncodingParams(
  precision: number,
  parameters: EncodingParameters,
): FullEncodingParameters {
  const precisionXY = precision;
  if (!Number.isInteger(precisionXY) || precisionXY < -7 || precisionXY > 7)
    throw new Error('invalid XY precision: ' + precisionXY);
  let precisionZ = 0;
  if (parameters.precisionZ !== undefined) {
    precisionZ = parameters.precisionZ;
    if (!Number.isInteger(precisionZ) || precisionZ < 0 || precisionZ > 7)
      throw new Error('invalid Z precision: ' + precisionZ);
  }
  let precisionM = 0;
  if (parameters.precisionM !== undefined) {
    precisionM = parameters.precisionM;
    if (!Number.isInteger(precisionM) || precisionM < 0 || precisionM > 7)
      throw new Error('invalid M precision: ' + precisionM);
  }
  const includeBbox = Boolean(parameters.includeBbox);
  const includeSize = Boolean(parameters.includeSize);
  let ids: number[] | undefined;
  if (parameters.ids !== undefined) {
    ids = parameters.ids;
    if (!Array.isArray(ids)) throw new Error('invalid ID list: not an array');
  }
  return {
    precisionXY,
    precisionZ,
    precisionM,
    includeBbox,
    includeSize,
    ids,
  };
}

function geojson2twkb(
  geojson: Geometry,
  precision: number,
  parameters: EncodingParameters,
): number[] {
  const params = createEncodingParams(precision, parameters);
  return encodeGeoJSON(geojson, params);
}

function twkb2geojson(array: number[] | Uint8Array): Geometry {
  const reader = newArrayReader(array);
  return decodeGeoJSON(reader);
}

// Declaraciones globales para soportar entornos NodeJS sin instalar @types/node enteros si no quieres.
declare let process: any;
declare let Buffer: any;

function detectNodeJS(): boolean {
  return typeof process !== 'undefined' && !!process.versions && !!process.versions.node;
}
const IS_NODE = detectNodeJS();

export const TWKB = {
  DEFAULT_PRECISION,
  DEFAULT_ENCODING_PARAMETERS,

  fromGeoJSON: (
    geojson: Geometry,
    precision: number = DEFAULT_PRECISION,
    parameters: EncodingParameters = DEFAULT_ENCODING_PARAMETERS,
  ) => {
    const array = geojson2twkb(geojson, precision, parameters);
    return {
      toArray: (): number[] => {
        return array;
      },
      toByteArray: (): Uint8Array => {
        return new Uint8Array(array);
      },
      toBase64: (): string => {
        return IS_NODE ? Buffer.from(array).toString('base64') : encodeBase64(array);
      },
    };
  },

  fromArray: (array: number[] | Uint8Array) => {
    return {
      toGeoJSON: (): Geometry => {
        return twkb2geojson(array);
      },
      toBase64: (): string => {
        return IS_NODE ? Buffer.from(array).toString('base64') : encodeBase64(array as number[]);
      },
    };
  },

  fromBase64: (base64: string) => {
    const array = IS_NODE ? Buffer.from(base64, 'base64') : decodeBase64(base64);
    return {
      toGeoJSON: (): Geometry => {
        return twkb2geojson(array);
      },
      toArray: (): number[] => {
        return IS_NODE ? Array.from(array) : (array as number[]);
      },
      toByteArray: (): Uint8Array => {
        return IS_NODE ? array : new Uint8Array(array as number[]);
      },
    };
  },
};
