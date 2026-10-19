import type { Controller } from '@river/figure';
import { payFacts, type PaymentCaptured, type PaymentFailed, type PaymentPending, type ProviderCaptureRequested, type ProviderSessionFailed, type ProviderSessionOpened, type ProviderSessionRequested } from '@river/pay-facts';
import type { FactDraft } from '@river/stream';
import { parseJson } from './parseJson.ts';
import { toDecimal } from './toDecimal.ts';
import { toMinor } from './toMinor.ts';
import type { FetchLike } from './types/FetchLike.ts';
import type { PaypalOptions } from './types/PaypalOptions.ts';

type Capture = { id?: unknown; status?: unknown; status_details?: { reason?: unknown }; amount?: { currency_code?: unknown; value?: unknown } };

/**
 * The PayPal bank: an order the payer approves on PayPal's page, then a capture the river asks for.
 * The intention's key is sent as PayPal-Request-Id, so a retried message repeats nothing. With a
 * merchant's PayPal id, PayPal itself pays the merchant and sets the platform fee aside.
 *
 * Opening an order moves no money: a refusal is an answer, an outage is thrown and — after the last
 * attempt — becomes a failure. A capture is different, because money may move without the river
 * hearing of it. So: only PayPal's own "no" is a failure; a capture PayPal holds as pending is
 * reported as pending, not as failed; an order PayPal says was already captured is read back and
 * reported as captured; and an outage is never turned into a failure — the capture is asked for
 * again, with the same key, for as long as it takes.
 */
export function paypalProvider(options: PaypalOptions): Controller {
  const send = options.fetch ?? (globalThis.fetch as unknown as FetchLike);
  const retry = (status: number) => status >= 500 || status === 429 || status === 409;
  let held: { token: string; until: number } | null = null;

  async function token(): Promise<string> {
    if (held && held.until > Date.now()) return held.token;
    const response = await send(`${options.apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: { authorization: `Basic ${Buffer.from(`${options.clientId}:${options.secret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    const body = parseJson(await response.text());
    if (!response.ok || typeof body.access_token !== 'string') throw new Error(`PayPal gave no access token (${response.status})`);
    // Kept for this process only, and for less time than PayPal allows.
    held = { token: body.access_token, until: Date.now() + Math.max(0, Math.min(Number(body.expires_in) || 0, 3_600) - 60) * 1000 };
    return held.token;
  }

  const sessionFailed = (attempt: number, reason: string): FactDraft[] => {
    const payload: ProviderSessionFailed = { provider: 'paypal', attempt, reason: reason.slice(0, 200) };
    return [{ type: payFacts.providerSessionFailed, payload }];
  };
  const paymentFailed = (sessionRef: string, reason: string): FactDraft[] => {
    const payload: PaymentFailed = { provider: 'paypal', sessionRef, reason: reason.slice(0, 200) };
    return [{ type: payFacts.paymentFailed, payload }];
  };
  const firstCapture = (order: Record<string, unknown>): Capture | undefined => {
    const units = Array.isArray(order.purchase_units) ? (order.purchase_units as Array<{ payments?: { captures?: Capture[] } }>) : [];
    return units[0]?.payments?.captures?.[0];
  };
  // What PayPal says of a capture, as a fact: completed is money, pending is not yet, anything else is a no.
  const captureFact = (sessionRef: string, capture: Capture | undefined): FactDraft[] => {
    const amountMinor = toMinor(capture?.amount?.value);
    if (!capture || typeof capture.id !== 'string') return paymentFailed(sessionRef, 'PayPal answered without a capture');
    if (capture.status === 'PENDING') {
      const pending: PaymentPending = { provider: 'paypal', sessionRef, providerRef: capture.id, reason: String(capture.status_details?.reason ?? 'pending at PayPal') };
      return [{ type: payFacts.paymentPending, payload: pending }];
    }
    if (capture.status !== 'COMPLETED' || amountMinor === null) return paymentFailed(sessionRef, `PayPal did not complete the capture (${String(capture.status ?? 'no status')})`);
    const captured: PaymentCaptured = { provider: 'paypal', sessionRef, providerRef: capture.id, amountMinor, currency: String(capture.amount?.currency_code ?? ''), simulated: false };
    return [{ type: payFacts.paymentCaptured, payload: captured }];
  };

  return {
    id: 'paypal',
    claims: [payFacts.providerSessionRequested, payFacts.providerCaptureRequested],
    accepts: (intention) => intention.payload.provider === 'paypal',
    discharge: async (intention, key) => {
      const headers = { authorization: `Bearer ${await token()}`, 'content-type': 'application/json', 'paypal-request-id': key };

      if (intention.type === payFacts.providerSessionRequested) {
        const request = intention.payload as ProviderSessionRequested;
        const payee = options.payeeFor(request.merchantId);
        const unit: Record<string, unknown> = {
          reference_id: request.orderId,
          custom_id: request.orderId,
          description: request.title.slice(0, 127),
          amount: { currency_code: request.currency, value: toDecimal(request.amountMinor) },
        };
        if (payee) {
          unit.payee = { merchant_id: payee };
          if (request.feeMinor > 0) unit.payment_instruction = { disbursement_mode: 'INSTANT', platform_fees: [{ amount: { currency_code: request.currency, value: toDecimal(request.feeMinor) } }] };
        }
        const response = await send(`${options.apiBase}/v2/checkout/orders`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ intent: 'CAPTURE', purchase_units: [unit], application_context: { return_url: options.returnUrl(request.orderId), cancel_url: options.returnUrl(request.orderId), user_action: 'PAY_NOW' } }),
        });
        if (retry(response.status)) throw new Error(`PayPal is unavailable (${response.status})`);
        const body = parseJson(await response.text());
        if (!response.ok) return sessionFailed(request.attempt, String(body.message ?? `PayPal refused the order (${response.status})`));
        const links = Array.isArray(body.links) ? (body.links as Array<{ rel?: unknown; href?: unknown }>) : [];
        const approve = links.find((link) => link.rel === 'approve' || link.rel === 'payer-action')?.href;
        if (typeof body.id !== 'string' || typeof approve !== 'string') return sessionFailed(request.attempt, 'PayPal answered without an approval link');
        const opened: ProviderSessionOpened = { provider: 'paypal', attempt: request.attempt, sessionRef: body.id, redirectUrl: approve, simulated: false };
        return [{ type: payFacts.providerSessionOpened, payload: opened }];
      }

      const request = intention.payload as ProviderCaptureRequested;
      const order = `${options.apiBase}/v2/checkout/orders/${encodeURIComponent(request.sessionRef)}`;
      const response = await send(`${order}/capture`, { method: 'POST', headers, body: '{}' });
      if (retry(response.status)) throw new Error(`PayPal is unavailable (${response.status})`);
      const body = parseJson(await response.text());
      if (response.ok) return captureFact(request.sessionRef, firstCapture(body));
      const issues = Array.isArray(body.details) ? (body.details as Array<{ issue?: unknown }>).map((detail) => detail.issue) : [];
      if (issues.includes('ORDER_ALREADY_CAPTURED')) {
        // The money was captured by an earlier request whose answer never reached the river: read it back.
        const read = await send(order, { method: 'GET', headers: { authorization: headers.authorization } });
        if (!read.ok) throw new Error(`PayPal is unavailable (${read.status})`);
        return captureFact(request.sessionRef, firstCapture(parseJson(await read.text())));
      }
      return paymentFailed(request.sessionRef, String(issues[0] ?? body.message ?? `PayPal refused the capture (${response.status})`));
    },
    // A page that never opened moved nothing; of a capture nothing is known, so nothing is claimed.
    exhausted: (intention, reason) => (intention.type === payFacts.providerSessionRequested ? sessionFailed(Number(intention.payload.attempt ?? 0), reason) : null),
  };
}
