export const revalidate = false;

import { setRequestLocale } from 'next-intl/server';
import { Nav } from './landing/_components/nav';
import { Hero } from './landing/_components/hero';
import { Features } from './landing/_components/features';
import { HowItWorks } from './landing/_components/how-it-works';
import { ImportSources } from './landing/_components/import-sources';
import { DataSources } from './landing/_components/data-sources';
import { FinalCTA } from './landing/_components/final-cta';
import { Footer } from './landing/_components/footer';

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#08090f] dark:text-white">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <ImportSources />
      <DataSources />
      <FinalCTA />
      <Footer />
    </div>
  );
}
