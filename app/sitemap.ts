import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://zustrack.com';

const PUBLIC_PATHS = ['', '/terms', '/privacy'];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of PUBLIC_PATHS) {
    const localizedUrls = Object.fromEntries(
      routing.locales.map((locale) => [locale, `${BASE_URL}/${locale}${path}`]),
    );

    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1 : 0.6,
        alternates: {
          languages: {
            ...localizedUrls,
            'x-default': `${BASE_URL}/en${path}`,
          },
        },
      });
    }
  }

  return entries;
}
