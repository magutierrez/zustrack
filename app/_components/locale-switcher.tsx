'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { useTransition, Suspense } from 'react';

type Locale = (typeof routing.locales)[number];

function LocaleSwitcherContent() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const onSelectChange = (nextLocale: Locale) => {
    const params = new URLSearchParams(searchParams.toString());
    startTransition(() => {
      router.replace(
        {
          pathname,
          query: Object.fromEntries(params.entries()),
        },
        { locale: nextLocale },
      );
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t('switchLocale')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end" forceMount>
        <DropdownMenuItem onClick={() => onSelectChange('en')} disabled={locale === 'en'}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange('es')} disabled={locale === 'es'}>
          Español
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange('ca')} disabled={locale === 'ca'}>
          Català
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LocaleSwitcher() {
  return (
    <Suspense
      fallback={
        <Button variant="ghost" size="icon" className="relative h-9 w-9" disabled>
          <Globe className="h-5 w-5 opacity-50" />
        </Button>
      }
    >
      <LocaleSwitcherContent />
    </Suspense>
  );
}
