'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { signSession } from '@river/identity';
import { carryPending, closeAbandoned, expireDue, getPayRuntime, listPayPersonas, sendAct } from '@river/pay-runtime';
import { getRuntime } from '@river/runtime';
import { formToRecord } from '../formToRecord';
import { getPayActor } from './getPayActor';
import { getPayOperator } from './getPayOperator';
import { ownStandIn } from './ownStandIn';
import type { PlaceState } from './types';

// Every action establishes who is acting again; pages only hide what a person cannot do.
const segmentOf = (form: FormData) => (String(form.get('localeSegment') ?? '') === 'uk' ? 'uk' : 'en-gb');
const done = () => revalidatePath('/', 'layout');
const secure = process.env.NODE_ENV === 'production';

/** Demo only: act as a merchant or a payer of the payment river (signed, httpOnly cookie), then open that cabinet. */
export async function actAsPayAction(form: FormData): Promise<void> {
  const portal = await getRuntime();
  if (portal.config.auth !== 'demo') throw new Error('Demo sign-in is not enabled');
  const persona = listPayPersonas((await getPayRuntime()).config).find((p) => p.id === String(form.get('personaId')));
  if (!persona) return;
  const token = signSession({ personaId: persona.id, iat: Math.floor(Date.now() / 1000) }, portal.config.sessionSecret);
  (await cookies()).set('river-pay', token, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 43_200 });
  redirect(`/${segmentOf(form)}/pay/${persona.role}`);
}

/** Demo only: stop acting in the payment river. */
export async function leavePayAction(form: FormData): Promise<void> {
  (await cookies()).delete('river-pay');
  redirect(`/${segmentOf(form)}/pay`);
}

/** A merchant asks for a payment. The answer carries the pay link once; nothing keeps it afterwards. */
export async function placeOrderAction(_prev: PlaceState, form: FormData): Promise<PlaceState> {
  const actor = await getPayActor();
  if (!actor || actor.role !== 'merchant') throw new Error('Forbidden');
  const values = formToRecord(form);
  const input = { title: values.title ?? '', amount: values.amount ?? '', currency: values.currency ?? '', payerRef: values.payerRef ?? '' };
  const answer = await sendAct(await getPayRuntime(), { act: 'placeOrder', merchantId: actor.ref, input });
  if (!answer.ok) return { placed: null, errors: Object.fromEntries(answer.errors.map((e) => [e.field, e.code])), values: input };
  done();
  return { placed: { orderId: answer.orderId, payPath: `/${segmentOf(form)}/pay/invoice/${answer.payKey}` }, errors: {}, values: {} };
}

/** Asks for an order to be withdrawn: the merchant its own, a steward any. The figure decides. */
export async function withdrawOrderAction(form: FormData): Promise<void> {
  const orderId = String(form.get('orderId') ?? '');
  const reason = String(form.get('reason') ?? '').trim().slice(0, 200);
  const actor = await getPayActor();
  const operator = form.get('as') === 'operator' ? await getPayOperator() : null;
  const by = operator?.canAct ? { role: 'operator' as const, id: operator.id } : actor?.role === 'merchant' ? { role: 'merchant' as const, id: actor.ref } : null;
  if (!by) throw new Error('Forbidden');
  const answer = await sendAct(await getPayRuntime(), { act: 'cancelOrder', orderId, by, reason });
  done();
  // The figure may refuse — a payment is being collected. The page the request came from says so.
  if (!answer.ok && answer.errors.some((error) => error.code === 'collecting') && /^order_[0-9A-Z]{26}$/.test(orderId)) {
    redirect(`/${segmentOf(form)}/pay/${by.role === 'operator' ? 'operator' : 'merchant'}/orders/${orderId}?withdraw=refused`);
  }
}

/**
 * The payer's word at the gate, by the pay key or as the signed-in payer the order is addressed to.
 * When a stand-in's page opens, the payer is taken there; a real provider's page is offered as a
 * link on the invoice, so that leaving the river is the payer's own step.
 */
export async function payAction(form: FormData): Promise<void> {
  const runtime = await getPayRuntime();
  const key = String(form.get('key') ?? '');
  const actor = key ? null : await getPayActor();
  if (!key && actor?.role !== 'payer') throw new Error('Forbidden');
  const by = key ? { payKey: key } : { orderId: String(form.get('orderId') ?? ''), payerRef: actor?.ref ?? '' };
  const answer = await sendAct(runtime, { act: 'requestCheckout', by });
  done();
  if (!answer.ok) return;
  // The way back from the provider: the payer's own key, kept for two hours in this browser only.
  if (key) (await cookies()).set('river-pay-return', `${answer.orderId}:${key}`, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 7_200 });
  // A stand-in's page is this site's own: the payer is taken to it by its path, wherever the site is served from.
  if (answer.status === 'open' && answer.standIn && answer.redirectUrl) redirect(`/${segmentOf(form)}${new URL(answer.redirectUrl).pathname}`);
}

/**
 * What the payer chose on a stand-in provider's page. The river admits it only for a stand-in, and
 * only from the payer whose session it is: this browser's pay key, or the signed-in payer.
 */
export async function simulateAction(form: FormData): Promise<void> {
  const sessionRef = String(form.get('sessionRef') ?? '');
  const outcome = form.get('outcome') === 'paid' ? 'paid' : 'declined';
  const segment = segmentOf(form);
  const own = await ownStandIn(sessionRef);
  if (!own) redirect(`/${segment}/pay/sim/${encodeURIComponent(sessionRef)}`);
  const answer = await sendAct(await getPayRuntime(), { act: 'simulateOutcome', sessionRef, outcome, by: own.by });
  done();
  if (!answer.ok) redirect(`/${segment}/pay/sim/${encodeURIComponent(sessionRef)}`);
  // Back to the payer's own invoice: by the key this browser kept, or — for a signed-in payer — through the return page.
  const [kept, key] = ((await cookies()).get('river-pay-return')?.value ?? '').split(':');
  redirect(kept === answer.orderId && key ? `/${segment}/pay/invoice/${key}` : `/${segment}/pay/return/${answer.orderId}`);
}

/** A steward carries waiting intentions across — only where this process is the river's bank as well. */
export async function carryAction(form: FormData): Promise<void> {
  const operator = await getPayOperator();
  const runtime = await getPayRuntime();
  if (!operator?.canAct || runtime.config.door.at !== 'here') throw new Error('Forbidden');
  const { carried, left } = await carryPending(runtime);
  done();
  redirect(`/${segmentOf(form)}/pay/operator/outbox?carried=${carried}&left=${left}`);
}

/** A steward lets time pass, as the clock function does: invoices past their date are withdrawn, pages nobody completed are closed. */
export async function tickAction(form: FormData): Promise<void> {
  const operator = await getPayOperator();
  const runtime = await getPayRuntime();
  if (!operator?.canAct || runtime.config.door.at !== 'here') throw new Error('Forbidden');
  const expired = await expireDue(runtime);
  const abandoned = await closeAbandoned(runtime);
  done();
  redirect(`/${segmentOf(form)}/pay/operator/outbox?expired=${expired}&abandoned=${abandoned}`);
}
