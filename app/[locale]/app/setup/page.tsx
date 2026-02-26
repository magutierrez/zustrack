import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SetupPageClient } from './_components/setup-page-client';

export default async function SetupPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/app/login');
  }

  return <SetupPageClient session={session} />;
}
