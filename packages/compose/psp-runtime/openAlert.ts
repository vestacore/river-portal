import type { Currency } from '@river/psp-facts';
import type { AlertKind, AmlAlert, RiskReason } from '@river/psp-risk';
import type { World } from './types/World.ts';

/** Opens a monitoring alert and returns its id. */
export function openAlert(world: World, input: { kind: AlertKind; unitId: string; sessionId: string | null; paymentId: string | null; amountMinor: number; currency: Currency; score: number; reasons: RiskReason[]; at: string }): string {
  const n = (world.counters.alert ?? 0) + 1;
  world.counters.alert = n;
  const id = `al_${n.toString(36).toUpperCase().padStart(5, '0')}`;
  const alert: AmlAlert = { id, status: 'new', assignee: null, openedAt: input.at, updatedAt: input.at, notes: [], ...input };
  world.alerts.push(alert);
  return id;
}
