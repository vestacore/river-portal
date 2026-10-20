import type { PspFact } from '@river/psp-facts';
import { invoiceProjector } from '@river/psp-invoice';
import { postingsOf } from '@river/psp-ledger';
import { orderProjector } from '@river/psp-order';
import { paymentProjector } from '@river/psp-payment';
import { sessionProjector, type SessionView } from '@river/psp-session';
import { projectionDelta, riverOf, type BridgeRow, type ProjectionDelta } from '@river/psp-views';
import type { World } from './types/World.ts';

const projectors = [orderProjector, invoiceProjector, sessionProjector, paymentProjector] as const;

/**
 * The river of one session with what each bridge formed: the facts that name its order, its invoice,
 * itself or its payment are replayed in order through every projection, and the change each fact made
 * is kept beside it — the explicit view of how one attempt formed the four views and the ledger.
 * `after` is the payment's own life past the mouth: refunds, disputes, payouts.
 */
export function riverOfSession(world: World, sessionId: string): { session: SessionView; bridges: BridgeRow[]; after: BridgeRow[] } | null {
  const session = world.views.sessions.get(sessionId);
  if (!session) return null;
  const ids = new Set([session.orderId, session.invoiceId, sessionId, session.paymentId].filter((x): x is string => typeof x === 'string'));
  const names = (f: PspFact) => { const p = f.payload as Record<string, unknown>; return ['orderId', 'invoiceId', 'sessionId', 'paymentId'].some((k) => typeof p[k] === 'string' && ids.has(p[k] as string)); };
  const maps = projectors.map(() => new Map<string, unknown>());
  const deltas = new Map<string, ProjectionDelta[]>();
  for (const fact of world.log) {
    if (!names(fact)) continue;
    const formed: ProjectionDelta[] = [];
    projectors.forEach((projector, i) => {
      if (!projector.hears.includes(fact.type)) return;
      const key = projector.keyOf(fact);
      if (!key) return;
      const map = maps[i]!;
      const before = (map.get(key) ?? null) as Record<string, unknown> | null;
      const after = (projector.project as (v: unknown, f: PspFact) => unknown)(before, fact) as Record<string, unknown> | null;
      if (after) map.set(key, after);
      const delta = projectionDelta(projector.projection, key, before, after);
      if (delta && (key === sessionId || ids.has(key))) formed.push(delta);
    });
    const postings = postingsOf(fact);
    if (postings.length > 0) formed.push({ projection: 'ledger', key: 'journal', created: true, changes: postings.map((p) => ({ field: `${p.side === 'debit' ? 'Dr' : 'Cr'} ${p.account}`, from: null, to: p.amountMinor })) });
    deltas.set(`${fact.stream}#${fact.seq}`, formed);
  }
  return {
    session,
    bridges: riverOf(world.streams.get(sessionId) ?? [], deltas),
    after: session.paymentId ? riverOf(world.streams.get(session.paymentId) ?? [], deltas) : [],
  };
}
