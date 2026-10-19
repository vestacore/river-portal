import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Checks a Stripe webhook's `Stripe-Signature` header: an HMAC-SHA256 of `<t>.<raw body>` with the
 * endpoint's secret, compared in constant time, and a timestamp no older than the tolerance.
 * The raw body must be the bytes Stripe sent — a parsed and re-serialised body will not verify.
 */
export function stripeSignatureValid(input: { payload: string; header: string; secret: string; nowSeconds: number; toleranceSeconds?: number }): boolean {
  const parts = input.header.split(',').map((part) => part.trim().split('='));
  const timestamp = parts.find(([name]) => name === 't')?.[1];
  const signatures = parts.filter(([name]) => name === 'v1').map(([, value]) => value ?? '');
  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0 || input.secret === '') return false;
  if (Math.abs(input.nowSeconds - Number(timestamp)) > (input.toleranceSeconds ?? 300)) return false;
  const expected = Buffer.from(createHmac('sha256', input.secret).update(`${timestamp}.${input.payload}`, 'utf8').digest('hex'), 'utf8');
  return signatures.some((signature) => {
    const given = Buffer.from(signature, 'utf8');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
