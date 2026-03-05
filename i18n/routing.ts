import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'ca', 'fr', 'it'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeCookie: false,
});
