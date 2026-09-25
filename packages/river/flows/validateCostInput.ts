import { costKinds, type CostKind } from './types/CostKind.ts';
import type { CostInput } from './types/CostInput.ts';

/**
 * One cost line from a form: a positive amount in major units (at most ten million), of a known
 * kind, in one of `currencies` (those with a conversion rate in settings); null when invalid.
 */
export function validateCostInput(raw: { kind?: string | undefined; amount?: string | undefined; currency?: string | undefined; note?: string | undefined }, currencies: readonly string[]): CostInput | null {
  const amount = Number.parseFloat((raw.amount ?? '').trim().replace(',', '.'));
  const kind = raw.kind as CostKind;
  const currency = raw.currency ?? currencies[0] ?? '';
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000 || !costKinds.includes(kind) || !currencies.includes(currency)) return null;
  return { kind, amountMinor: Math.round(amount * 100), currency, note: (raw.note ?? '').trim().slice(0, 200) };
}
