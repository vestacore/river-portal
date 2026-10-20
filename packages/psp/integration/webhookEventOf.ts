import { factDefinition, type PspFact } from '@river/psp-facts';
import type { WebhookEvent } from './types/Integration.ts';

/**
 * A fact as an integrator receives it, or null for a fact that is not released (only facts the
 * catalogue marks as webhooks leave the river). The event id names the fact in its stream: delivering
 * it twice delivers the same event, and an integrator can deduplicate on it.
 */
export function webhookEventOf(fact: PspFact): WebhookEvent | null {
  if (!factDefinition(fact.type).webhook) return null;
  return { id: `evt_${fact.stream}_${fact.seq}`, type: fact.type, created: fact.at, stream: fact.stream, data: fact.payload };
}
