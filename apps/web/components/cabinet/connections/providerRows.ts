import type { AcquiringTerms } from '@river/psp-contracts';
import { acquirers, type Acquirer } from '@river/psp-instruments';
import type { World } from '@river/psp-runtime';
import type { SettlementView } from '@river/psp-settlement';
import { approvalByAcquirer } from '@river/psp-views';

const day = 86_400_000;

/**
 * One provider the stand is connected with, as a reach sees it: the terms in force for its legal
 * entities, the approval the provider is expected to give and the one it gave the attempts it carried in
 * the last days, and its latest settlement report.
 */
export type ProviderRow = {
  id: string;
  provider: Acquirer | null;
  terms: AcquiringTerms[];
  nominalBps: number | null;
  approved: number;
  refused: number;
  actualBps: number | null;
  latest: SettlementView | null;
  batches: number;
};

/** The stand's providers within a reach; approval and batches are counted over the last `days`. */
export function providerRows(w: World, visible: ReadonlySet<string>, now: string, days = 30): ProviderRow[] {
  const from = new Date(Date.parse(now) - days * day).toISOString();
  const sessions = [...w.views.sessions.values()].filter((s) => visible.has(s.unitId) && s.openedAt >= from);
  const approval = new Map(approvalByAcquirer(sessions).map((a) => [a.acquirer, a]));
  const settlements = [...w.views.settlements.values()].filter((s) => visible.has(s.storeId ?? s.merchantId));
  return w.providers.map((id) => {
    const provider = acquirers.find((a) => a.id === id) ?? null;
    const carried = approval.get(id);
    const own = settlements.filter((s) => s.provider === id);
    const latest = own.reduce<SettlementView | null>((x, s) => (!s.reported ? x : !x || !x.reported || s.businessDate > x.businessDate || (s.businessDate === x.businessDate && s.reported.at > x.reported.at) ? s : x), null);
    return {
      id, provider,
      terms: w.acquiring.filter((t) => t.acquirerId === id && visible.has(t.merchantId)),
      nominalBps: provider?.approvalBps ?? null,
      approved: carried?.approved ?? 0, refused: carried?.refused ?? 0, actualBps: carried ? carried.approvalBps : null,
      latest, batches: own.filter((s) => s.businessDate >= from.slice(0, 10)).length,
    };
  });
}
