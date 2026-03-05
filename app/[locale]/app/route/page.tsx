import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/auth';
import HomePageClient from './_components/home-page-client';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  return <HomePageClient session={session} />;
}
