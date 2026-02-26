import { auth } from '@/auth';
import HomePageClient from './_components/home-page-client';

export default async function HomePage() {
  const session = await auth();

  return <HomePageClient session={session} />;
}
