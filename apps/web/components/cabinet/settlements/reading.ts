import { pickText, pluralise, type Locale } from '@river/i18n';
import { acquiringCostOf } from '@river/psp-contracts';
import type { SettlementLine } from '@river/psp-facts';
import { acquirers, instrumentCatalogue, issuers } from '@river/psp-instruments';
import { acquiringTermsFor, type World, type reconcileSettlements } from '@river/psp-runtime';
import type { BatchDifference, Reconciliation, ReconciliationStatus, SettlementView } from '@river/psp-settlement';
import type { Tone } from '../../panels/Value';

/**
 * How the settlement pages read a reconciled batch, the same on the list, on a batch's page and in the
 * finance controller's overview: whose batch it is, who settles it, the difference that gives it its
 * status and the amount that difference puts in question, and what the terms say a line of the
 * provider's breakdown should have cost.
 */
export type BatchRow = ReturnType<typeof reconcileSettlements>[number];

/** The tone of each status: a missing report or credit is the most serious, a fee or an amount next. */
export const statusTone: Record<ReconciliationStatus, Tone> = {
  not_reported: 'danger', not_credited: 'danger', short_credit: 'danger', fee_difference: 'warning', gross_difference: 'warning',
  resolved: 'info', awaiting_report: 'neutral', awaiting_credit: 'neutral', matched: 'success',
};

/** The statuses of a difference nobody has decided about yet. */
export const openStatuses: ReadonlySet<ReconciliationStatus> = new Set(['not_reported', 'not_credited', 'short_credit', 'fee_difference', 'gross_difference']);

/** A batch belongs to its store, or to its merchant when it has no store (online, bonus points). */
export const unitOfBatch = (view: SettlementView): string => view.storeId ?? view.merchantId;

/** The provider that settles a batch, by its name in the reader's language. */
export const providerName = (id: string, locale: Locale): string => pickText(acquirers.find((a) => a.id === id)?.label, locale) || id;

/** Whether the provider is an acquirer (it carries cards) rather than a hub, a bank transfer, a lender or a bonus system. */
export const isAcquirer = (id: string): boolean => acquirers.find((a) => a.id === id)?.rails.includes('card') ?? false;

const kindOfStatus: Partial<Record<ReconciliationStatus, BatchDifference['kind']>> = { not_reported: 'report', not_credited: 'credit', short_credit: 'credit', fee_difference: 'fee', gross_difference: 'gross' };
const kindOrder: readonly BatchDifference['kind'][] = ['report', 'credit', 'fee', 'gross'];

/** The difference that gives a batch its status — for a resolved batch, the most serious of the differences it had. */
export function mainDifference(r: Reconciliation): BatchDifference | null {
  const kind = kindOfStatus[r.status];
  if (kind) return r.differences.find((d) => d.kind === kind) ?? null;
  for (const k of kindOrder) { const d = r.differences.find((x) => x.kind === k); if (d) return d; }
  return null;
}

/**
 * The amount a batch's status is about: the difference in question; for a batch awaiting its report, the
 * sales it should settle; awaiting its credit, the net the bank should credit; for a matched one, its gross.
 */
export function amountOf({ view, reconciliation: r }: BatchRow): number {
  if (r.status === 'matched') return view.reported?.grossMinor ?? 0;
  if (r.status === 'awaiting_report') return r.expected?.grossMinor ?? view.sales?.grossMinor ?? 0;
  if (r.status === 'awaiting_credit') return view.reported?.netMinor ?? 0;
  return Math.abs(mainDifference(r)?.deltaMinor ?? 0);
}

/** The terms a batch was priced under: the merchant's with that provider for the channel (bonus points count as online). */
export function termsOfBatch(w: World, view: SettlementView) {
  return acquiringTermsFor(w, view.merchantId, view.provider, view.channel === 'in_store' ? 'in_store' : 'online');
}

/**
 * What one line of a provider's breakdown should have cost under the merchant's terms. A store's line is
 * priced as the reconciliation prices it, on the line's gross; a line of online payments also carries the
 * terms' fixed part once for each payment in it. Null when the merchant has no terms with the provider.
 */
export function termsFeeOf(w: World, view: SettlementView, line: SettlementLine): number | null {
  const terms = termsOfBatch(w, view);
  if (!terms) return null;
  const cost = acquiringCostOf(terms, { scheme: line.scheme, product: line.product, domestic: line.issuer !== null, onUs: line.onUs }, line.grossMinor).totalMinor;
  return view.channel === 'in_store' ? cost : Math.min(line.grossMinor, cost + terms.fixedMinor * Math.max(0, line.count - 1));
}

const cardSchemes: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', prostir: 'ПРОСТІР', amex: 'American Express', other: '' };

/** Whether a line is of cards (a scheme) rather than of another instrument (a transfer, instalments, bonus points). */
export const isCardLine = (line: SettlementLine): boolean => line.scheme in cardSchemes;

/** Who a line's money came from: the issuing bank of its cards, a foreign card, or the instrument when it is not a card. */
export function issuerOfLine(line: SettlementLine, locale: Locale): string {
  const issuer = line.issuer ? issuers.find((i) => i.id === line.issuer) : undefined;
  if (issuer) return pickText(issuer.name, locale);
  if (!isCardLine(line)) return pickText(instrumentCatalogue.find((x) => x.id === line.scheme)?.label, locale) || line.scheme;
  return locale === 'uk' ? 'Картка іноземного банку' : 'Card of a foreign bank';
}

/** The card scheme of a line, as the schemes write their names; empty for a line that is not of cards. */
export const schemeOfLine = (line: SettlementLine): string => cardSchemes[line.scheme] ?? '';

/** A card product in words. */
export const productWords: Record<SettlementLine['product'], [string, string]> = {
  debit: ['Debit', 'Дебетова'], credit: ['Credit', 'Кредитна'], premium: ['Premium', 'Преміальна'], commercial: ['Commercial', 'Корпоративна'], other: ['Other', 'Інша'],
};

/** Where a sales record came from, in words. */
export const salesSourceWords: Record<NonNullable<SettlementView['sales']>['source'], [string, string]> = {
  pos: ['The stores’ tills', 'Каси магазинів'], oms: ['The order system', 'Система замовлень'], loyalty: ['The bonus system', 'Бонусна система'],
};

/** A number of batches in words: `1 batch`, `30 batches` / `1 пакет`, `3 пакети`, `30 пакетів`. */
export const batchesText = (n: number, locale: Locale): string => pluralise(n, locale, locale === 'uk' ? { one: '{n} пакет', few: '{n} пакети', many: '{n} пакетів', other: '{n} пакета' } : { one: '{n} batch', other: '{n} batches' });

/** A business day (YYYY-MM-DD) as a moment the date formatters read the same in every time zone of the demo. */
export const businessDayIso = (date: string): string => `${date}T12:00:00.000Z`;
