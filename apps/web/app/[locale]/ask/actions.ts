'use server';

import { redirect } from 'next/navigation';
import { hasRole } from '@river/identity';
import { localeFromSegment, segmentForLocale } from '@river/i18n';
import { submitNeed, validateNeedInput } from '@river/needs';
import { commandFor } from '@/lib/commandFor';
import { errorsByField } from '@/lib/errorsByField';
import { formToRecord } from '@/lib/formToRecord';
import { getIdentity } from '@/lib/getIdentity';
import type { AskState } from './types';

/**
 * Receives a request for help. Open to everyone; no account (spec ADR-005). When a signed-in
 * recipient asks, the request is also linked to them, so it appears in "My river".
 */
export async function submitNeedAction(_prev: AskState, form: FormData): Promise<AskState> {
  const raw = formToRecord(form);
  const locale = localeFromSegment(raw.localeSegment) ?? 'en-GB';
  if (raw.website) redirect(`/${segmentForLocale(locale)}/ask`); // honeypot: bots fill hidden fields
  const input = validateNeedInput({ ...raw, locale });
  if (!input.ok) return { errors: errorsByField(input.errors), values: raw };
  const identity = await getIdentity(locale);
  const own = identity?.personId && hasRole(identity, 'recipient') ? { personId: identity.personId } : undefined;
  const { env } = await commandFor(own ? identity : null, 'web', 'recipient');
  const { trackingToken } = await submitNeed(env, input.value, own);
  redirect(`/${segmentForLocale(locale)}/track/${trackingToken}?new=1`);
}
