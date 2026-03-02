'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LogoIcon } from '@/app/_components/logo-icon';

export function Footer() {
  const t = useTranslations('Landing.footer');
  return (
    <footer className="border-t border-slate-200 py-10 dark:border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <LogoIcon className="h-6 w-6 text-[#3b82f6]" />
          <span className="font-heading text-sm font-bold text-slate-500 dark:text-white/70">
            zustrack
          </span>
        </div>
        <div className="flex gap-6">
          {[
            { label: t('privacy'), href: '/privacy' },
            { label: t('terms'), href: '/terms' },
            { label: t('login'), href: '/app/login' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs text-slate-400 transition-colors hover:text-slate-700 dark:text-white/35 dark:hover:text-white/70"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <p className="text-xs text-slate-300 dark:text-white/20">
          © {new Date().getFullYear()} zustrack
        </p>
      </div>
    </footer>
  );
}
