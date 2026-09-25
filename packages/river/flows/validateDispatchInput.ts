import type { FieldError, Result } from '@river/kernel';
import { carrierKinds, type CarrierKind } from './types/CarrierKind.ts';
import { costKinds, type CostKind } from './types/CostKind.ts';
import type { CostInput } from './types/CostInput.ts';
import type { DispatchInput } from './types/DispatchInput.ts';
import { fxRatesToGbp } from './data/fxRatesToGbp.ts';

/** Validates the dispatch form: carrier plus up to four cost lines (`cost0Kind`, `cost0Amount`, …). */
export function validateDispatchInput(raw: Record<string, string | undefined>): Result<DispatchInput> {
  const errors: FieldError[] = [];
  const carrierKind = raw.carrierKind as CarrierKind;
  if (!carrierKinds.includes(carrierKind)) errors.push({ field: 'carrierKind', code: 'carrierKind' });
  const carrierName = (raw.carrierName ?? '').trim().slice(0, 80);
  if (carrierName.length < 2) errors.push({ field: 'carrierName', code: 'carrierName' });
  const fromLabel = (raw.fromLabel ?? '').trim().slice(0, 80);
  if (fromLabel.length < 2) errors.push({ field: 'fromLabel', code: 'fromLabel' });
  const costs: CostInput[] = [];
  for (let i = 0; i < 4; i++) {
    const amountText = (raw[`cost${i}Amount`] ?? '').trim();
    if (!amountText) continue;
    const amount = Number.parseFloat(amountText.replace(',', '.'));
    const kind = raw[`cost${i}Kind`] as CostKind;
    const currency = raw[`cost${i}Currency`] ?? 'GBP';
    if (!Number.isFinite(amount) || amount <= 0 || !costKinds.includes(kind) || !(currency in fxRatesToGbp)) {
      errors.push({ field: `cost${i}Amount`, code: 'cost' });
      continue;
    }
    costs.push({ kind, amountMinor: Math.round(amount * 100), currency, note: (raw[`cost${i}Note`] ?? '').trim().slice(0, 200) });
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { flowId: raw.flowId ?? '', carrierKind, carrierName, fromLabel, costs } };
}
