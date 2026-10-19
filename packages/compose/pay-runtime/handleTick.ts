import { figurePaths } from '@river/figure';
import { carryPending } from './carryPending.ts';
import { closeAbandoned } from './closeAbandoned.ts';
import { expireDue } from './expireDue.ts';
import { readWaiting } from './readWaiting.ts';
import type { FunctionRequest } from './types/FunctionRequest.ts';
import type { FunctionResponse } from './types/FunctionResponse.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * The clock function, called on a schedule: for an invoice past its date it asks for the order to
 * be withdrawn; a provider's page nobody completed is closed; and the outbox is looked at. Where
 * one process is the whole river, what waits is carried across.
 * Where banks are functions, an intention that has waited too long is delivered to its bank again,
 * exactly as the messaging layer would have delivered it — the bank carries it with the same
 * idempotency key, so nothing is done twice. What still waits is counted and reported.
 */
export async function handleTick(runtime: PayRuntime, request: FunctionRequest, at: Date = new Date()): Promise<FunctionResponse> {
  if (request.method !== 'POST') return { status: 405, body: { error: 'POST only' } };
  const { config, root } = runtime;
  const expired = await expireDue(runtime, at);
  const abandoned = await closeAbandoned(runtime, at);
  const carried = config.carry === 'inline' ? (await carryPending(runtime, at)).carried : 0;
  const waiting = await readWaiting(runtime, at);
  const stale = waiting.filter((entry) => entry.stale);
  let woken = 0;
  if (config.carry === 'outbox') {
    for (const entry of stale) {
      const url = config.bankUrls[entry.controller];
      if (!url) continue;
      try {
        const answer = await runtime.call(url, {
          headers: { 'ce-type': 'google.cloud.firestore.document.v1.created', 'ce-document': figurePaths.intention(root, entry.controller, entry.stream, entry.seq) },
          body: '',
        });
        if (answer.status === 200) woken += 1;
      } catch {
        // The bank could not be reached; the intention is still in the outbox and is counted again next time.
      }
    }
  }
  return { status: 200, body: { expired, abandoned, carried, waiting: waiting.length, stale: stale.length, woken } };
}
