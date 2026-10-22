import type { PspFact } from '@river/psp-facts';
import { invoiceProjector } from '@river/psp-invoice';
import { postingsOf } from '@river/psp-ledger';
import { orderProjector } from '@river/psp-order';
import { paymentProjector } from '@river/psp-payment';
import { sessionProjector } from '@river/psp-session';
import { settlementProjector } from '@river/psp-settlement';
import type { World } from './types/World.ts';

/**
 * Runs one fact through every projection that hears it — the boundaries' views and the ledger.
 * Each boundary forms its own view; nothing else may change them.
 */
export function projectFact(world: World, fact: PspFact): void {
  const fold = <V>(map: Map<string, V>, projector: { hears: readonly string[]; keyOf: (f: PspFact) => string | null; project: (v: V | null, f: PspFact) => V | null }) => {
    if (!projector.hears.includes(fact.type)) return;
    const key = projector.keyOf(fact);
    if (!key) return;
    const next = projector.project(map.get(key) ?? null, fact);
    if (next) map.set(key, next);
  };
  fold(world.views.orders, orderProjector);
  fold(world.views.invoices, invoiceProjector);
  fold(world.views.sessions, sessionProjector);
  fold(world.views.payments, paymentProjector);
  fold(world.views.settlements, settlementProjector);
  const postings = postingsOf(fact);
  if (postings.length > 0) world.journal.push({ stream: fact.stream, seq: fact.seq, type: fact.type, at: fact.at, postings });
}
