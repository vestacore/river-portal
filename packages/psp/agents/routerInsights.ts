import type { LocalisedText } from '@river/i18n';
import { counted } from './counted.ts';
import { moneyText } from './moneyText.ts';
import { nameOf } from './nameOf.ts';
import type { InsightDraft } from './types/Agent.ts';
import type { PosOutlook, RoutingOutlook } from './types/Outlook.ts';
import type { SwarmInput } from './types/SwarmInput.ts';

const day = 86_400_000;
const pct = (bps: number) => (bps / 100).toFixed(1);

const strategyName: Record<string, LocalisedText> = {
  approval_first: { 'en-GB': 'approval first', uk: 'спершу схвалення' },
  least_cost: { 'en-GB': 'least cost', uk: 'найменша вартість' },
  on_us_first: { 'en-GB': 'on-us first', uk: 'спершу on-us' },
};
const share = (bps: number) => `${(bps / 100).toFixed(0)} %`;
const rate = (fee: number, volume: number) => (volume > 0 ? `${((fee / volume) * 100).toFixed(2)} %` : '—');
const rateUk = (fee: number, volume: number) => rate(fee, volume).replace('.', ',');

/**
 * The Navigator. Where the stand routes by cost, it reads the routing outlook — the same history
 * replayed under each strategy — and proposes a cheaper strategy, and it reads what each region's
 * terminals cost against the other banks' terms, proposing a change of bank or an on-us clause to
 * negotiate. Elsewhere it compares the approval rates of card acquirers over the last week, per entity,
 * and proposes moving part of the traffic from one that approves clearly less.
 */
export function routerInsights(input: SwarmInput): InsightDraft[] {
  if (input.routing !== undefined || (input.pos && input.pos.length > 0)) return [...strategyInsights(input, input.routing ?? null), ...posInsights(input, input.pos ?? [])];
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

/** A cheaper routing strategy than the one in force, and on-us payments a low approval rate keeps away. */
function strategyInsights(input: SwarmInput, r: RoutingOutlook | null): InsightDraft[] {
  if (!r || r.sessions < 50) return [];
  const out: InsightDraft[] = [];
  const unit = nameOf(input.units, r.unitId);
  const preference = ['on_us_first', 'least_cost', 'approval_first'];
  const best = [...r.simulated].filter((s) => s.strategy !== r.strategy).sort((a, b) => a.feeMinor - b.feeMinor || preference.indexOf(a.strategy) - preference.indexOf(b.strategy))[0];
  const saving = best ? r.actualFeeMinor - best.feeMinor : 0;
  if (best && saving >= 100_000 && saving >= r.actualFeeMinor * 0.04) {
    const name = strategyName[best.strategy] ?? { 'en-GB': best.strategy, uk: best.strategy };
    const monthly = moneyText(Math.round((saving * 30) / r.days), r.currency);
    out.push({
      agent: 'router', unitId: r.unitId, subject: { kind: 'unit', id: `${r.unitId}:routing.strategy:${best.strategy}` }, series: `router:strategy:${r.unitId}`,
      title: { 'en-GB': `Online routing: ${name['en-GB']} would cost less`, uk: `Онлайн-маршрутизація: «${name.uk}» коштувала б менше` },
      finding: {
        'en-GB': `Replaying the last ${r.days} days: ${r.sessions} card payments cost ${moneyText(r.actualFeeMinor, r.currency)['en-GB']} in acquiring fees as routed (${share(r.actualOnUsShareBps)} on-us). Routed ${name['en-GB']}, the same payments would have cost ${moneyText(best.feeMinor, r.currency)['en-GB']}, with ${share(best.onUsShareBps)} on-us and an expected change in approvals of ${(best.approvalDeltaBps / 100).toFixed(1)} pp — about ${monthly['en-GB']} a month less.`,
        uk: `Відтворення останніх ${r.days} днів: ${r.sessions} карткових платежів коштували ${moneyText(r.actualFeeMinor, r.currency).uk} комісій еквайрингу за фактичними маршрутами (${share(r.actualOnUsShareBps)} on-us). За стратегією «${name.uk}» ті самі платежі коштували б ${moneyText(best.feeMinor, r.currency).uk}, з ${share(best.onUsShareBps)} on-us і очікуваною зміною схвалень ${(best.approvalDeltaBps / 100).toFixed(1)} п. п. — приблизно на ${monthly.uk} на місяць менше.`,
      },
      evidence: r.simulated.map((s) => ({ kind: 'route' as const, id: s.strategy, note: { 'en-GB': `${strategyName[s.strategy]?.['en-GB'] ?? s.strategy}: ${moneyText(s.feeMinor, r.currency)['en-GB']}`, uk: `${strategyName[s.strategy]?.uk ?? s.strategy}: ${moneyText(s.feeMinor, r.currency).uk}` } })),
      confidence: 0.84,
      proposal: { kind: 'change_policy', risk: 'high', params: { unitId: r.unitId, key: 'routing.strategy', value: best.strategy },
        effect: { 'en-GB': `Set the routing strategy of ${unit['en-GB']} to ${name['en-GB']}. Acquirers below the ${share(r.minApprovalBps)} approval threshold stay out.`, uk: `Встановити для ${unit.uk} стратегію маршрутизації «${name.uk}». Еквайри нижче порогу схвалення ${share(r.minApprovalBps)} лишаються поза вибором.` } },
      consulted: [],
    });
  }
  for (const b of r.blockedOnUs) {
    // Worth a conversation with the bank once it is a pattern: twenty payments and a hundred hryvnias in the period.
    if (b.sessions < 20 || b.savingMinor < 10_000) continue;
    out.push({
      agent: 'router', unitId: r.unitId, subject: { kind: 'route', id: `${b.acquirer}:on-us:approval` }, series: `router:on-us-blocked:${b.acquirer}`,
      title: { 'en-GB': `${b.bankName['en-GB']}: its own cards cannot go on-us`, uk: `${b.bankName.uk}: власні картки не йдуть on-us` },
      finding: {
        'en-GB': `${b.sessions} payments by ${b.bankName['en-GB']} cards were routed elsewhere in ${r.days} days: ${b.acquirerName['en-GB']} approves ${share(b.approvalBps)}, below the ${share(r.minApprovalBps)} threshold. On-us they would have cost ${moneyText(b.savingMinor, r.currency)['en-GB']} less.`,
        uk: `${b.sessions} платежів картками «${b.bankName.uk}» за ${r.days} днів пішли до інших еквайрів: «${b.acquirerName.uk}» схвалює ${share(b.approvalBps)}, нижче порогу ${share(r.minApprovalBps)}. Через on-us вони коштували б на ${moneyText(b.savingMinor, r.currency).uk} менше.`,
      },
      evidence: [{ kind: 'route', id: b.acquirer, note: { 'en-GB': `approval ${share(b.approvalBps)}`, uk: `схвалення ${share(b.approvalBps)}` } }],
      confidence: 0.72,
      proposal: { kind: 'negotiate_terms', risk: 'high', params: { acquirer: b.acquirer, topic: 'approval' },
        effect: { 'en-GB': `Raise the approval rate with ${b.acquirerName['en-GB']}: above the threshold, its bank’s own cards would be routed on-us.`, uk: `Обговорити з «${b.acquirerName.uk}» рівень схвалення: вище порогу картки його банку маршрутизувалися б on-us.` } },
      consulted: [],
    });
  }
  return out;
}

/** What each region's terminal bank costs against the other banks' terms, and the on-us clauses worth asking for. */
function posInsights(input: SwarmInput, pos: readonly PosOutlook[]): InsightDraft[] {
  const out: InsightDraft[] = [];
  for (const p of pos) {
    const best = [...p.alternatives].sort((a, b) => a.feeMinor - b.feeMinor)[0];
    if (!best || best.acquirer === p.acquirer) continue;
    const saving = p.feeMinor - best.feeMinor;
    if (saving < p.feeMinor * 0.04 || saving < 1_000_000) continue;
    const region = nameOf(input.units, p.regionId);
    const monthly = moneyText(Math.round((saving * 30) / p.days), 'UAH');
    out.push({
      agent: 'router', unitId: p.regionId, subject: { kind: 'unit', id: `${p.regionId}:pos.acquirer:${best.acquirer}` }, series: `router:pos:${p.regionId}`,
      title: { 'en-GB': `${region['en-GB']}: ${best.acquirerName['en-GB']}’s terminals would cost less`, uk: `${region.uk}: термінали «${best.acquirerName.uk}» коштували б менше` },
      finding: {
        'en-GB': `In ${p.days} days the stores of ${region['en-GB']} took ${moneyText(p.volumeMinor, 'UAH')['en-GB']} by card at ${p.acquirerName['en-GB']}’s terminals and paid ${moneyText(p.feeMinor, 'UAH')['en-GB']} (${rate(p.feeMinor, p.volumeMinor)}). Under ${best.acquirerName['en-GB']}’s in-store terms the same cards would have cost ${moneyText(best.feeMinor, 'UAH')['en-GB']} (${rate(best.feeMinor, p.volumeMinor)}), ${share(best.onUsShareBps)} of them on-us — about ${monthly['en-GB']} a month less.`,
        uk: `За ${p.days} днів магазини регіону «${region.uk}» прийняли карткою ${moneyText(p.volumeMinor, 'UAH').uk} на терміналах «${p.acquirerName.uk}» і сплатили ${moneyText(p.feeMinor, 'UAH').uk} (${rateUk(p.feeMinor, p.volumeMinor)}). За умовами «${best.acquirerName.uk}» для магазинів ті самі картки коштували б ${moneyText(best.feeMinor, 'UAH').uk} (${rateUk(best.feeMinor, p.volumeMinor)}), з них ${share(best.onUsShareBps)} on-us — приблизно на ${monthly.uk} на місяць менше.`,
      },
      evidence: p.alternatives.map((a) => ({ kind: 'route' as const, id: a.acquirer, note: { 'en-GB': `${a.acquirerName['en-GB']}: ${rate(a.feeMinor, p.volumeMinor)}`, uk: `${a.acquirerName.uk}: ${rateUk(a.feeMinor, p.volumeMinor)}` } })),
      confidence: 0.78,
      proposal: { kind: 'change_policy', risk: 'high', params: { unitId: p.regionId, key: 'pos.acquirer', value: best.acquirer },
        effect: { 'en-GB': `Move the region’s terminals to ${best.acquirerName['en-GB']}. It is a contract and an installation; the platform records the decision and reads the new bank’s reports from then on.`, uk: `Перевести термінали регіону до «${best.acquirerName.uk}». Це договір і встановлення; платформа фіксує рішення і з того дня читає звіти нового банку.` } },
      consulted: [],
    });
  }
  const byAcquirer = new Map<string, PosOutlook[]>();
  for (const p of pos) if (!p.onUsClause && p.ifOnUsClauseFeeMinor !== null) byAcquirer.set(p.acquirer, [...(byAcquirer.get(p.acquirer) ?? []), p]);
  for (const [acquirer, regions] of byAcquirer) {
    const volume = regions.reduce((s, p) => s + p.volumeMinor, 0);
    const fee = regions.reduce((s, p) => s + p.feeMinor, 0);
    const ifClause = regions.reduce((s, p) => s + (p.ifOnUsClauseFeeMinor ?? p.feeMinor), 0);
    const own = Math.round(regions.reduce((s, p) => s + p.ownBankShareBps * p.volumeMinor, 0) / Math.max(1, volume));
    const days = regions[0]!.days;
    if (own < 2_500 || fee - ifClause < fee * 0.05) continue;
    const first = regions[0]!;
    const monthly = moneyText(Math.round(((fee - ifClause) * 30) / days), 'UAH');
    out.push({
      agent: 'router', unitId: input.units.find((u) => u.parentId === null)?.id ?? first.regionId, subject: { kind: 'route', id: `${acquirer}:pos:on-us-clause` }, series: `router:on-us-clause:${acquirer}`,
      title: { 'en-GB': `${first.acquirerName['en-GB']}: ask for an on-us rate at the tills`, uk: `«${first.acquirerName.uk}»: попросити ставку on-us на касах` },
      finding: {
        'en-GB': `${share(own)} of the card turnover at ${first.acquirerName['en-GB']}’s terminals is ${first.bankName['en-GB']}’s own cards, priced at the same rate as any other: its store terms have no on-us clause. At the on-us rate of its online terms (${((first.onUsRateBps ?? 0) / 100).toFixed(2)} %), the stores would have paid ${moneyText(fee - ifClause, 'UAH')['en-GB']} less in ${days} days — about ${monthly['en-GB']} a month.`,
        uk: `${share(own)} карткового обороту на терміналах «${first.acquirerName.uk}» — власні картки «${first.bankName.uk}», що оплачуються за тією ж ставкою, що й будь-які інші: умови для магазинів не мають пункту on-us. За ставкою on-us його онлайн-умов (${((first.onUsRateBps ?? 0) / 100).toFixed(2).replace('.', ',')} %) магазини сплатили б на ${moneyText(fee - ifClause, 'UAH').uk} менше за ${days} днів — приблизно ${monthly.uk} на місяць.`,
      },
      evidence: regions.map((p) => ({ kind: 'unit' as const, id: p.regionId, note: { 'en-GB': `${nameOf(input.units, p.regionId)['en-GB']}: ${share(p.ownBankShareBps)} own cards`, uk: `${nameOf(input.units, p.regionId).uk}: ${share(p.ownBankShareBps)} власних карток` } })),
      confidence: 0.8,
      proposal: { kind: 'negotiate_terms', risk: 'high', params: { acquirer, topic: 'on_us' },
        effect: { 'en-GB': `Ask ${first.acquirerName['en-GB']} for an on-us clause in the store agreement, at the rate of the online one.`, uk: `Попросити «${first.acquirerName.uk}» додати пункт on-us до договору для магазинів за ставкою онлайн-договору.` } },
      consulted: [],
    });
  }
  return out;
}
