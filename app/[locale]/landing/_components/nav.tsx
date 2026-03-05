'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LogoIcon } from '@/app/_components/logo-icon';
import { LandingThemeToggle } from './landing-theme-toggle';
import { LocaleSwitcher } from '@/app/_components/locale-switcher';
import { cn } from '@/lib/utils';

export function Nav() {
  const t = useTranslations('Landing.nav');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-white/5 dark:bg-[#08090f]/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="z-50 flex items-center gap-2.5">
          <LogoIcon className="h-7 w-7 text-[#3b82f6]" />
          <span className="font-heading text-lg font-bold tracking-tight">zustrack</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 md:flex">
          <LocaleSwitcher />
          <LandingThemeToggle />
          <a
            href="https://github.com/magutierrez/zustrack"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-white/50 dark:hover:bg-white/8 dark:hover:text-white"
            aria-label="GitHub"
          >
            <svg
              className="h-4.5 w-4.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <Link
            href="/app/login"
            className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-[#2563eb]"
          >
            {t('access')} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Navigation Toggle & Login (Always visible on right side) */}
        <div className="z-50 flex items-center gap-2 md:hidden">
          <Link
            href="/app/login"
            className="flex items-center gap-1 rounded-lg bg-[#3b82f6] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all active:scale-95"
          >
            {t('access')}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out md:hidden',
          isMobileMenuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl dark:border-white/5 dark:bg-[#08090f]/95">
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('language')}
              </span>
              <LocaleSwitcher />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('appearance')}
              </span>
              <LandingThemeToggle />
            </div>

            <a
              href="https://github.com/magutierrez/zustrack"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900 shadow-sm transition-all active:scale-95 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
