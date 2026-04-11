import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Header } from '@/app/_components/header';
import { Map, MountainSnow } from 'lucide-react';
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.zustrack.com';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });

  const canonicalUrl = `${BASE_URL}/${locale}/trail`;
  const alternateLanguages = Object.fromEntries(
    routing.locales.map((lang) => [lang, `${BASE_URL}/${lang}/trail`]),
  );

  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...alternateLanguages,
        'x-default': `${BASE_URL}/en/trail`,
      },
    },
  };
}

export default async function TrailIndexPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#08090f]">
      <Header session={null} />

      <main className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            {t('subtitle')}
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
          <Link
            href={`/${locale}/trail/es`}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-blue-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-blue-100 p-4 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Map className="h-8 w-8" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">España</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Explora senderos de Gran Recorrido, Vías Verdes y rutas locales por toda la
                península y las islas.
              </p>
            </div>
          </Link>

          <Link
            href={`/${locale}/trail/it`}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-emerald-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-emerald-100 p-4 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <MountainSnow className="h-8 w-8" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Italia</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Scopri i sentieri CAI, le Alte Vie e i percorsi storici attraverso le Alpi, gli
                Appennini e oltre.
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
