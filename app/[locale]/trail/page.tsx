import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { TrailSearchParams } from '@/lib/trails';
import { TrailSearchView } from '@/components/trail-detail/trail-search-view';
import { routing } from '@/i18n/routing';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.zustrack.com';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<TrailSearchParams>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });

  const canonicalUrl = `${BASE_URL}/${locale}/trail`;
  const alternateLanguages = Object.fromEntries(
    routing.locales.map((lang) => [lang, `${BASE_URL}/${lang}/trail`]),
  );

  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...alternateLanguages,
        'x-default': `${BASE_URL}/en/trail`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('metaDescription'),
      url: canonicalUrl,
      type: 'website',
      images: [{ url: `${BASE_URL}/og.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('metaDescription'),
    },
  };
}

export default async function TrailSearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });
  const canonicalUrl = `${BASE_URL}/${locale}/trail`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('title'),
    description: t('metaDescription'),
    url: canonicalUrl,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'zustrack', item: `${BASE_URL}/${locale}` },
        { '@type': 'ListItem', position: 2, name: t('title'), item: canonicalUrl },
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
        <TrailSearchView locale={locale} sp={sp} />
      </Suspense>
    </>
  );
}
