import { nameOf } from './nameOf.ts';
import type { InsightDraft } from './types/Agent.ts';
import type { SwarmInput } from './types/SwarmInput.ts';
import { counted } from './counted.ts';

const day = 86_400_000;
const pct = (bps: number) => (bps / 100).toFixed(1);

/**
 * The Navigator: approval rates of card acquirers over the last week, per entity. Where one approves
 * clearly less than another on enough attempts, it proposes moving part of the traffic.
 */
export function routerInsights(input: SwarmInput): InsightDraft[] {
  const now = Date.parse(input.now);
  const tally = new Map<string, { entity: string; acquirer: string; approved: number; declined: number }>();
  const entityOf = (unitId: string) => { let u = input.units.find((x) => x.id === unitId); while (u && u.kind !== 'entity') u = input.units.find((x) => x.id === u!.parentId); return u?.id ?? 'unknown'; };
  for (const s of input.sessions) {
    if (!s.route || s.route.rail !== 'card' || now - Date.parse(s.openedAt) > 7 * day) continue;
    const approved = s.paymentId !== null;
    const declined = s.failure?.code !== undefined && s.failure.code !== 'authentication_failed' && !approved && s.outcome === 'failed';
    if (!approved && !declined) continue;
    const key = `${entityOf(s.unitId)}|${s.route.acquirer}`;
    const t = tally.get(key) ?? { entity: entityOf(s.unitId), acquirer: s.route.acquirer, approved: 0, declined: 0 };
    if (approved) t.approved += 1; else t.declined += 1;
    tally.set(key, t);
  }
  const out: InsightDraft[] = [];
  const entities = new Set([...tally.values()].map((t) => t.entity));
  for (const entity of entities) {
    const rows = [...tally.values()].filter((t) => t.entity === entity && t.approved + t.declined >= 20)
      .map((t) => ({ ...t, bps: Math.round((t.approved / (t.approved + t.declined)) * 10_000) })).sort((a, b) => b.bps - a.bps);
    const best = rows[0];
    const worst = rows.at(-1);
    if (!best || !worst || best === worst || best.bps - worst.bps < 250) continue;
    const n = worst.approved + worst.declined;
    const name = nameOf(input.units, entity);
    out.push({
      agent: 'router', unitId: entity, subject: { kind: 'route', id: `${entity}:card` },
      title: { 'en-GB': `Card approvals: ${worst.acquirer} trails ${best.acquirer}`, uk: `Схвалення карток: ${worst.acquirer} поступається ${best.acquirer}` },
      finding: { 'en-GB': `Over 7 days in ${name['en-GB']}: ${best.acquirer} approves ${pct(best.bps)} %, ${worst.acquirer} ${pct(worst.bps)} % on ${counted(n, ['attempt', 'attempts'], ['спробі', 'спробах', 'спробах'])['en-GB']}.`, uk: `За 7 днів у ${name.uk}: ${best.acquirer} схвалює ${pct(best.bps)} %, ${worst.acquirer} — ${pct(worst.bps)} % на ${counted(n, ['attempt', 'attempts'], ['спробі', 'спробах', 'спробах']).uk}.` },
      evidence: rows.map((r) => ({ kind: 'route' as const, id: r.acquirer, note: { 'en-GB': `${r.approved} approved · ${r.declined} declined`, uk: `${r.approved} схвалено · ${r.declined} відхилено` } })),
      confidence: Math.min(0.9, 0.5 + n / 400),
      proposal: { kind: 'shift_route', risk: 'high', params: { entity, from: worst.acquirer, to: best.acquirer, sharePct: 30 },
        effect: { 'en-GB': `Route 30 % of card attempts from ${worst.acquirer} to ${best.acquirer} for a week, then compare.`, uk: `Спрямувати 30 % карткових спроб з ${worst.acquirer} до ${best.acquirer} на тиждень і порівняти.` } },
      consulted: [],
    });
  }
  return out;
}
