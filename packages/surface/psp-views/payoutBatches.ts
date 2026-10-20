import type { PaymentView } from '@river/psp-payment';
import type { PayoutBatch } from './types/Views.ts';

/** Payout batches folded from the payments' payout lines, the newest first. */
export function payoutBatches(payments: readonly PaymentView[]): PayoutBatch[] {
  const batches = new Map<string, PayoutBatch>();
  for (const p of payments) {
    for (const line of p.payouts) {
      const b = batches.get(line.batchId) ?? { batchId: line.batchId, recipientUnitId: line.recipientUnitId, currency: p.currency, amountMinor: 0, payments: 0, at: line.at };
      b.amountMinor += line.amountMinor;
      b.payments += 1;
      if (line.at > b.at) b.at = line.at;
      batches.set(line.batchId, b);
    }
  }
  return [...batches.values()].sort((a, b) => b.at.localeCompare(a.at));
}
