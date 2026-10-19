import { settle } from '@river/figure';
import { payFacts, type PaymentCaptured } from '@river/pay-facts';
import type { SimulatedOutcome } from '@river/pay-providers';
import { readOrder } from '@river/pay-views';
import { cancelOrderAs } from './cancelOrderAs.ts';
import { placeOrderAs } from './placeOrderAs.ts';
import { requestCheckoutFor } from './requestCheckoutFor.ts';
import { simulateOutcome } from './simulateOutcome.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * A lived-in demo river, made the honest way: every order is placed, asked for and answered
 * through the same doors and banks a real one would pass, with the stand-in providers. Each place
 * the line can end is there once — paid by either provider, waiting, declined, refused, flagged,
 * withdrawn, and one past its date that waits for the clock. All fictional; no money moves.
 */
export async function seedPayDemo(runtime: PayRuntime, now: Date = new Date()): Promise<void> {
  const { store, root, assembly } = runtime;
  const ago = (hours: number) => new Date(now.getTime() - hours * 3_600_000);

  const place = async (merchantId: string, payerRef: string, title: string, amount: string, currency: string, hours: number): Promise<string> => {
    const placed = await placeOrderAs(runtime, merchantId, { title, amount, currency, payerRef }, ago(hours));
    if (!placed.ok) throw new Error(`Demo order "${title}" could not be placed: ${placed.errors.map((e) => `${e.field}:${e.code}`).join(', ')}`);
    runtime.demoPayKeys[placed.value.orderId] = placed.value.payKey;
    return placed.value.orderId;
  };
  const ask = async (orderId: string, payerRef: string, hours: number) => {
    await requestCheckoutFor(runtime, { orderId, payerRef }, ago(hours));
    return readOrder(store, root, orderId);
  };
  const answer = async (orderId: string, payerRef: string, outcome: SimulatedOutcome, hours: number) => {
    const open = await ask(orderId, payerRef, hours);
    if (open?.session) await simulateOutcome(runtime, open.session.sessionRef, outcome, { payerRef }, ago(hours - 0.1));
  };

  await answer(await place('m-bakery', 'corner-cafe', 'Bread for the week — forty loaves', '120', 'EUR', 50), 'corner-cafe', 'paid', 49);
  await cancelOrderAs(runtime, { role: 'merchant', id: 'm-bakery' }, await place('m-bakery', 'anna.k', 'Croissants, a dozen', '18', 'EUR', 31), 'sold out today', ago(30));
  await answer(await place('m-bakery', 'anna.k', 'Birthday cake', '35', 'USD', 28), 'anna.k', 'paid', 27);

  // Money the invoice does not explain: the provider reports one pound less than was asked.
  const short = await ask(await place('m-bakery', 'corner-cafe', 'Catering deposit', '200', 'GBP', 20), 'corner-cafe', 19.5);
  if (short?.session) {
    const captured: PaymentCaptured = { provider: short.session.provider, sessionRef: short.session.sessionRef, providerRef: `simpay_${short.session.sessionRef}`, amountMinor: short.amountMinor - 100, currency: short.currency, simulated: true };
    await settle(store, root, assembly, {
      stream: short.orderId,
      at: ago(19.4).toISOString(),
      actKey: 'event-demo-short-capture',
      entering: [{ draft: { type: payFacts.paymentCaptured, payload: captured }, origin: { via: 'world', controller: short.session.provider, answering: null }, causedBy: null }],
    });
  }

  await place('m-ceramics', 'corner-cafe', 'Glaze workshop voucher', '45', 'EUR', runtime.config.invoiceTtlHours + 8);
  await answer(await place('m-ceramics', 'anna.k', 'Set of six cups', '84', 'EUR', 6), 'anna.k', 'declined', 5.5);
  await ask(await place('m-ceramics', 'corner-cafe', 'Two serving bowls', '1800', 'UAH', 5), 'corner-cafe', 4.8);
  await place('m-bakery', 'anna.k', 'Sourdough course, Saturday', '60', 'EUR', 2);
  await place('m-bakery', 'corner-cafe', 'Rye loaves, standing order', '96.50', 'EUR', 1);
}
