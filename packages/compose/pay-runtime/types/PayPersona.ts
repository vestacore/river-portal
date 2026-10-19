import type { LocalisedText } from '@river/i18n';

/**
 * Who a tester may act as in the payment river's demo: a merchant (the bank that asks) or a payer
 * (the bank that gives). `ref` is what enters the streams — a merchant id or a payer handle.
 */
export type PayPersona = {
  id: string;
  role: 'merchant' | 'payer';
  ref: string;
  name: LocalisedText;
  description: LocalisedText;
};
