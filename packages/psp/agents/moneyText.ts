import { formatMoney, type LocalisedText } from '@river/i18n';

/** An amount as both languages write it. */
export function moneyText(minor: number, currency: string): LocalisedText {
  return { 'en-GB': formatMoney(minor, currency, 'en-GB'), uk: formatMoney(minor, currency, 'uk') };
}
