import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { LoginPageClient } from './_components/login-page-client';

export const revalidate = false;

function getAvailableProviders() {
  return {
    google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    strava: !!(process.env.AUTH_STRAVA_ID && process.env.AUTH_STRAVA_SECRET),
    facebook: !!(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET),
    twitter: !!(process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET),
  };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const providers = getAvailableProviders();
  return (
    <Suspense>
      <LoginPageClient providers={providers} />
    </Suspense>
  );
}
