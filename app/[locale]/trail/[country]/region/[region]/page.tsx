import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getAllCountryRegions, getRegions, slugToRegion } from '@/lib/trails';
import { TrailSearchView } from '@/components/trail-detail/trail-search-view';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.zustrack.com';

interface PageProps {
  params: Promise<{ locale: string; country: string; region: string }>;
}

export async function generateStaticParams() {
  // Returns [{country, region}] — Next.js combines with locales from parent layout
  return getAllCountryRegions();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country, region: slug } = await params;

  const regions = await getRegions(country, locale);
  const regionValue = slugToRegion(
    regions.map((r) => r.value),
    slug,
  );
  if (!regionValue) return {};

  const regionLabel = regions.find((r) => r.value === regionValue)?.label ?? regionValue;
  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });

  const title = t('titleWithRegion', { regionName: regionLabel });
  const description = t('metaDescriptionRegion', { regionName: regionLabel });
  const canonicalUrl = `${BASE_URL}/${locale}/trail/${country}/region/${slug}`;
  const alternateLanguages = Object.fromEntries(
    routing.locales.map((lang) => [lang, `${BASE_URL}/${lang}/trail/${country}/region/${slug}`]),
  );

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...alternateLanguages,
        'x-default': `${BASE_URL}/en/trail/${country}/region/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [{ url: `${BASE_URL}/og.png`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function RegionPage({ params }: PageProps) {
  const { locale, country, region: slug } = await params;
  setRequestLocale(locale);

  const regions = await getRegions(country, locale);
  const regionValue = slugToRegion(
    regions.map((r) => r.value),
    slug,
  );
  if (!regionValue) notFound();

  const regionLabel = regions.find((r) => r.value === regionValue)?.label ?? regionValue;
  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });

  const canonicalUrl = `${BASE_URL}/${locale}/trail/${country}/region/${slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('titleWithRegion', { regionName: regionLabel }),
    description: t('metaDescriptionRegion', { regionName: regionLabel }),
    url: canonicalUrl,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'zustrack', item: `${BASE_URL}/${locale}` },
        {
          '@type': 'ListItem',
          position: 2,
          name: t('title'),
          item: `${BASE_URL}/${locale}/trail`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: country.toUpperCase(),
          item: `${BASE_URL}/${locale}/trail/${country}`,
        },
        { '@type': 'ListItem', position: 4, name: regionLabel, item: canonicalUrl },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <TrailSearchView locale={locale} country={country} sp={{ region: regionValue }} />
      </Suspense>
    </>
  );
}
