import { pickText, type Locale } from '@river/i18n';
import { acquiringModelLabels, type AcquiringTerms } from '@river/psp-contracts';
import { money, percent } from '@/lib/format';
import { lt } from '@/lib/lt';

/**
 * The headline of one channel's acquiring terms: the channel, the model and its rate, the fixed part, and
 * the on-us rate where the agreement has one — `Online: Interchange++, markup 0.25 % · on-us 0.55 %`.
 */
export function termsText(terms: AcquiringTerms, currency: string, locale: Locale): string {
  const t = lt(locale);
  const rate = (bps: number) => percent(bps, locale, 2);
  const fixed = terms.fixedMinor > 0 ? money(terms.fixedMinor, currency, locale) : null;
  const channel = terms.channel === 'online' ? t('Online', 'Онлайн') : t('In store', 'У магазинах');
  const blended = terms.blendedBps ?? 0;
  const head = terms.model === 'ic_plus_plus'
    ? `${pickText(acquiringModelLabels.ic_plus_plus, locale)}, ${t('markup', 'націнка')} ${rate(terms.markupBps ?? 0)}${fixed ? ` + ${fixed}` : ''}`
    : blended === 0 && fixed ? t(`${fixed} per payment`, `${fixed} за платіж`)
    : blended === 0 ? t('no fee', 'без комісії')
    : `${pickText(acquiringModelLabels.blended, locale).toLowerCase()} ${rate(blended)}${fixed ? ` + ${fixed}` : ''}`;
  return `${channel}: ${head}${terms.onUsBps !== null ? ` · on-us ${rate(terms.onUsBps)}` : ''}`;
}
