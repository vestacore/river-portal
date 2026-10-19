import { discharge } from '@river/figure';
import { holdsCredentials } from './holdsCredentials.ts';
import type { FunctionRequest } from './types/FunctionRequest.ts';
import type { FunctionResponse } from './types/FunctionResponse.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * A bank's carrying function, woken by a new document in its outbox (an Eventarc Firestore event:
 * the document's path arrives in the `ce-document` header, and that is all that is read of it).
 * It carries that one intention across and lets the answer enter the stream. A controller that
 * throws answers 500, so the event is delivered again; the kernel counts attempts and turns the
 * last failure into a fact. A message that is not for this river is acknowledged and ignored; one
 * for a bank whose credentials this function does not hold is refused, before any attempt is
 * counted, so that it is delivered again once the function is set right.
 */
export async function handleDischarge(runtime: PayRuntime, request: FunctionRequest): Promise<FunctionResponse> {
  if (request.method !== 'POST') return { status: 405, body: { error: 'POST only' } };
  const document = request.headers['ce-document'] ?? (request.headers['ce-subject'] ?? '').replace(/^documents\//, '');
  const match = /^(.+)\/outbox\/([a-z]+)\/intentions\/(.+)-(\d{9})$/.exec(document);
  // An event that can never be carried is acknowledged, not refused: the messaging layer delivers
  // anything but a 2xx again and again for a day.
  if (!match || match[1] !== runtime.root) return { status: 200, body: { carried: false, ignored: 'not an outbox entry of this river' } };
  const [, , controller, stream, seq] = match as unknown as [string, string, string, string, string];
  if (!runtime.assembly.controllers.some((c) => c.id === controller)) return { status: 200, body: { carried: false, ignored: `no bank ${controller} is mounted` } };
  if (!holdsCredentials(runtime.config, controller)) return { status: 500, body: { error: `this function does not hold the credentials of ${controller}` } };
  try {
    const receipt = await discharge(runtime.store, runtime.root, runtime.assembly, { controller, stream, seq: Number(seq) });
    return { status: 200, body: receipt ? { carried: true, facts: receipt.facts.length, duplicate: receipt.duplicate } : { carried: false } };
  } catch (error) {
    return { status: 500, body: { error: error instanceof Error ? error.message : String(error) } };
  }
}
