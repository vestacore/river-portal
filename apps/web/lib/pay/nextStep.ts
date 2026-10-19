import { type Locale } from '@river/i18n';
import { providerLabels } from '@river/pay-facts';
import type { OrderView } from '@river/pay-views';
import type { Dictionary } from '../dictionary/types';
import { payMoney } from './payMoney';

/** One sentence for the merchant: where the order stands and what happens next. */
export function nextStep(order: OrderView, t: Dictionary['pay'], locale: Locale): string {
  const provider = order.route ? providerLabels[order.route.provider] : order.paid ? providerLabels[order.paid.provider] : '';
  const by = order.cancelled ? (t.by as Record<string, string>)[order.cancelled.by] ?? order.cancelled.by : '';
  return t.merchant.next[order.status]
    .replace('{provider}', provider)
    .replace('{net}', order.invoice ? payMoney(order.invoice.netMinor, order.currency, locale) : '')
    .replace('{reason}', order.status === 'cancelled' ? order.cancelled?.reason ?? '' : order.lastFailure?.reason ?? '')
    .replace('{by}', by);
}
