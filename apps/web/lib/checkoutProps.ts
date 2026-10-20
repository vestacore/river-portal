import { pickText, segmentForLocale, type Locale } from '@river/i18n';
import { checkoutTexts, testCards } from '@river/psp-checkout';
import { activeTariffOf, feeFor } from '@river/psp-contracts';
import { findInstrument } from '@river/psp-instruments';
import type { InvoiceView } from '@river/psp-invoice';
import { checkoutFor, merchantOf, type World } from '@river/psp-runtime';
import { allocate } from '@river/psp-split';
import type { CheckoutProps } from '@/components/checkout/Checkout';
import { day, money } from './format';
import { href } from './href';
import { instrumentIcon } from './instrumentIcon';
import type { PayState } from './payState';

/**
 * Everything the pay page draws for one invoice, read from the world: the merchant's bar and accent from
 * the unit's effective policies, the invoice and its lines, the instruments the unit allows in this
 * currency and region, and — where the unit wants it — the split the payer's money will take, estimated
 * with the card fee of the merchant's tariff.
 */
export function checkoutProps(w: World, invoice: InvoiceView, payKey: string, locale: Locale, initial: PayState): CheckoutProps {
  const order = w.views.orders.get(invoice.orderId)!;
  const config = checkoutFor(w, invoice.unitId, invoice.currency);
  const merchantId = merchantOf(w, invoice.unitId);
  const unitName = (id: string) => pickText(w.units.find((u) => u.id === id)?.name, locale);
  const due = Math.max(0, invoice.amountMinor - invoice.paidMinor);
  const tariff = activeTariffOf(w.contracts, w.tariffs, merchantId, new Date().toISOString());
  const x = checkoutTexts[locale];
  const roleName = (role: string) => (x.roles as Record<string, string>)[role] ?? (role === 'reserve' ? (locale === 'uk' ? 'Резерв мерчанта' : 'Merchant’s reserve') : role);
  const split = config.showSplit ? allocate({ amountMinor: due, currency: invoice.currency, orderTotalMinor: order.totalMinor, lines: order.lines, plan: order.split, feeMinor: tariff ? feeFor(tariff, 'card', due) : 0, at: new Date().toISOString() })
    .map((a) => ({ label: a.role === 'psp_fee' ? 'River Pay' : unitName(a.recipientUnitId), role: roleName(a.role), amount: money(a.amountMinor, a.currency, locale) })) : null;
  const segment = segmentForLocale(locale);
  return {
    locale, payKey, texts: x,
    merchant: { name: pickText(config.merchantName, locale), monogram: config.monogram, email: config.supportEmail, phone: config.supportPhone, accent: config.accent },
    invoice: {
      number: invoice.number, amount: money(due, invoice.currency, locale), dueBy: day(invoice.dueAt, locale), total: money(due, invoice.currency, locale),
      paid: invoice.paidMinor > 0 && due > 0 ? { label: locale === 'uk' ? 'Уже сплачено' : 'Already paid', amount: money(invoice.paidMinor, invoice.currency, locale), rest: locale === 'uk' ? 'Залишилося сплатити' : 'Left to pay' } : null,
      paymentFor: pickText(order.lines[0]?.title as never, locale) + (order.lines.length > 1 ? (locale === 'uk' ? ` та ще ${order.lines.length - 1}` : ` and ${order.lines.length - 1} more`) : ''),
      lines: order.lines.map((l) => ({ title: pickText(l.title as never, locale), quantity: l.quantity, amount: money(l.totalMinor, invoice.currency, locale), seller: l.sellerUnitId ? unitName(l.sellerUnitId) : null })),
    },
    split,
    instruments: config.instruments.map((id) => { const d = findInstrument(id); return { id, label: pickText(d.label, locale), hint: pickText(d.payerHint, locale), icon: instrumentIcon(id) }; }),
    testCards: testCards.map((c) => ({ number: c.number, label: pickText(c.label, locale) })),
    collectEmail: config.collectEmail,
    initial,
    trackHref: href(locale, `/pay/${payKey}/track`),
    returnUrl: href(locale, '/shop'),
    languages: config.languages.map((l) => ({ href: `/${segmentForLocale(l)}/pay/${payKey}`, label: l === 'uk' ? 'УКР' : 'ENG', current: segmentForLocale(l) === segment })),
  };
}
