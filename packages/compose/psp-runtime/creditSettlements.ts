import { appendFacts } from './appendFacts.ts';
import type { World } from './types/World.ts';

/**
 * The bank statement of the demo: the net of every reported batch reaches the merchant's account on its
 * value date — except where the history's story says the bank did not credit it, or credited less. Bonus
 * points move no money and are not credited.
 */
export function creditSettlements(world: World, at: string): number {
  let credited = 0;
  const today = at.slice(0, 10);
  for (const view of world.views.settlements.values()) {
    const r = view.reported;
    if (!r || view.credited || view.channel === 'loyalty' || r.netMinor <= 0 || r.valueDate > today) continue;
    const quirk = world.quirks[view.batchId];
    if (quirk?.noCredit) continue;
    const account = world.profiles[view.merchantId]?.iban ?? `UA00${view.merchantId}`;
    appendFacts(world, view.batchId, [{ type: 'settlement.Credited', payload: { batchId: view.batchId, account, valueDate: r.valueDate, amountMinor: r.netMinor - (quirk?.shortCreditMinor ?? 0), reference: view.batchId.replace(/^stl_/, '').toUpperCase() } }],
      { via: 'world', controller: `bank:${view.merchantId}`, answering: null }, at);
    credited += 1;
  }
  return credited;
}
