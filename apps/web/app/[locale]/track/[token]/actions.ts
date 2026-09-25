'use server';

import { revalidatePath } from 'next/cache';
import { confirmDelivery, validateConfirmationInput } from '@river/flows';
import { localeFromSegment } from '@river/i18n';
import { readRecipientView } from '@river/needs';
import { commandEnv, getRuntime, publicActor } from '@river/runtime';
import { formToRecord } from '@/lib/formToRecord';

/** The recipient confirms receipt through their private link; thanks and consents are optional. */
export async function confirmAction(token: string, _prev: { done: boolean; error?: string }, form: FormData): Promise<{ done: boolean; error?: string }> {
  const raw = formToRecord(form);
  const runtime = await getRuntime();
  const view = await readRecipientView(runtime.store, runtime.config.orgId, token);
  if (!view?.canConfirm) return { done: false, error: 'invalid' };
  const locale = localeFromSegment(raw.localeSegment) ?? view.locale;
  const input = validateConfirmationInput({ ...raw, locale }, view.needId);
  if (!input.ok) return { done: false, error: 'received' };
  await confirmDelivery(commandEnv(runtime, publicActor('recipient')), input.value);
  revalidatePath('/', 'layout');
  return { done: true };
}
