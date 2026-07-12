'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-zinc-300 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white"
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </button>
  );
}
