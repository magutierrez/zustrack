import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getTrail } from '@/lib/trails';
import { TrailDetailView } from '@/components/trail-detail/trail-detail-view';
import { auth } from '@/auth';

// export const generateStaticParams = getTrailStaticParams;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string; slug: string }>;
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

  return {
    title: trail.name,
    description,
    openGraph: { title: trail.name, description, type: 'article' },
  };
}

export default async function TrailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; slug: string }>;
}) {
  const { locale, country, slug } = await params;

  setRequestLocale(locale);

  const [trail, session] = await Promise.all([getTrail(country, slug), auth()]);
  if (!trail) notFound();

  return <TrailDetailView trail={trail} locale={locale} isAuthenticated={!!session?.user} />;
}
