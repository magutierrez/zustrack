import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.zustrack.com';

const PUBLIC_PATHS = ['', '/trail', '/trail/es', '/trail/it', '/terms', '/privacy'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  for (const path of PUBLIC_PATHS) {
    const localizedUrls = Object.fromEntries(
      routing.locales.map((locale) => [locale, `${BASE_URL}/${locale}${path}`]),
    );

    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'weekly' : path.startsWith('/trail') ? 'daily' : 'monthly',
        priority: path === '' ? 1 : path.startsWith('/trail') ? 0.8 : 0.6,
        alternates: {
          languages: {
            ...localizedUrls,
            'x-default': `${BASE_URL}/en${path}`,
          },
        },
      });
    }
  }

  // Trail pages — one URL per locale per trail
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Fetch all trails using pagination (Supabase default limit is 1000)
    let allTrails: any[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
      const { data: trails, error } = await supabase
        .from('trails')
        .select('country, slug, created_at')
        .range(from, from + PAGE_SIZE - 1);

      if (error || !trails || trails.length === 0) break;
      allTrails = allTrails.concat(trails);
      if (trails.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (allTrails.length > 0) {
      for (const trail of allTrails) {
        const trailPath = `/trail/${trail.country}/${trail.slug}`;
        const localizedUrls = Object.fromEntries(
          routing.locales.map((locale) => [locale, `${BASE_URL}/${locale}${trailPath}`]),
        );

        for (const locale of routing.locales) {
          entries.push({
            url: `${BASE_URL}/${locale}${trailPath}`,
            lastModified: trail.created_at ? new Date(trail.created_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
            alternates: {
              languages: {
                ...localizedUrls,
                'x-default': `${BASE_URL}/en${trailPath}`,
              },
            },
          });
        }
      }
    }
  } catch (err) {
    console.error('Sitemap generation error:', err);
    // Supabase not configured or query failed — skip trail entries
  }

  return entries;
}
