import { formatDate, type Locale } from '@river/i18n';
import type { OrderView } from '@river/pay-views';
import type { Dictionary } from '../dictionary/types';
import { payMoney } from './payMoney';

/**
 * Why an order needs a steward's eye, in one sentence — or null when it does not. Four cases:
 * money the invoice does not explain, or money arriving twice; an order nothing can carry; a
 * payment that has been "being collected" for more than a day; and an invoice past its date that
 * the clock has not yet closed.
 */
export function attentionOf(order: OrderView, t: Dictionary['pay'], locale: Locale, now: string): string | null {
  if (order.status === 'flagged' && order.flag) {
    const got = order.flag.reason === 'currency' ? order.flag.gotCurrency : /^[A-Z]{3}$/.test(order.flag.gotCurrency) ? payMoney(order.flag.gotMinor, order.flag.gotCurrency, locale) : String(order.flag.gotMinor);
    const reason = (t.operator.flagReasons as Record<string, string>)[order.flag.reason] ?? order.flag.reason;
    return `${t.facts['payment.Mismatched']}: ${reason.replace('{got}', got)}.`;
  }
  if (order.status === 'refused') return `${t.facts['checkout.Refused']}${order.lastFailure ? ` (${order.lastFailure.reason})` : ''}.`;
  // A payment that has been "being collected" for a day: the provider holds it, or the bank cannot reach the provider.
  if (order.status === 'approved' && order.updatedAt < new Date(Date.parse(now) - 86_400_000).toISOString()) return t.operator.collectingLong.replace('{date}', formatDate(order.updatedAt, locale, true));
  if ((order.status === 'invoiced' || order.status === 'retry') && order.invoice && order.invoice.expiresAt <= now) {
    return `${t.invoice.expiredTitle}: ${formatDate(order.invoice.expiresAt, locale, true)}.`;
  }
  return null;
}
