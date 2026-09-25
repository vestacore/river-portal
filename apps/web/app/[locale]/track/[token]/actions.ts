'use server';

import { revalidatePath } from 'next/cache';
import { confirmDelivery, validateConfirmationInput } from '@river/flows';
import { localeFromSegment } from '@river/i18n';
import { readRecipientView } from '@river/needs';
import type { ConfirmState } from '@/components/site/ConfirmForm';
import { commandFor } from '@/lib/commandFor';
import { formToRecord } from '@/lib/formToRecord';

/** The recipient confirms receipt through their private link; thanks and consents are optional. */
export async function confirmAction(token: string, _prev: ConfirmState, form: FormData): Promise<ConfirmState> {
  const raw = formToRecord(form);
  const { runtime, env } = await commandFor(null, 'web', 'recipient');
  const view = await readRecipientView(runtime.store, runtime.config.orgId, token);
  if (!view?.canConfirm) return { done: false, error: 'invalid' };
  const locale = localeFromSegment(raw.localeSegment) ?? view.locale;
  const input = validateConfirmationInput({ ...raw, locale }, view.needId);
  if (!input.ok) return { done: false, error: 'received' };
  await confirmDelivery(env, input.value);
  revalidatePath('/', 'layout');
  return { done: true };
}
