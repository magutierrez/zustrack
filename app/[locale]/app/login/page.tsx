// OAuth provider availability is determined by env vars baked in at build time.
// ISR 1 h is conservative but safe for a login page.
export const revalidate = 3600;

import { setRequestLocale } from 'next-intl/server';
import { LoginPageClient } from './_components/login-page-client';

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
  return <LoginPageClient providers={providers} />;
}
