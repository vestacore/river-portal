import { simulatedOutcomes, type SimulatedOutcome } from '@river/pay-providers';
import type { DoorAct } from './types/DoorAct.ts';

const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max;
const record = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {});

/**
 * Reads a gesture that arrived as a message. Strict: unknown acts, missing fields and oversized
 * values give null, and the door refuses — nothing outside these four shapes reaches the river.
 */
export function parseDoorAct(raw: unknown): DoorAct | null {
  const a = record(raw);
  if (a.act === 'placeOrder' && text(a.merchantId, 40)) {
    const input: Record<string, string> = {};
    for (const field of ['title', 'amount', 'currency', 'payerRef']) {
      const value = record(a.input)[field];
      if (typeof value !== 'string' || value.length > 500) return null;
      input[field] = value;
    }
    return { act: 'placeOrder', merchantId: a.merchantId, input };
  }
  if (a.act === 'requestCheckout') {
    const by = record(a.by);
    if (text(by.payKey, 128)) return { act: 'requestCheckout', by: { payKey: by.payKey } };
    if (text(by.orderId, 64) && text(by.payerRef, 64)) return { act: 'requestCheckout', by: { orderId: by.orderId, payerRef: by.payerRef } };
    return null;
  }
  if (a.act === 'cancelOrder' && text(a.orderId, 64) && typeof a.reason === 'string' && a.reason.length <= 500) {
    const by = record(a.by);
    if ((by.role === 'merchant' || by.role === 'operator') && text(by.id, 120)) return { act: 'cancelOrder', orderId: a.orderId, by: { role: by.role, id: by.id }, reason: a.reason };
    return null;
  }
  if (a.act === 'simulateOutcome' && text(a.sessionRef, 200) && (simulatedOutcomes as readonly unknown[]).includes(a.outcome)) {
    const by = record(a.by);
    const authority = text(by.payKey, 128) ? { payKey: by.payKey } : text(by.payerRef, 64) ? { payerRef: by.payerRef } : null;
    return authority ? { act: 'simulateOutcome', sessionRef: a.sessionRef, outcome: a.outcome as SimulatedOutcome, by: authority } : null;
  }
  return null;
}
