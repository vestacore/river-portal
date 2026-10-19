import type { Controller } from '@river/figure';
import { payFacts, type ProviderSessionFailed, type ProviderSessionOpened, type ProviderSessionRequested } from '@river/pay-facts';
import { parseJson } from './parseJson.ts';
import type { FetchLike } from './types/FetchLike.ts';
import type { StripeOptions } from './types/StripeOptions.ts';

/**
 * The Stripe bank: a hosted Checkout Session for one attempt. The payer's card never touches the
 * river — Stripe's page takes it. The intention's key is sent as the Idempotency-Key, so a retried
 * message opens the same session; every parameter is computed from the intention alone — the
 * expiry from the intention's own time — because Stripe requires a retried request to be identical.
 * With a connected account, Stripe splits the payment itself.
 * A refusal (4xx) is an answer. An outage (5xx, 429, the network) and a key still in use by an
 * earlier, unfinished request (409) are thrown, to be tried again.
 */
export function stripeProvider(options: StripeOptions): Controller {
  const send = options.fetch ?? (globalThis.fetch as unknown as FetchLike);
  const base = options.apiBase ?? 'https://api.stripe.com';
  const failed = (attempt: number, reason: string) => {
    const payload: ProviderSessionFailed = { provider: 'stripe', attempt, reason: reason.slice(0, 200) };
    return [{ type: payFacts.providerSessionFailed, payload }];
  };
  return {
    id: 'stripe',
    claims: [payFacts.providerSessionRequested],
    accepts: (intention) => intention.payload.provider === 'stripe',
    discharge: async (intention, key) => {
      const request = intention.payload as ProviderSessionRequested;
      const form = new URLSearchParams({
        mode: 'payment',
        success_url: options.returnUrl(request.orderId),
        cancel_url: options.returnUrl(request.orderId),
        client_reference_id: request.orderId,
        'metadata[orderId]': request.orderId,
        'metadata[invoiceId]': request.invoiceId,
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': request.currency.toLowerCase(),
        'line_items[0][price_data][unit_amount]': String(request.amountMinor),
        'line_items[0][price_data][product_data][name]': request.title,
      });
      const ttl = Math.min(1_440, Math.max(30, options.sessionTtlMinutes));
      form.set('expires_at', String(Math.floor(Date.parse(intention.at) / 1000) + ttl * 60));
      const account = options.accountFor(request.merchantId);
      if (account) {
        form.set('payment_intent_data[application_fee_amount]', String(request.feeMinor));
        form.set('payment_intent_data[transfer_data][destination]', account);
      }
      const response = await send(`${base}/v1/checkout/sessions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${options.secretKey}`, 'content-type': 'application/x-www-form-urlencoded', 'idempotency-key': key },
        body: form.toString(),
      });
      if (response.status >= 500 || response.status === 429 || response.status === 409) throw new Error(`Stripe is unavailable (${response.status})`);
      const body = parseJson(await response.text());
      if (!response.ok) return failed(request.attempt, String((body.error as { message?: unknown } | undefined)?.message ?? `Stripe refused the session (${response.status})`));
      if (typeof body.id !== 'string' || typeof body.url !== 'string') return failed(request.attempt, 'Stripe answered without a session');
      const opened: ProviderSessionOpened = { provider: 'stripe', attempt: request.attempt, sessionRef: body.id, redirectUrl: body.url, simulated: false };
      return [{ type: payFacts.providerSessionOpened, payload: opened }];
    },
    exhausted: (intention, reason) => failed(Number(intention.payload.attempt ?? 0), reason),
  };
}
