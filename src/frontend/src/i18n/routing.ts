import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ja', 'en', 'fr', 'zh', 'ru', 'es', 'ar'],
  defaultLocale: 'ja',
});
