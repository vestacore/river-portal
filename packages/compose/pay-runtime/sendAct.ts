import { parseJson } from '@river/pay-providers';
import { enterAct } from './enterAct.ts';
import type { DoorAct } from './types/DoorAct.ts';
import type { DoorAnswer } from './types/DoorAnswer.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * Takes a gesture to the door, wherever the door is. In one process, it is a call. In the cloud the
 * cabinets may only read; the gesture is posted to the door function, with this service's own
 * identity token, and the door function alone writes.
 */
export async function sendAct(runtime: PayRuntime, act: DoorAct): Promise<DoorAnswer> {
  const { door } = runtime.config;
  if (door.at === 'here') return enterAct(runtime, act);
  const response = await runtime.call(door.url, { headers: { 'content-type': 'application/json' }, body: JSON.stringify(act) });
  if (response.status !== 200 && response.status !== 422) throw new Error(`The door answered ${response.status}`);
  return parseJson(response.body) as unknown as DoorAnswer;
}
