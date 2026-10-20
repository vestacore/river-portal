import type { Locale } from '@river/i18n';

/**
 * Texts of the PSP portal are written where they are used, both languages side by side, so that neither
 * can be forgotten: `const t = lt(locale); t('Orders', 'Замовлення')`.
 */
export function lt(locale: Locale): (en: string, uk: string) => string {
  return (en, uk) => (locale === 'uk' ? uk : en);
}
