/**
 * MapLibre GL transformRequest — proxies MapTiler tile requests through
 * NEXT_PUBLIC_PROXY_TILES_DOMAIN (if set) and strips the API key from the URL.
 * Pass this to every <Map> component from react-map-gl/maplibre.
 */
export function transformRequest(url: string): { url: string } {
  const PROXY_DOMAIN = process.env.NEXT_PUBLIC_PROXY_TILES_DOMAIN;

  if (PROXY_DOMAIN && url.includes('api.maptiler.com')) {
    const newUrl = url.replace('api.maptiler.com', PROXY_DOMAIN);
    const urlObj = new URL(newUrl);
    urlObj.searchParams.delete('key');
    return { url: urlObj.toString() };
  }

  return { url };
}
