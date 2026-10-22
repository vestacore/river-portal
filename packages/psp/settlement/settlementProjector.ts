import { factsFormingOf, type Projector, type PspFact } from '@river/psp-facts';
import type { SettlementChannel, SettlementView } from './types/SettlementView.ts';

const channelOf = (source: 'pos' | 'oms' | 'loyalty'): SettlementChannel => (source === 'pos' ? 'in_store' : source === 'oms' ? 'online' : 'loyalty');

/**
 * The batch's reading (boundary `settlement`): the merchant's sales record, the provider's report, the
 * bank's credit and people's resolutions — keyed by the `batchId` every one of them carries. A batch is
 * born from whichever report arrives first; a credit or a resolution for an unknown batch is not.
 */
export const settlementProjector: Projector<SettlementView> = {
  projection: 'settlement',
  hears: factsFormingOf('settlement'),
  keyOf: (fact) => ('batchId' in fact.payload ? String(fact.payload.batchId) : null),
  project: (view, fact: PspFact) => {
    switch (fact.type) {
      case 'sales.Reported': {
        const p = fact.payload;
        const base: SettlementView = view ?? { batchId: p.batchId, provider: p.provider, merchantId: p.merchantId, storeId: p.storeId, channel: channelOf(p.source), businessDate: p.businessDate, currency: p.currency, sales: null, reported: null, credited: null, resolutions: [], updatedAt: fact.at };
        return { ...base, sales: { source: p.source, count: p.count, grossMinor: p.grossMinor, at: fact.at }, updatedAt: fact.at };
      }
      case 'settlement.Reported': {
        const p = fact.payload;
        const base: SettlementView = view ?? { batchId: p.batchId, provider: p.provider, merchantId: p.merchantId, storeId: p.storeId, channel: p.channel, businessDate: p.businessDate, currency: p.currency, sales: null, reported: null, credited: null, resolutions: [], updatedAt: fact.at };
        return { ...base, channel: p.channel, reported: { count: p.count, grossMinor: p.grossMinor, feeMinor: p.feeMinor, refundsMinor: p.refundsMinor, chargebacksMinor: p.chargebacksMinor, netMinor: p.netMinor, valueDate: p.valueDate, lines: p.lines, at: fact.at }, updatedAt: fact.at };
      }
      case 'settlement.Credited': {
        if (!view) return null;
        const p = fact.payload;
        return { ...view, credited: { account: p.account, valueDate: p.valueDate, amountMinor: p.amountMinor, reference: p.reference, at: fact.at }, updatedAt: fact.at };
      }
      case 'settlement.Resolved': {
        if (!view) return null;
        const p = fact.payload;
        return { ...view, resolutions: [...view.resolutions, { resolution: p.resolution, amountMinor: p.amountMinor, note: p.note, by: p.by, at: fact.at }], updatedAt: fact.at };
      }
      default:
        return view;
    }
  },
};
