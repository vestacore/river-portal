import type { LocalisedText } from '@river/i18n';
import type { AuditEntry } from '@river/psp-access';
import type { World } from './types/World.ts';

/** Writes one line of the cabinets' audit trail: who, in which profile, did what, to what. */
export function recordAudit(world: World, entry: { personId: string; role: AuditEntry['role']; unitId: string; action: string; target: string; detail: LocalisedText; at: string }): void {
  const n = (world.counters.audit ?? 0) + 1;
  world.counters.audit = n;
  world.audit.push({ id: `au_${n.toString(36).toUpperCase().padStart(5, '0')}`, ...entry });
}
