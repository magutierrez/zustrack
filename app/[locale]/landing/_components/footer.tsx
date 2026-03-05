import { getTranslations } from 'next-intl/server';
import { LogoIcon } from '@/app/_components/logo-icon';
import { Link } from '@/i18n/navigation';

export async function Footer() {
  const t = await getTranslations('Landing.footer');
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

        <p className="flex flex-col gap-y-3 text-xs text-slate-300 dark:text-white/20">
          <span> {new Date().getFullYear()} zustrack</span>
          <a
            href="https://github.com/magutierrez/zustrack"
            target="_blank"
            rel="noopener noreferrer"
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
          </a>
        </p>
      </div>
    </footer>
  );
}
