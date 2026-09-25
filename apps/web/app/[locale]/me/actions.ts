'use server';

import { revalidatePath } from 'next/cache';
import { confirmDelivery, readFlow, recordDelivery, submitCost, validateConfirmationInput, validateCostInput } from '@river/flows';
import { localeFromSegment } from '@river/i18n';
import { readNeed } from '@river/needs';
import type { ConfirmState } from '@/components/site/ConfirmForm';
import { actingAs } from '@/lib/actingAs';
import { costCurrencies } from '@/lib/costCurrencies';
import { formToRecord } from '@/lib/formToRecord';

/** A signed-in recipient confirms their own request arrived (the same form as the tracking link). */
export async function confirmMineAction(needId: string, _prev: ConfirmState, form: FormData): Promise<ConfirmState> {
  const { identity, runtime, env } = await actingAs('web', 'recipient');
  const need = await readNeed(runtime.store, runtime.config.orgId, needId);
  if (!need || need.record.personId !== identity.personId) return { done: false, error: 'invalid' };
  if (need.record.status !== 'in_delivery' && need.record.status !== 'delivered') return { done: false, error: 'invalid' };
  const raw = formToRecord(form);
  const input = validateConfirmationInput({ ...raw, locale: localeFromSegment(raw.localeSegment) ?? need.record.locale }, needId);
  if (!input.ok) return { done: false, error: 'received' };
  await confirmDelivery(env, input.value);
  revalidatePath('/', 'layout');
  return { done: true };
}

/** The carrier of a delivery marks it handed over; recipients are then asked to confirm. */
export async function handOverAction(form: FormData): Promise<void> {
  const { identity, runtime, env } = await actingAs('web', 'carrier');
  const flow = await readFlow(runtime.store, runtime.config.orgId, String(form.get('flowId')));
  if (!flow || flow.carrier?.personId !== identity.personId || flow.status !== 'in_motion') return;
  await recordDelivery(env, { flowId: flow.id });
  revalidatePath('/', 'layout');
}

export type CarrierCostState = { sent: boolean; error?: string };

/** The carrier records a cost on the way; it always waits for approval (DP-06). */
export async function carrierCostAction(_prev: CarrierCostState, form: FormData): Promise<CarrierCostState> {
  const { identity, runtime, settings, env } = await actingAs('web', 'carrier');
  const raw = formToRecord(form);
  const flow = await readFlow(runtime.store, runtime.config.orgId, raw.flowId ?? '');
  if (!flow || flow.carrier?.personId !== identity.personId || (flow.status !== 'in_motion' && flow.status !== 'arrived')) return { sent: false, error: 'flow' };
  const cost = validateCostInput(raw, costCurrencies(settings));
  if (!cost) return { sent: false, error: 'cost' };
  await submitCost(env, { flowId: flow.id, cost });
  revalidatePath('/', 'layout');
  return { sent: true };
}
