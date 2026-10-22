import type { PosOutlook } from '@river/psp-agents';
import { acquiringCostOf, type AcquiringTerms } from '@river/psp-contracts';
import type { SettlementLine } from '@river/psp-facts';
import { acquirers, issuers } from '@river/psp-instruments';
import { isWithin, policyValue } from '@river/psp-units';
import { acquiringTermsFor } from './acquiringTermsFor.ts';
import { effectiveFor } from './effectiveFor.ts';
import type { World } from './types/World.ts';

/**
 * The card turnover of each region's stores over the last `days`, from their terminal banks' reports,
 * priced under the region's terminal bank's store terms and under every other bank's: what the region
 * pays, what it would pay elsewhere, how much of it is the terminal bank's own cards, and what an on-us
 * clause at the rate of the bank's online terms would save. The platform does not process these payments.
 */
export function posOutlook(world: World, now: string, days = 30): PosOutlook[] {
  const from = new Date(Date.parse(now) - days * 86_400_000).toISOString().slice(0, 10);
  const regions = world.units.filter((u) => u.kind === 'region');
  const out: PosOutlook[] = [];
  for (const region of regions) {
    const lines = new Map<string, SettlementLine>();
    let volume = 0;
    for (const v of world.views.settlements.values()) {
      if (v.channel !== 'in_store' || !v.reported || !v.storeId || v.businessDate < from || !isWithin(world.units, v.storeId, region.id)) continue;
      for (const l of v.reported.lines) {
        const key = `${l.issuer}|${l.scheme}|${l.product}`;
        const e = lines.get(key) ?? { ...l, onUs: false, count: 0, grossMinor: 0, feeMinor: 0 };
        e.count += l.count;
        e.grossMinor += l.grossMinor;
        lines.set(key, e);
        volume += l.grossMinor;
      }
    }
    if (volume === 0) continue;
    const merchantId = region.parentId ?? 'rt-retail';
    const current = String(policyValue(effectiveFor(world, region.id), 'pos.acquirer') ?? '');
    const price = (terms: AcquiringTerms, acquirerId: string) => [...lines.values()].reduce((s, l) => {
      const onUs = l.issuer !== null && (issuers.find((i) => i.id === l.issuer)?.acquirerIds ?? []).includes(acquirerId);
      return s + acquiringCostOf(terms, { scheme: l.scheme, product: l.product, domestic: l.issuer !== null, onUs }, l.grossMinor).totalMinor;
    }, 0);
    const ownShare = (acquirerId: string) => Math.round(([...lines.values()].filter((l) => l.issuer !== null && (issuers.find((i) => i.id === l.issuer)?.acquirerIds ?? []).includes(acquirerId)).reduce((s, l) => s + l.grossMinor, 0) / volume) * 10_000);
    const terms = acquiringTermsFor(world, merchantId, current, 'in_store');
    if (!terms) continue;
    const online = world.acquiring.find((t) => t.acquirerId === current && t.channel === 'online' && t.onUsBps !== null);
    const bank = issuers.find((i) => i.acquirerIds.includes(current));
    const name = (id: string) => acquirers.find((a) => a.id === id)?.label ?? { 'en-GB': id, uk: id };
    out.push({
      regionId: region.id, acquirer: current, acquirerName: name(current), bankName: bank?.name ?? name(current), days, volumeMinor: volume, feeMinor: price(terms, current),
      ownBankShareBps: ownShare(current), onUsClause: terms.onUsBps !== null,
      ifOnUsClauseFeeMinor: terms.onUsBps === null && online ? price({ ...terms, onUsBps: online.onUsBps }, current) : null, onUsRateBps: online?.onUsBps ?? null,
      alternatives: world.acquiring.filter((t) => t.merchantId === merchantId && t.channel === 'in_store').map((t) => ({ acquirer: t.acquirerId, acquirerName: name(t.acquirerId), feeMinor: price(t, t.acquirerId), onUsShareBps: ownShare(t.acquirerId) })),
    });
  }
  return out;
}
