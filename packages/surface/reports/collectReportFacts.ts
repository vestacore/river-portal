import type { DocStore } from '@river/store';
import { readFlow, readGratitudeNote, type CostKind } from '@river/flows';
import { giftPaths, type Gift } from '@river/gifts';
import { readNeed } from '@river/needs';
import { redactPii } from '@river/privacy';
import type { ReportFacts } from './types/ReportFacts.ts';

/** Gathers the pseudonymised facts of a flow for a report. */
export async function collectReportFacts(store: DocStore, orgId: string, flowId: string, currency: string): Promise<ReportFacts> {
  const flow = await readFlow(store, orgId, flowId);
  if (!flow) throw new Error(`Unknown flow ${flowId}`);
  const needs = (await Promise.all(flow.needIds.map((id) => readNeed(store, orgId, id)))).filter((n) => n !== null);
  const gifts = (await Promise.all(flow.giftIds.map((id) => store.get<Gift>(giftPaths.gift(orgId, id))))).filter((g) => g !== null);
  const costBreakdown: Partial<Record<CostKind, number>> = {};
  let costsMinor = 0;
  for (const cost of flow.costs.filter((c) => c.status === 'approved')) {
    costBreakdown[cost.kind] = (costBreakdown[cost.kind] ?? 0) + cost.reportingMinor;
    costsMinor += cost.reportingMinor;
  }
  let gratitude: ReportFacts['gratitude'] = null;
  const wallNote = flow.gratitude.find((g) => g.onWall);
  if (wallNote) {
    const note = await readGratitudeNote(store, orgId, wallNote.noteId);
    const need = needs.find((n) => n.record.id === wallNote.needId);
    const names = need?.details ? [need.details.name, need.details.settlement] : [];
    if (note?.showOnWall) gratitude = { text: redactPii(note.text, names), locale: note.locale };
  }
  return {
    flowId,
    campaignId: flow.campaignId,
    oblastId: flow.oblastId,
    recipients: needs.map((n) => ({ kind: n.record.forWhom, householdSize: n.record.householdSize })),
    categoryIds: [...new Set(needs.map((n) => n.record.categoryId))],
    giftsCount: gifts.length,
    currency,
    moneyMinor: gifts.reduce((sum, g) => sum + (g.currency === currency && g.amountMinor ? g.amountMinor : 0), 0),
    costsMinor,
    costBreakdown,
    carrierKind: flow.carrier?.kind ?? null,
    fromLabel: flow.fromLabel,
    dispatchedAt: flow.dispatchedAt,
    arrivedAt: flow.arrivedAt,
    confirmedAt: flow.confirmedAt,
    gratitude,
  };
}
