import type { BatchDifference, ExpectedBatch, Reconciliation, ReconciliationStatus } from './types/Reconciliation.ts';
import type { SettlementView } from './types/SettlementView.ts';

const day = 86_400_000;

/**
 * Reconciles one batch three ways: what should be in it (`expected`: from the payments the platform
 * carried, or from the merchant's sales record and its acquiring terms), what the provider reports, and
 * what the bank credited. A difference within `toleranceMinor` is not one. A report is awaited for two days
 * after the business day, a credit for one day after the value date; after that, its absence is a finding.
 * A batch with a person's resolution is resolved, whatever its differences.
 */
export function reconcileBatch(view: SettlementView, expected: ExpectedBatch | null, now: string, toleranceMinor = 100): Reconciliation {
  const differences: BatchDifference[] = [];
  const expectedGross = expected?.grossMinor ?? view.sales?.grossMinor ?? null;
  const at = Date.parse(now);
  const statuses: ReconciliationStatus[] = [];
  const off = (a: number, b: number) => Math.abs(a - b) > toleranceMinor;
  if (!view.reported) {
    if (expectedGross !== null && expectedGross > 0) {
      differences.push({ kind: 'report', expectedMinor: expectedGross, actualMinor: 0, deltaMinor: -expectedGross });
      statuses.push(at > Date.parse(`${view.businessDate}T00:00:00Z`) + 3 * day ? 'not_reported' : 'awaiting_report');
    }
  } else {
    const r = view.reported;
    if (expectedGross !== null && off(r.grossMinor, expectedGross)) { differences.push({ kind: 'gross', expectedMinor: expectedGross, actualMinor: r.grossMinor, deltaMinor: r.grossMinor - expectedGross }); statuses.push('gross_difference'); }
    if (expected?.feeMinor != null && off(r.feeMinor, expected.feeMinor)) { differences.push({ kind: 'fee', expectedMinor: expected.feeMinor, actualMinor: r.feeMinor, deltaMinor: r.feeMinor - expected.feeMinor }); statuses.push('fee_difference'); }
    if (!view.credited) {
      if (r.netMinor > 0) statuses.push(at > Date.parse(`${r.valueDate}T00:00:00Z`) + 2 * day ? 'not_credited' : 'awaiting_credit');
      if (r.netMinor > 0 && at > Date.parse(`${r.valueDate}T00:00:00Z`) + 2 * day) differences.push({ kind: 'credit', expectedMinor: r.netMinor, actualMinor: 0, deltaMinor: -r.netMinor });
    } else if (off(view.credited.amountMinor, r.netMinor)) {
      differences.push({ kind: 'credit', expectedMinor: r.netMinor, actualMinor: view.credited.amountMinor, deltaMinor: view.credited.amountMinor - r.netMinor });
      statuses.push('short_credit');
    }
  }
  if (view.resolutions.length > 0 && differences.length > 0) statuses.push('resolved');
  const order = ['not_reported', 'not_credited', 'short_credit', 'fee_difference', 'gross_difference', 'awaiting_report', 'awaiting_credit'] as const;
  const status: ReconciliationStatus = view.resolutions.length > 0 && differences.length > 0 ? 'resolved' : order.find((s) => statuses.includes(s)) ?? 'matched';
  return { status, differences, expected };
}
