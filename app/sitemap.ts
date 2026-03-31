import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.zustrack.com';

const PUBLIC_PATHS = ['', '/trail', '/terms', '/privacy'];

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
        changeFrequency: path === '' ? 'weekly' : path === '/trail' ? 'daily' : 'monthly',
        priority: path === '' ? 1 : path === '/trail' ? 0.8 : 0.6,
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
    const { data: trails } = await supabase.from('trails').select('country, slug, created_at');

    if (trails) {
      for (const trail of trails) {
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
  } catch {
    // Supabase not configured — skip trail entries
  }

  return entries;
}
