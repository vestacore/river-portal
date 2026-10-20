import type { LocalisedText } from '@river/i18n';
import type { Projection } from '../types/Boundary.ts';

/** Names of the projections, as people read them. */
export const projectionLabels: Record<Projection, LocalisedText> = {
  order: { 'en-GB': 'Order', uk: 'Замовлення' },
  invoice: { 'en-GB': 'Invoice', uk: 'Інвойс' },
  session: { 'en-GB': 'Session', uk: 'Сесія' },
  payment: { 'en-GB': 'Payment', uk: 'Платіж' },
  ledger: { 'en-GB': 'Ledger', uk: 'Облік' },
};
