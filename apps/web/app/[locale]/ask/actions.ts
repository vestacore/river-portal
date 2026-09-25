'use server';

import { redirect } from 'next/navigation';
import { localeFromSegment, segmentForLocale } from '@river/i18n';
import { submitNeed, validateNeedInput } from '@river/needs';
import { commandEnv, getRuntime, publicActor } from '@river/runtime';
import { errorsByField } from '@/lib/errorsByField';
import { formToRecord } from '@/lib/formToRecord';
import type { AskState } from './types';

/** Receives a request for help. Open to everyone; no account (spec ADR-005). */
export async function submitNeedAction(_prev: AskState, form: FormData): Promise<AskState> {
  const raw = formToRecord(form);
  const locale = localeFromSegment(raw.localeSegment) ?? 'en-GB';
  if (raw.website) redirect(`/${segmentForLocale(locale)}/ask`); // honeypot: bots fill hidden fields
  const input = validateNeedInput({ ...raw, locale });
  if (!input.ok) return { errors: errorsByField(input.errors), values: raw };
  const runtime = await getRuntime();
  const { trackingToken } = await submitNeed(commandEnv(runtime, publicActor('recipient')), input.value);
  redirect(`/${segmentForLocale(locale)}/track/${trackingToken}?new=1`);
}
