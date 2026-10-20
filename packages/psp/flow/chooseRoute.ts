import type { Rail } from '@river/psp-facts';
import { acquirersFor } from '@river/psp-instruments';

function hash(text: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16_777_619); }
  return (h >>> 0) % 10_000;
}

/**
 * The routing bridge: the acquirer that carries one attempt. A unit's route rule wins; otherwise traffic
 * is shared between the acquirers of the rail by weight (the best approval rate first, unless weights were
 * set), deterministically by the session id, so a replay routes the same way. The rule is recorded with it.
 */
export function chooseRoute(input: { rail: Rail; region: 'UA' | 'EU'; sessionId: string; routeTo: string | null; weights?: Readonly<Record<string, number>> }): { acquirer: string; rule: string } {
  const candidates = acquirersFor(input.rail, input.region);
  if (input.routeTo && candidates.some((a) => a.id === input.routeTo)) return { acquirer: input.routeTo, rule: `rule:route→${input.routeTo}` };
  if (candidates.length === 0) throw new Error(`No acquirer carries ${input.rail} in ${input.region}`);
  const weights = candidates.map((a, i) => input.weights?.[a.id] ?? (i === 0 ? 65 : 35 / Math.max(1, candidates.length - 1)));
  const total = weights.reduce((s, w) => s + w, 0);
  let point = (hash(input.sessionId) / 10_000) * total;
  for (let i = 0; i < candidates.length; i += 1) {
    point -= weights[i]!;
    if (point < 0) return { acquirer: candidates[i]!.id, rule: input.weights ? `weights:${weights.map((w) => Math.round(w)).join('/')}` : 'best-approval-first' };
  }
  return { acquirer: candidates[0]!.id, rule: 'best-approval-first' };
}
