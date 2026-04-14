import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { TrailSearchParams } from '@/lib/trails';
import { getTrailCountries } from '@/lib/trails';
import { TrailSearchView } from '@/components/trail-detail/trail-search-view';
import { routing } from '@/i18n/routing';

// Define valid country routes so Vercel knows these paths exist.
// The page remains dynamic (reads searchParams) but the routes are recognized.
export async function generateStaticParams() {
  const countries = await getTrailCountries();
  return routing.locales.flatMap((locale) =>
    countries.map((country) => ({ locale, country })),
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.zustrack.com';

interface PageProps {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<TrailSearchParams>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country } = await params;
  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });
  const countryNameKeys: Record<string, 'countryName.es' | 'countryName.it'> = {
    es: 'countryName.es',
    it: 'countryName.it',
  };
  const pageTitle = countryNameKeys[country]
    ? t('titleWithCountry', { countryName: t(countryNameKeys[country]) })
    : t('title');

  const canonicalUrl = `${BASE_URL}/${locale}/trail/${country}`;
  const alternateLanguages = Object.fromEntries(
    routing.locales.map((lang) => [lang, `${BASE_URL}/${lang}/trail/${country}`]),
  );

  return {
    title: pageTitle,
    description: t('metaDescription'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...alternateLanguages,
        'x-default': `${BASE_URL}/en/trail/${country}`,
      },
    },
    openGraph: {
      title: pageTitle,
      description: t('metaDescription'),
      url: canonicalUrl,
      type: 'website',
      images: [{ url: `${BASE_URL}/og.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: t('metaDescription'),
    },
  };
}

export default async function TrailSearchCountryPage({ params, searchParams }: PageProps) {
  const { locale, country } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });
  const countryNameKeys: Record<string, 'countryName.es' | 'countryName.it'> = {
    es: 'countryName.es',
    it: 'countryName.it',
  };
  const pageTitle = countryNameKeys[country]
    ? t('titleWithCountry', { countryName: t(countryNameKeys[country]) })
    : t('title');
  const canonicalUrl = `${BASE_URL}/${locale}/trail/${country}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: t('metaDescription'),
    url: canonicalUrl,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'zustrack', item: `${BASE_URL}/${locale}` },
        { '@type': 'ListItem', position: 2, name: t('title'), item: `${BASE_URL}/${locale}/trail` },
        { '@type': 'ListItem', position: 3, name: country.toUpperCase(), item: canonicalUrl },
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
        <TrailSearchView locale={locale} country={country} sp={sp} />
      </Suspense>
    </>
  );
}
