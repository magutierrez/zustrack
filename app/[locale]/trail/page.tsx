import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { TrailSearchParams } from '@/lib/trails';
import { TrailSearchView } from '@/components/trail-detail/trail-search-view';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<TrailSearchParams>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });
  return { title: t('title') };
}

export default async function TrailSearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  return (
    <Suspense>
      <TrailSearchView locale={locale} sp={sp} />
    </Suspense>
  );
}
