import type { FactType } from '@river/psp-facts';
import type { WebhookEndpoint } from './types/Integration.ts';

/** Whether an enabled endpoint wants an event type. */
export function subscribes(endpoint: WebhookEndpoint, type: FactType): boolean {
  return endpoint.status === 'enabled' && (endpoint.events.includes('*') || endpoint.events.includes(type));
}
