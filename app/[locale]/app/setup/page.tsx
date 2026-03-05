import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SetupPageClient } from './_components/setup-page-client';
import { setRequestLocale } from 'next-intl/server';

export const revalidate = false;

export default async function SetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const session = await auth();
  const { locale } = await params;

  setRequestLocale(locale);

  if (!session?.user) {
    redirect('/app/login');
  }

  return <SetupPageClient session={session} />;
}
