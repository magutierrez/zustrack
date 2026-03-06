// Static: auth is handled by middleware. Session is read client-side via useSession().
export const revalidate = false;

import { setRequestLocale } from 'next-intl/server';
import { SetupPageClient } from './_components/setup-page-client';

export default async function SetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SetupPageClient session={null} />;
}
