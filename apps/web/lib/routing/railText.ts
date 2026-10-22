import type { Locale } from '@river/i18n';
import { lt } from '../lt';

const words: Record<string, [string, string]> = {
  card: ['Cards', 'Картки'],
  a2a: ['Pay by bank (A2A)', 'Оплата з банку (A2A)'],
  qr: ['QR transfer (A2A)', 'QR-переказ (A2A)'],
  transfer: ['Bank transfer', 'Банківський переказ'],
  debit: ['Direct debit', 'Прямий дебет'],
  credit: ['Instalments', 'Оплата частинами'],
  wallet: ['Wallet', 'Гаманець'],
  chain: ['Stablecoin', 'Стейблкоїн'],
  cash: ['Cash at a kiosk', 'Готівка в терміналі самообслуговування'],
  loyalty: ['Bonus points', 'Бонусні бали'],
};

/** The rail that carried a payment, as people call it. */
export function railText(rail: string, locale: Locale): string {
  const w = words[rail];
  return w ? lt(locale)(...w) : rail;
}
