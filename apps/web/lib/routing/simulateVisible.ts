import { acquirers } from '@river/psp-instruments';
import { simulateRouting, type World } from '@river/psp-runtime';

type Simulation = ReturnType<typeof simulateRouting>;

/**
 * The routing replay of a period for the merchants within a profile's reach that route by their own
 * online acquiring terms — one replay per merchant, summed — with the card volume the replayed attempts
 * carried, so that a cost reads as an effective rate.
 */
export function simulateVisible(w: World, visible: ReadonlySet<string>, from: string, minApprovalBps: number): Simulation & { volumeMinor: number } {
  const card = (acquirerId: string) => acquirers.find((a) => a.id === acquirerId)?.rails.includes('card') ?? false;
  const merchants = [...new Set(w.acquiring.filter((t) => t.channel === 'online' && card(t.acquirerId)).map((t) => t.merchantId))].filter((m) => visible.has(m));
  const runs = merchants.map((merchantId) => simulateRouting(w, { from, minApprovalBps, merchantId }));
  const sessions = runs.reduce((s, r) => s + r.sessions, 0);
  const weighted = (get: (r: Simulation) => number) => (sessions > 0 ? Math.round(runs.reduce((s, r) => s + get(r) * r.sessions, 0) / sessions) : 0);
  const strategies = runs[0]?.simulated.map((x) => x.strategy) ?? [];
  const of = (r: Simulation, strategy: string) => r.simulated.find((x) => x.strategy === strategy);
  const blocked = new Map<string, Simulation['blockedOnUs'][number]>();
  for (const r of runs) {
    for (const b of r.blockedOnUs) {
      const e = blocked.get(b.acquirer);
      blocked.set(b.acquirer, e ? { ...e, sessions: e.sessions + b.sessions, savingMinor: e.savingMinor + b.savingMinor } : { ...b });
    }
  }
  const scope = new Set(merchants);
  let volumeMinor = 0;
  for (const s of w.views.sessions.values()) if (s.route?.rail === 'card' && s.openedAt >= from && scope.has(s.merchantId)) volumeMinor += s.amountMinor;
  return {
    sessions,
    currency: runs.find((r) => r.sessions > 0)?.currency ?? 'UAH',
    actualFeeMinor: runs.reduce((s, r) => s + r.actualFeeMinor, 0),
    actualOnUsShareBps: weighted((r) => r.actualOnUsShareBps),
    simulated: strategies.map((strategy) => ({
      strategy,
      feeMinor: runs.reduce((s, r) => s + (of(r, strategy)?.feeMinor ?? 0), 0),
      onUsShareBps: weighted((r) => of(r, strategy)?.onUsShareBps ?? 0),
      approvalDeltaBps: weighted((r) => of(r, strategy)?.approvalDeltaBps ?? 0),
    })),
    blockedOnUs: [...blocked.values()].sort((a, b) => b.savingMinor - a.savingMinor),
    volumeMinor,
  };
}
