import { pickText, type Locale } from '@river/i18n';
import { stageCatalogue } from '@river/psp-facts';
import { findInstrument } from '@river/psp-instruments';
import { invoiceDueMinor, invoiceStatusAt, invoiceStatusLabels, type InvoiceView } from '@river/psp-invoice';
import { fulfilmentLabels, orderStatusLabels, type OrderView } from '@river/psp-order';
import { paymentStatusLabels, type PaymentView } from '@river/psp-payment';
import { sessionOutcomeLabels, type SessionView } from '@river/psp-session';
import type { Column } from '@/components/panels/DataTable';
import type { Cell } from '@/components/panels/Value';
import { instrumentIcon } from './instrumentIcon';
import { lt } from './lt';
import { invoiceTone, orderTone, paymentTone, sessionTone } from './tones';

/**
 * The columns of the four boundaries, declared once: every list of orders, invoices, sessions or
 * payments in every cabinet is the same table, read through the same cells.
 */
export type Ctx = { locale: Locale; now: string; unitName: (id: string) => string; link: (path: string) => string };

export function instrumentCell(ctx: Ctx, instrument: SessionView['instrument'], detail: SessionView['detail']): Cell {
  if (!instrument) return { kind: 'empty' };
  const d = detail ?? {};
  const extra = d.last4 ? `•${d.last4}` : d.parts ? `×${d.parts}` : d.bank ?? d.network ?? undefined;
  return { kind: 'instrument', label: pickText(findInstrument(instrument).label, ctx.locale), icon: instrumentIcon(instrument), ...(extra ? { detail: extra } : {}) };
}

export function orderColumns(ctx: Ctx): Column<OrderView>[] {
  const t = lt(ctx.locale);
  return [
    { key: 'reference', label: t('Order', 'Замовлення'), cell: (o) => ({ kind: 'mono', value: o.reference, href: ctx.link(`/orders/${o.orderId}`) }), sort: (o) => o.reference },
    { key: 'created', label: t('Created', 'Створено'), cell: (o) => ({ kind: 'datetime', iso: o.createdAt }), sort: (o) => o.createdAt },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (o) => ({ kind: 'unit', name: ctx.unitName(o.unitId), sub: ctx.unitName(o.merchantId) === ctx.unitName(o.unitId) ? undefined : ctx.unitName(o.merchantId) }), sort: (o) => ctx.unitName(o.unitId) },
    { key: 'lines', label: t('Lines', 'Позиції'), cell: (o) => ({ kind: 'text', value: pickText(o.lines[0]?.title as never, ctx.locale) || '—', sub: o.lines.length > 1 ? t(`and ${o.lines.length - 1} more`, `і ще ${o.lines.length - 1}`) : undefined }) },
    { key: 'total', label: t('Total', 'Сума'), align: 'end', cell: (o) => ({ kind: 'money', minor: o.totalMinor, currency: o.currency }), sort: (o) => o.totalMinor },
    { key: 'status', label: t('Status', 'Статус'), cell: (o) => ({ kind: 'status', label: pickText(orderStatusLabels[o.status], ctx.locale), tone: orderTone[o.status] }), sort: (o) => o.status },
    { key: 'fulfilment', label: t('Goods', 'Товар'), cell: (o) => (o.fulfilment === 'none' ? { kind: 'empty' } : { kind: 'status', label: pickText(fulfilmentLabels[o.fulfilment], ctx.locale), tone: o.fulfilment === 'delivered' ? 'success' : 'info' }) },
    { key: 'split', label: t('Shares', 'Частки'), align: 'end', cell: (o) => ({ kind: 'count', n: o.allocations.length }) },
  ];
}

export function invoiceColumns(ctx: Ctx): Column<InvoiceView>[] {
  const t = lt(ctx.locale);
  return [
    { key: 'number', label: t('Invoice', 'Інвойс'), cell: (i) => ({ kind: 'mono', value: i.number, href: ctx.link(`/invoices/${i.invoiceId}`) }), sort: (i) => i.number },
    { key: 'issued', label: t('Issued', 'Виставлено'), cell: (i) => ({ kind: 'date', iso: i.issuedAt }), sort: (i) => i.issuedAt },
    { key: 'due', label: t('Due', 'Строк'), cell: (i) => ({ kind: 'date', iso: i.dueAt }), sort: (i) => i.dueAt },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (i) => ({ kind: 'unit', name: ctx.unitName(i.unitId) }), sort: (i) => ctx.unitName(i.unitId) },
    { key: 'amount', label: t('Amount', 'Сума'), align: 'end', cell: (i) => ({ kind: 'money', minor: i.amountMinor, currency: i.currency }), sort: (i) => i.amountMinor },
    { key: 'dueMinor', label: t('Still due', 'До сплати'), align: 'end', cell: (i) => ({ kind: 'money', minor: invoiceDueMinor(i), currency: i.currency, muted: invoiceDueMinor(i) === 0 }), sort: (i) => invoiceDueMinor(i) },
    { key: 'status', label: t('Status', 'Статус'), cell: (i) => { const s = invoiceStatusAt(i, ctx.now); return { kind: 'status', label: pickText(invoiceStatusLabels[s], ctx.locale), tone: invoiceTone[s] }; }, sort: (i) => invoiceStatusAt(i, ctx.now) },
    { key: 'attempts', label: t('Attempts', 'Спроби'), align: 'end', cell: (i) => ({ kind: 'text', value: `${i.attempts.succeeded}/${i.attempts.opened}`, sub: i.reminders.length ? t(`${i.reminders.length} reminders`, `нагадувань: ${i.reminders.length}`) : undefined }), sort: (i) => i.attempts.opened },
  ];
}

export function sessionColumns(ctx: Ctx): Column<SessionView>[] {
  const t = lt(ctx.locale);
  return [
    { key: 'session', label: t('Session', 'Сесія'), cell: (s) => ({ kind: 'mono', value: s.sessionId, href: ctx.link(`/sessions/${s.sessionId}`) }), sort: (s) => s.sessionId },
    { key: 'opened', label: t('Opened', 'Відкрито'), cell: (s) => ({ kind: 'datetime', iso: s.openedAt }), sort: (s) => s.openedAt },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (s) => ({ kind: 'unit', name: ctx.unitName(s.unitId) }), sort: (s) => ctx.unitName(s.unitId) },
    { key: 'instrument', label: t('Instrument', 'Інструмент'), cell: (s) => instrumentCell(ctx, s.instrument, s.detail), sort: (s) => s.instrument ?? '' },
    { key: 'amount', label: t('Amount', 'Сума'), align: 'end', cell: (s) => ({ kind: 'money', minor: s.amountMinor, currency: s.currency }), sort: (s) => s.amountMinor },
    { key: 'stage', label: t('Reached', 'Досягнуто'), cell: (s) => ({ kind: 'text', value: pickText(stageCatalogue.find((x) => x.stage === s.stage)?.label, ctx.locale), sub: `${s.bridges} ${t('bridges', 'мостів')}` }), sort: (s) => s.bridges },
    { key: 'risk', label: t('Risk', 'Ризик'), align: 'end', cell: (s) => (s.risk ? { kind: 'bar', share: s.risk.score / 100, label: String(s.risk.score), tone: s.risk.level === 'high' ? 'danger' : s.risk.level === 'medium' ? 'warning' : 'success' } : { kind: 'empty' }), sort: (s) => s.risk?.score ?? -1 },
    { key: 'outcome', label: t('Outcome', 'Результат'), cell: (s) => ({ kind: 'status', label: pickText(sessionOutcomeLabels[s.outcome], ctx.locale) + (s.failure && s.outcome === 'failed' ? ` · ${s.failure.code}` : ''), tone: sessionTone[s.outcome] }), sort: (s) => s.outcome },
  ];
}

export function paymentColumns(ctx: Ctx): Column<PaymentView>[] {
  const t = lt(ctx.locale);
  return [
    { key: 'payment', label: t('Payment', 'Платіж'), cell: (p) => ({ kind: 'mono', value: p.paymentId, href: ctx.link(`/payments/${p.paymentId}`) }), sort: (p) => p.paymentId },
    { key: 'created', label: t('Secured', 'Забезпечено'), cell: (p) => ({ kind: 'datetime', iso: p.createdAt }), sort: (p) => p.createdAt },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (p) => ({ kind: 'unit', name: ctx.unitName(p.unitId) }), sort: (p) => ctx.unitName(p.unitId) },
    { key: 'instrument', label: t('Instrument', 'Інструмент'), cell: (p) => instrumentCell(ctx, p.instrument, p.detail), sort: (p) => p.instrument },
    { key: 'acquirer', label: t('Acquirer', 'Еквайр'), cell: (p) => ({ kind: 'mono', value: p.acquirer }), sort: (p) => p.acquirer },
    { key: 'amount', label: t('Captured', 'Списано'), align: 'end', cell: (p) => ({ kind: 'money', minor: p.capturedMinor || p.amountMinor, currency: p.currency, muted: p.capturedMinor === 0 }), sort: (p) => p.capturedMinor },
    { key: 'fee', label: t('Fee', 'Комісія'), align: 'end', cell: (p) => ({ kind: 'money', minor: p.feeMinor, currency: p.currency, muted: true }), sort: (p) => p.feeMinor },
    { key: 'status', label: t('Status', 'Статус'), cell: (p) => ({ kind: 'status', label: pickText(paymentStatusLabels[p.status], ctx.locale), tone: paymentTone[p.status] }), sort: (p) => p.status },
  ];
}
