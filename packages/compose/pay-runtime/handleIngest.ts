import { parseJson } from '@river/pay-providers';
import { enterAct } from './enterAct.ts';
import { parseDoorAct } from './parseDoorAct.ts';
import type { FunctionRequest } from './types/FunctionRequest.ts';
import type { FunctionResponse } from './types/FunctionResponse.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * The door function. Only the cabinets' service may call it (IAM); it trusts them for who is
 * acting, and for nothing else — it admits the door's gestures and no other kind of fact.
 * 200 with the answer; 422 when the gesture was understood and refused; 400 when it was not a gesture.
 */
export async function handleIngest(runtime: PayRuntime, request: FunctionRequest): Promise<FunctionResponse> {
  if (request.method !== 'POST') return { status: 405, body: { error: 'POST only' } };
  const act = parseDoorAct(parseJson(request.body));
  if (!act) return { status: 400, body: { error: 'not a gesture this door admits' } };
  const answer = await enterAct(runtime, act);
  return { status: answer.ok ? 200 : 422, body: answer };
}
