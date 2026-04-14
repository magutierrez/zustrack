import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getTrail, getTrailStaticParams } from '@/lib/trails';
import { TrailDetailView } from '@/components/trail-detail/trail-detail-view';
import { routing } from '@/i18n/routing';

export const revalidate = 3600; // ISR: regenera como máximo 1 vez/hora por URL

export async function generateStaticParams() {
  const trails = await getTrailStaticParams();
  return routing.locales.flatMap((locale) =>
    trails.map(({ country, slug }) => ({ locale, country, slug })),
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.zustrack.com';

type PageParams = { locale: string; country: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, country, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'TrailPage' });
  const trail = await getTrail(country, slug);

  if (!trail) return { title: t('notFound') };

  const effortLabel =
    trail.effort_level === 'very_hard'
      ? t('veryHard')
      : t(trail.effort_level as 'easy' | 'moderate' | 'hard');

  const description = t('metaDescription', {
    distance: trail.distance_km.toFixed(1),
    elevationGain: trail.elevation_gain_m,
    effort: effortLabel,
  });

  const canonicalUrl = `${BASE_URL}/${locale}/trail/${country}/${slug}`;
  const alternateLanguages = Object.fromEntries(
    routing.locales.map((lang) => [lang, `${BASE_URL}/${lang}/trail/${country}/${slug}`]),
  );

  return {
    title: trail.name,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...alternateLanguages,
        'x-default': `${BASE_URL}/en/trail/${country}/${slug}`,
      },
    },
    openGraph: {
      title: trail.name,
      description,
      url: canonicalUrl,
      type: 'article',
      locale,
      images: [{ url: `${BASE_URL}/og.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: trail.name,
      description,
    },
  };
}

export default async function TrailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, country, slug } = await params;

  setRequestLocale(locale);

  const trail = await getTrail(country, slug);
  if (!trail) notFound();

  const t = await getTranslations({ locale, namespace: 'TrailPage' });
  const effortLabel =
    trail.effort_level === 'very_hard'
      ? t('veryHard')
      : t(trail.effort_level as 'easy' | 'moderate' | 'hard');
  const description = t('metaDescription', {
    distance: trail.distance_km.toFixed(1),
    elevationGain: trail.elevation_gain_m,
    effort: effortLabel,
  });

  const canonicalUrl = `${BASE_URL}/${locale}/trail/${country}/${slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: trail.name,
      description,
      url: canonicalUrl,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: trail.start_lat,
        longitude: trail.start_lng,
      },
      ...(trail.region || trail.place
        ? {
            address: {
              '@type': 'PostalAddress',
              addressCountry: country.toUpperCase(),
              ...(trail.region
                ? { addressRegion: trail.region_i18n?.[locale] ?? trail.region }
                : {}),
              ...(trail.place ? { addressLocality: trail.place } : {}),
            },
          }
        : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'zustrack', item: `${BASE_URL}/${locale}` },
        {
          '@type': 'ListItem',
          position: 2,
          name: t('backToTrails'),
          item: `${BASE_URL}/${locale}/trail`,
        },
        { '@type': 'ListItem', position: 3, name: trail.name, item: canonicalUrl },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrailDetailView trail={trail} locale={locale} />
    </>
  );
}
