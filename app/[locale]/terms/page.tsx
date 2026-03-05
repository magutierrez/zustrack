import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mountain, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { routing } from '@/i18n/routing';

export const revalidate = false;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.zustrack.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Terms' });
  const canonicalUrl = `${BASE_URL}/${locale}/terms`;
  const alternateLanguages = Object.fromEntries(
    routing.locales.map((lang) => [lang, `${BASE_URL}/${lang}/terms`]),
  );
  return {
    title: t('title'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...alternateLanguages,
        'x-default': `${BASE_URL}/en/terms`,
      },
    },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Terms' });

  return (
    <div className="bg-background flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/app/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Mountain className="text-primary h-6 w-6" />
            <span className="text-xl font-bold">zustrack</span>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 leading-relaxed">
            <p className="text-muted-foreground text-lg">{t('acceptance')}</p>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">{t('noResponsibilityTitle')}</h2>
              <p className="text-muted-foreground">{t('noResponsibilityContent')}</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">{t('userResponsibilityTitle')}</h2>
              <p className="text-muted-foreground">{t('userResponsibilityContent')}</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">{t('openSourceTitle')}</h2>
              <p className="text-muted-foreground">{t('openSourceContent')}</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">{t('dataLossTitle')}</h2>
              <p className="text-muted-foreground">{t('dataLossContent')}</p>
            </section>
          </CardContent>
        </Card>

        <footer className="text-muted-foreground py-8 text-center text-sm">
          {new Date().getFullYear()} zustrack.
        </footer>
      </div>
    </div>
  );
}
