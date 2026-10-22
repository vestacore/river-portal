import type { Locale } from '@river/i18n';
import { lt } from '../lt';

const words: Record<string, [string, string]> = {
  debit: ['Debit', 'Дебетова'],
  credit: ['Credit', 'Кредитна'],
  premium: ['Premium', 'Преміальна'],
  commercial: ['Commercial', 'Корпоративна'],
  other: ['Other or foreign', 'Інша чи іноземна'],
};

/** A card's product as interchange reads it: debit, credit, premium, commercial — or other. */
export function cardProductText(product: string, locale: Locale): string {
  const w = words[product];
  return w ? lt(locale)(...w) : product;
}
