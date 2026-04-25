import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import React from 'react';
import { SessionProvider } from 'next-auth/react';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.zustrack.com';

const META = {
  en: {
    title: 'zustrack — Analyze your next route. Master the road',
    description:
      'Upload your GPX or import from Strava. Get point-by-point weather forecast, elevation analysis, risk detection and mobile coverage for your cycling and hiking routes.',
    keywords:
      'gpx weather forecast, cycling route weather, hiking weather, route planner, gpx analyzer, strava weather import, outdoor forecast, trail conditions, wind forecast cycling',
    ogLocale: 'en_US',
  },
  es: {
    title: 'zustrack — Analiza tu próxima ruta. Domina el camino',
    description:
      'Sube tu ruta GPX o importa desde Strava. Pronóstico del tiempo punto a punto, perfil de elevación, análisis de terreno, detección de riesgos y cobertura móvil para ciclismo y senderismo.',
    keywords:
      'pronóstico ruta gpx, tiempo para ciclistas, meteorología senderismo, analizador gpx, planificación ruta, importar strava, forecast outdoor, condiciones trail, viento ciclismo',
    ogLocale: 'es_ES',
  },
  ca: {
    title: 'zustrack — Analitza la teva propera ruta. Domina el camí',
    description:
      "Puja la teva ruta GPX o importa des de Strava. Predicció del temps punt a punt, perfil d'elevació, anàlisi del terreny, detecció de riscos i cobertura mòbil per a ciclisme i senderisme.",
    keywords:
      'predicció ruta gpx, temps ciclistes, meteorologia senderisme, analitzador gpx, planificació ruta, importar strava, forecast outdoor, condicions trail, vent ciclisme',
    ogLocale: 'ca_ES',
  },
  fr: {
    title: 'zustrack — Analysez votre prochain itinéraire. Maîtrisez la route',
    description:
      'Importez votre itinéraire GPX ou depuis Strava. Prévisions météo point par point, profil altimétrique, analyse du terrain, détection des risques et couverture mobile pour le cyclisme et la randonnée.',
    keywords:
      'prévisions météo gpx, météo route cyclisme, météo randonnée, planificateur itinéraire, analyseur gpx, import strava météo, prévisions outdoor, conditions trail, vent cyclisme',
    ogLocale: 'fr_FR',
  },
  it: {
    title: 'zustrack — Analizza il tuo prossimo percorso. Padroneggia la strada',
    description:
      'Carica il tuo percorso GPX o importa da Strava. Previsioni meteo punto per punto, profilo altimetrico, analisi del terreno, rilevamento rischi e copertura mobile per ciclismo ed escursionismo.',
    keywords:
      'previsioni meteo gpx, meteo percorso ciclismo, meteo escursionismo, pianificatore percorso, analizzatore gpx, import strava meteo, previsioni outdoor, condizioni trail, vento ciclismo',
    ogLocale: 'it_IT',
  },
  de: {
    title: 'zustrack — Analysiere deine nächste Route. Beherrsche den Weg',
    description:
      'Lade deine GPX-Route hoch oder importiere sie von Strava. Erhalte punktgenaue Wettervorhersagen, Höhenanalysen, Risikoerkennung und Mobilfunkabdeckung für deine Rad- und Wanderrouten.',
    keywords:
      'gpx wettervorhersage, radroute wetter, wanderwetter, routenplaner, gpx analysator, strava wetter import, outdoor vorhersage, trailbedingungen, windvorhersage radfahren',
    ogLocale: 'de_DE',
  },
} satisfies Record<
  string,
  { title: string; description: string; keywords: string; ogLocale: string }
>;

type Locale = keyof typeof META;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const m = META[(locale as Locale) in META ? (locale as Locale) : 'en'];
  const canonicalUrl = `${BASE_URL}/${locale}`;

  const alternateLanguages = Object.fromEntries(
    (Object.keys(META) as Locale[]).map((lang) => [lang, `${BASE_URL}/${lang}`]),
  );

  const alternateOgLocales = (Object.entries(META) as [Locale, (typeof META)[Locale]][])
    .filter(([lang]) => lang !== locale)
    .map(([, v]) => v.ogLocale);

  return {
    title: {
      default: m.title,
      template: '%s | zustrack',
    },
    description: m.description,
    keywords: m.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...alternateLanguages,
        'x-default': `${BASE_URL}/en`,
      },
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      siteName: 'zustrack',
      title: m.title,
      description: m.description,
      locale: m.ogLocale,
      alternateLocale: alternateOgLocales,
      images: [
        {
          url: '/og.png',
          width: 1200,
          height: 630,
          alt: m.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
      images: ['/og.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

function buildJsonLd(locale: string, m: { title: string; description: string }) {
  const canonicalUrl = `${BASE_URL}/${locale}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'zustrack',
    url: canonicalUrl,
    description: m.description,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    featureList: [
      'GPX route upload',
      'Strava import',
      'Point-by-point weather forecast',
      'Elevation analysis',
      'Risk detection',
      'Mobile coverage map',
    ],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const m = META[(locale as Locale) in META ? (locale as Locale) : 'en'];
  const jsonLd = buildJsonLd(locale, m);

  return (
    <SessionProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </SessionProvider>
  );
}
