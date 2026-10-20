/**
 * The sections of the river one payment session runs through, from the source (an invoice put in front
 * of a payer) to the mouth (paid and distributed). Every instrument passes the same sections; only the
 * bridges inside a section differ (a 3-D Secure challenge, a bank's consent, a QR scan, a mandate).
 */
export const stages = ['source', 'choice', 'screening', 'routing', 'consent', 'secured', 'capture', 'distribution', 'mouth'] as const;
export type Stage = (typeof stages)[number];
