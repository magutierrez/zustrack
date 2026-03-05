// Static: auth is handled by middleware. Session is read client-side via useSession().
export const revalidate = false;

import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import HomePageClient from './_components/home-page-client';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Suspense is required because HomePageClient uses useSearchParams()
  return (
    <Suspense>
      <HomePageClient session={null} />
    </Suspense>
  );
}
