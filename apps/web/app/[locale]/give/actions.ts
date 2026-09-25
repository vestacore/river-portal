'use server';

import { revalidatePath } from 'next/cache';
import { pledgeGift, validatePledgeInput } from '@river/gifts';
import { hasRole } from '@river/identity';
import { settingList } from '@river/settings';
import { commandFor } from '@/lib/commandFor';
import { errorsByField } from '@/lib/errorsByField';
import { formToRecord } from '@/lib/formToRecord';
import { getIdentity } from '@/lib/getIdentity';

export type GiveState = { done: boolean; errors: Record<string, string>; values: Record<string, string> };

/**
 * Records a pledge of a kind the organisation accepts (settings: giving.kinds). A signed-in giver's
 * pledge is linked to them, so they can follow it in "My river".
 */
export async function pledgeAction(_prev: GiveState, form: FormData): Promise<GiveState> {
  const raw = formToRecord(form);
  if (raw.website) return { done: true, errors: {}, values: {} };
  const input = validatePledgeInput(raw);
  if (!input.ok) return { done: false, errors: errorsByField(input.errors), values: raw };
  const identity = await getIdentity();
  const own = identity?.personId && hasRole(identity, 'giver', 'sponsor') ? identity : null;
  const { env, settings } = await commandFor(own, 'web', 'giver');
  if (!settingList(settings, 'giving.kinds').includes(input.value.kind)) return { done: false, errors: { kind: 'kind' }, values: raw };
  await pledgeGift(env, { ...input.value, giverId: own?.personId ?? null });
  revalidatePath('/', 'layout');
  return { done: true, errors: {}, values: {} };
}
