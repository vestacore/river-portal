import { settle } from '@river/figure';
import type { Result } from '@river/kernel';
import { simulatedOutcome, type SimulatedOutcome } from '@river/pay-providers';
import { readOrder, type OrderStatus } from '@river/pay-views';
import { carryPending } from './carryPending.ts';
import { readStandInSession } from './readStandInSession.ts';
import { safeKey } from './safeKey.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * What the stand-in provider's page reports: the payer there chose to pay or to decline. Admitted
 * only for a session a stand-in opened, while that provider is mounted as a stand-in, from the
 * payer who opened the gate — the holder of the pay key, or the payer the order is addressed to —
 * and once per session. It enters as a fact of the world, marked simulated, where a webhook would.
 */
export async function simulateOutcome(
  runtime: PayRuntime,
  sessionRef: string,
  outcome: SimulatedOutcome,
  by: { payKey: string } | { payerRef: string },
  at: Date = new Date(),
): Promise<Result<{ orderId: string; status: OrderStatus }>> {
  const { store, root, assembly, config } = runtime;
  const view = await readStandInSession(runtime, sessionRef, by);
  const session = view?.session;
  if (!view || !session) return { ok: false, errors: [{ field: 'session', code: 'notFound' }] };
  await settle(store, root, assembly, {
    stream: view.orderId,
    at: at.toISOString(),
    actKey: safeKey('sim', session.sessionRef),
    entering: simulatedOutcome({ provider: session.provider, sessionRef: session.sessionRef }, { amountMinor: view.amountMinor, currency: view.currency }, outcome).map((draft) => ({
      draft,
      origin: { via: 'world' as const, controller: session.provider, answering: null },
      causedBy: null,
    })),
  });
  if (config.carry === 'inline') await carryPending(runtime, at, view.orderId);
  return { ok: true, value: { orderId: view.orderId, status: (await readOrder(store, root, view.orderId))?.status ?? view.status } };
}
