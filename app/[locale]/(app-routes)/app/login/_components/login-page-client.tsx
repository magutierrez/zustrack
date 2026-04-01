'use client';

import { signIn } from 'next-auth/react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { LocaleSwitcher } from '@/app/_components/locale-switcher';
import { LogoIcon } from '@/app/_components/logo-icon';

interface Providers {
  google: boolean;
  strava: boolean;
  facebook: boolean;
  twitter: boolean;
}

interface LoginPageClientProps {
  providers: Providers;
}

export function LoginPageClient({ providers }: LoginPageClientProps) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl');
  // Only allow relative URLs to prevent open redirect
  const redirectTo = rawCallback?.startsWith('/') ? rawCallback : `/${locale}/app/setup`;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <Card className="border-border w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
              <LogoIcon className="text-primary h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">{t('welcome')}</CardTitle>
            <CardDescription>{t('loginDescription')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {providers.google && (
            <Button
              variant="outline"
              className="border-border bg-card hover:bg-muted h-12"
              onClick={() => signIn('google', { redirectTo })}
            >
              <svg
                className="mr-2 h-5 w-5"
                aria-hidden="true"
                focusable="false"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                />
              </svg>
              {t('continueGoogle')}
            </Button>
          )}

          {providers.strava && (
            <Button
              variant="outline"
              className="border-border bg-card text-foreground hover:bg-muted h-12"
              onClick={() => signIn('strava', { redirectTo })}
            >
              <svg
                className="mr-2 h-5 w-5 fill-current text-[#FC6719]"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-4.116l2.736 5.467h4.161L8.379 0 1 13.828h4.161" />
              </svg>
              {t('continueStrava')}
            </Button>
          )}

          {providers.facebook && (
            <Button
              variant="outline"
              className="h-12"
              onClick={() => signIn('facebook', { redirectTo })}
            >
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                fill="#1877F2"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              {t('continueFacebook')}
            </Button>
          )}

          {providers.twitter && (
            <Button
              variant="outline"
              className="border-border bg-card text-foreground hover:bg-muted h-12"
              onClick={() => signIn('twitter', { redirectTo })}
            >
              <svg className="mr-2 h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 7.717 8.502 11.25h-6.657l-5.214-6.817L4.99 21.25H1.68l7.73-8.235L1.25 2.25h6.826l4.717 6.176L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
              </svg>
              {t('continueX')}
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center">
          <p className="text-muted-foreground px-8 text-xs leading-relaxed">
            {t.rich('termsLinks', {
              terms: (chunks) => (
                <Link href="/terms" className="text-primary font-semibold hover:underline">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" className="text-primary font-semibold hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
