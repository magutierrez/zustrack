'use client';

import { useLocale } from 'next-intl';
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
import { cn } from '@/lib/utils';

type Locale = (typeof routing.locales)[number];

function LocaleSwitcherContent() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const labels: Record<string, string> = {
    en: 'English',
    es: 'Español',
    ca: 'Català',
    fr: 'Français',
    it: 'Italiano',
    de: 'Deutsch',
  };

  const onSelectChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return;

    const params = new URLSearchParams(searchParams.toString());

    startTransition(() => {
      router.replace(
        { pathname, query: Object.fromEntries(params.entries()) },
        { locale: nextLocale },
      );

      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative h-9 w-9', isPending && 'opacity-50')}
          disabled={isPending}
        >
          <Globe className={cn('h-5 w-5', isPending && 'animate-spin')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => onSelectChange(loc)}
            className={cn(locale === loc && 'bg-muted font-bold')}
          >
            {labels[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LocaleSwitcher() {
  return (
    <Suspense fallback={<div className="h-9 w-9" />}>
      <LocaleSwitcherContent />
    </Suspense>
  );
}
