import type { LocalisedText } from '@river/i18n';
import type { Rail } from '@river/psp-facts';

const t = (en: string, uk: string): LocalisedText => ({ 'en-GB': en, uk });

/** The rails a provider carries, in plain words. */
export const railLabels: Record<Rail, LocalisedText> = {
  card: t('cards', 'картки'),
  wallet: t('wallets', 'гаманці'),
  a2a: t('account to account', 'з рахунку на рахунок'),
  transfer: t('bank transfers', 'банківські перекази'),
  qr: t('QR', 'QR'),
  credit: t('instalments', 'оплата частинами'),
  chain: t('stablecoins', 'стейблкоїни'),
  cash: t('cash', 'готівка'),
  debit: t('direct debit', 'пряме дебетування'),
  loyalty: t('bonus points', 'бонусні бали'),
};
