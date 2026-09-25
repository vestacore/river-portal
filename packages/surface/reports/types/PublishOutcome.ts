/** Result of trying to publish a report; `safety_delay` asks the editor to acknowledge an override. */
export type PublishOutcome = { ok: true } | { ok: false; reason: 'not_found' | 'safety_delay'; daysSinceDelivery?: number };
