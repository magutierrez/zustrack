import { NextRequest, NextResponse } from 'next/server';
import { LineString, TWKB } from '@/lib/tkwb-parser';
import { base64ToUint8Array } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Only allow wikiloc.com URLs
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('wikiloc.com')) {
      return NextResponse.json({ error: 'Only Wikiloc URLs are supported' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        // Simulate navigating from within Wikiloc itself
        Referer: 'https://www.wikiloc.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch Wikiloc page: ${response.status}` },
        { status: response.status },
      );
    }

    const html = await response.text();

    // Strategy 1: Look for mapData object in script tags
    const mapDataMatch = html.match(/var\s+mapData\s*=\s*({[\s\S]*?});/);
    if (mapDataMatch) {
      try {
        const mapData = JSON.parse(mapDataMatch[1]);
        const trail = mapData.mapData?.[0];
        if (trail && trail.geom) {
          const geometry = TWKB.fromArray(base64ToUint8Array(trail.geom)).toGeoJSON() as LineString;

          const points = geometry.coordinates.map((coordinates) => ({
            lat: coordinates[1],
            lon: coordinates[0],
          }));

          if (points.length > 0) {
            return NextResponse.json({
              points,
              name: trail.nom || extractName(html),
            });
          }
        }
      } catch (e) {
        console.error('Error parsing mapData:', e);
      }
    }

    return NextResponse.json({ error: 'Could not find route data on the page' }, { status: 404 });
  } catch (error) {
    console.error('Wikiloc API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function extractName(html: string): string {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (titleMatch) {
    return titleMatch[1].trim().replace(/<[^>]+>/g, '');
  }
  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (ogTitleMatch) {
    return ogTitleMatch[1].trim();
  }
  return 'Wikiloc Route';
}
