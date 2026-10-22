import type { Posting, PspFact } from '@river/psp-facts';

const acquirerOf = (recipient: string) => recipient.replace(/^acq:/, '');
const accountOf = (role: string, unitId: string) => (role === 'psp_fee' ? 'revenue:psp-fees' : role === 'acquirer_fee' ? `acquirer-fees:${acquirerOf(unitId)}` : role === 'reserve' ? `reserve:${unitId}` : `payable:${unitId}`);

/**
 * The ledger's projection of one fact — the double entry it forms, or nothing. The ledger is never
 * written by hand: replaying the facts gives the same journal.
 * - the split: the acquirer owes the whole amount (debit clearing); each recipient is owed its share and
 *   the PSP has earned its fee (credits);
 * - a refund or a lost dispute: the shares give it back (debits), the acquirer returns it (credit);
 * - a payout: the recipient is no longer owed (debit), the acquirer settled it to the recipient (credit);
 *   when the acquirer settles to the merchant directly, its own fee is a share it keeps at settlement;
 * - a direct settlement report that nets refunds and chargebacks: the acquirer recovered them from the
 *   merchant's batch (debit clearing), and the merchant owes them no longer (credit).
 */
export function postingsOf(fact: PspFact): Posting[] {
  switch (fact.type) {
    case 'split.Allocated': {
      const p = fact.payload;
      return [
        { account: `clearing:${p.acquirer}`, side: 'debit', amountMinor: p.amountMinor, currency: p.currency },
        ...p.allocations.filter((a) => a.amountMinor > 0).map((a): Posting => ({ account: accountOf(a.role, a.recipientUnitId), side: 'credit', amountMinor: a.amountMinor, currency: a.currency })),
      ];
    }
    case 'refund.Completed':
    case 'dispute.Lost': {
      const p = fact.payload;
      return [
        ...p.allocations.map((a): Posting => ({ account: accountOf(a.role, a.recipientUnitId), side: 'debit', amountMinor: -a.amountMinor, currency: a.currency })),
        { account: `clearing:${p.acquirer}`, side: 'credit', amountMinor: p.amountMinor, currency: p.currency },
      ];
    }
    case 'payout.Sent': {
      const p = fact.payload;
      return [
        { account: p.rule < 0 ? `reserve:${p.recipientUnitId}` : p.recipientUnitId.startsWith('acq:') ? `acquirer-fees:${acquirerOf(p.recipientUnitId)}` : `payable:${p.recipientUnitId}`, side: 'debit', amountMinor: p.amountMinor, currency: p.currency },
        { account: `clearing:${p.acquirer}`, side: 'credit', amountMinor: p.amountMinor, currency: p.currency },
      ];
    }
    case 'settlement.Reported': {
      const p = fact.payload;
      const netted = p.refundsMinor + p.chargebacksMinor;
      if (p.channel !== 'online' || netted <= 0) return [];
      return [
        { account: `clearing:${p.provider}`, side: 'debit', amountMinor: netted, currency: p.currency },
        { account: `payable:${p.merchantId}`, side: 'credit', amountMinor: netted, currency: p.currency },
      ];
    }
    default:
      return [];
  }
}
