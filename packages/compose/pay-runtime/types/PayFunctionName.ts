/**
 * The functions the river is cut into (ADR-0025). Each is one door or one bank:
 * `ingest` admits gestures; the two webhooks admit what a provider reports; `discharge` carries one
 * intention across; `tick` lets time enter as a fact.
 */
export const payFunctionNames = ['ingest', 'webhook-stripe', 'webhook-paypal', 'discharge', 'tick'] as const;
export type PayFunctionName = (typeof payFunctionNames)[number];
