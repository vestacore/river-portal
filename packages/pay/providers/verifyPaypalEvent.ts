import { parseJson } from './parseJson.ts';
import type { FetchLike } from './types/FetchLike.ts';

/**
 * Asks PayPal whether a webhook is its own (`verify-webhook-signature`). PayPal signs with a
 * certificate, so the check is a call, not a local computation. Anything but SUCCESS is a no.
 */
export async function verifyPaypalEvent(
  options: { clientId: string; secret: string; apiBase: string; webhookId: string; fetch?: FetchLike },
  headers: Readonly<Record<string, string | undefined>>,
  event: unknown,
): Promise<boolean> {
  const send = options.fetch ?? (globalThis.fetch as unknown as FetchLike);
  const needed = ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time'] as const;
  if (options.webhookId === '' || needed.some((name) => !headers[name])) return false;
  // PayPal signs with a certificate served from its own domain; anything else is not asked about.
  if (!/^https:\/\/([a-z0-9-]+\.)*paypal\.com\//.test(headers['paypal-cert-url'] ?? '')) return false;
  const auth = await send(`${options.apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: { authorization: `Basic ${Buffer.from(`${options.clientId}:${options.secret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const accessToken = parseJson(await auth.text()).access_token;
  if (!auth.ok || typeof accessToken !== 'string') return false;
  const response = await send(`${options.apiBase}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: options.webhookId,
      webhook_event: event,
    }),
  });
  return response.ok && parseJson(await response.text()).verification_status === 'SUCCESS';
}
