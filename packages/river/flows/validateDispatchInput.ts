import type { FieldError, Result } from '@river/kernel';
import { carrierKinds, type CarrierKind } from './types/CarrierKind.ts';
import type { CostInput } from './types/CostInput.ts';
import type { DispatchInput } from './types/DispatchInput.ts';
import { validateCostInput } from './validateCostInput.ts';

/**
 * Validates the dispatch form: carrier (a registered carrier's person id, or a name) plus up to four
 * cost lines (`cost0Kind`, `cost0Amount`, `cost0Currency`, `cost0Note`). `currencies` are those with
 * a conversion rate in settings.
 */
export function validateDispatchInput(raw: Record<string, string | undefined>, currencies: readonly string[]): Result<DispatchInput> {
  const errors: FieldError[] = [];
  const carrierKind = raw.carrierKind as CarrierKind;
  if (!carrierKinds.includes(carrierKind)) errors.push({ field: 'carrierKind', code: 'carrierKind' });
  const carrierName = (raw.carrierName ?? '').trim().slice(0, 80);
  if (carrierName.length < 2) errors.push({ field: 'carrierName', code: 'carrierName' });
  const fromLabel = (raw.fromLabel ?? '').trim().slice(0, 80);
  if (fromLabel.length < 2) errors.push({ field: 'fromLabel', code: 'fromLabel' });
  const costs: CostInput[] = [];
  for (let i = 0; i < 4; i++) {
    const amount = (raw[`cost${i}Amount`] ?? '').trim();
    if (!amount) continue;
    const cost = validateCostInput({ kind: raw[`cost${i}Kind`], amount, currency: raw[`cost${i}Currency`], note: raw[`cost${i}Note`] }, currencies);
    if (cost) costs.push(cost);
    else errors.push({ field: `cost${i}Amount`, code: 'cost' });
  }
  if (errors.length > 0) return { ok: false, errors };
  const carrierPersonId = /^person_[A-Za-z0-9_]{3,60}$/.test(raw.carrierPersonId ?? '') ? (raw.carrierPersonId as string) : null;
  return { ok: true, value: { flowId: raw.flowId ?? '', carrierKind, carrierName, carrierPersonId, fromLabel, costs } };
}
