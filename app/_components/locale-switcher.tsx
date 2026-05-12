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
  const { replace, refresh } = useRouter();
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
      replace(
        { pathname, query: Object.fromEntries(params.entries()) },
        { locale: nextLocale },
      );

      refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative size-9', isPending && 'opacity-50')}
          disabled={isPending}
        >
          <Globe className={cn('size-5', isPending && 'animate-spin')} />
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
    <Suspense fallback={<div className="size-9" />}>
      <LocaleSwitcherContent />
    </Suspense>
  );
}
