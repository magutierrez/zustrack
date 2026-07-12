export interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

export interface ChartPoint {
  distance: number;
  elevation: number;
  slope: number;
  color: string;
}

export interface Labels {
  elevationProfile: string;
  slope: string;
  flat: string;
  gentle: string;
  steep: string;
  extreme: string;
  km: string;
  meters: string;
  resetZoom: string;
}

export interface TooltipState {
  x: number;
  y: number;
  dist: number;
  ele: number;
  slope: number;
  color: string;
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
