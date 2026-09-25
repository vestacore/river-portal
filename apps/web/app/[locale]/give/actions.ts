'use server';

import { revalidatePath } from 'next/cache';
import { pledgeGift, validatePledgeInput } from '@river/gifts';
import { commandEnv, getRuntime, publicActor } from '@river/runtime';
import { errorsByField } from '@/lib/errorsByField';
import { formToRecord } from '@/lib/formToRecord';

export type GiveState = { done: boolean; errors: Record<string, string>; values: Record<string, string> };

/** Records a gift pledge; payment instructions follow from a coordinator (iteration 1). */
export async function pledgeAction(_prev: GiveState, form: FormData): Promise<GiveState> {
  const raw = formToRecord(form);
  if (raw.website) return { done: true, errors: {}, values: {} };
  const input = validatePledgeInput(raw);
  if (!input.ok) return { done: false, errors: errorsByField(input.errors), values: raw };
  const runtime = await getRuntime();
  await pledgeGift(commandEnv(runtime, publicActor('giver')), input.value);
  revalidatePath('/', 'layout');
  return { done: true, errors: {}, values: {} };
}
