import type { Rail } from '@river/psp-facts';
import { acquirersFor } from '@river/psp-instruments';
import type { RouteChoice, RouteQuote, RouteStrategy } from './types/Route.ts';

function hash(text: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16_777_619); }
  return (h >>> 0) % 10_000;
}

/**
 * The routing event: the acquirer that carries one attempt. A unit's route rule wins. Otherwise the
 * unit's strategy decides among the acquirers the stand is connected with:
 * - `approval_first`: traffic is shared by weight — the best approval rate first unless weights were set —
 *   deterministically by the session id, so a replay routes the same way;
 * - `least_cost`: the lowest expected fee under the merchant's terms (`quotes`), the better approval on a tie;
 * - `on_us_first`: an acquirer of the card's own bank whose terms price it, otherwise least cost.
 * An acquirer whose approval rate is below `minApprovalBps` is never chosen to save on fees; when no
 * acquirer qualifies, approval first decides. Every acquirer considered is recorded with its quote.
 */
export function chooseRoute(input: {
  rail: Rail; region: 'UA' | 'EU'; sessionId: string; routeTo: string | null; weights?: Readonly<Record<string, number>>;
  available?: readonly string[]; strategy?: RouteStrategy; minApprovalBps?: number; quotes?: readonly RouteQuote[];
}): RouteChoice {
  const candidates = acquirersFor(input.rail, input.region, input.available);
  if (candidates.length === 0) throw new Error(`No acquirer carries ${input.rail} in ${input.region}`);
  const quoteOf = (id: string) => input.quotes?.find((q) => q.acquirer === id);
  const alternatives = candidates.map((a) => {
    const quote = quoteOf(a.id);
    return { acquirer: a.id, feeMinor: quote?.feeMinor ?? null, approvalBps: a.approvalBps, onUs: quote?.onUs ?? false, eligible: quote !== undefined && quote.feeMinor !== null && a.approvalBps >= (input.minApprovalBps ?? 0) };
  });
  const pick = (acquirer: string, rule: string): RouteChoice => {
    const quote = quoteOf(acquirer);
    return { acquirer, rule, onUs: quote?.onUs ?? false, feeMinor: quote?.feeMinor ?? null, alternatives };
  };
  if (input.routeTo && candidates.some((a) => a.id === input.routeTo)) return pick(input.routeTo, `rule:route→${input.routeTo}`);
  const eligible = alternatives.filter((a) => a.eligible).sort((a, b) => a.feeMinor! - b.feeMinor! || b.approvalBps - a.approvalBps);
  if (input.strategy === 'on_us_first') {
    const own = eligible.find((a) => a.onUs);
    if (own) return pick(own.acquirer, 'on-us');
  }
  if ((input.strategy === 'on_us_first' || input.strategy === 'least_cost') && eligible[0]) return pick(eligible[0].acquirer, eligible[0].onUs ? 'least-cost:on-us' : 'least-cost');
  const weights = candidates.map((a, i) => input.weights?.[a.id] ?? (i === 0 ? 65 : 35 / Math.max(1, candidates.length - 1)));
  const total = weights.reduce((s, w) => s + w, 0);
  let point = (hash(input.sessionId) / 10_000) * total;
  const rule = input.strategy && input.strategy !== 'approval_first' ? 'fallback:approval-first' : input.weights ? `weights:${weights.map((w) => Math.round(w)).join('/')}` : 'best-approval-first';
  for (let i = 0; i < candidates.length; i += 1) {
    point -= weights[i]!;
    if (point < 0) return pick(candidates[i]!.id, rule);
  }
  return pick(candidates[0]!.id, rule);
}
