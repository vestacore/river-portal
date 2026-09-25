import type { Actor, ActorRole } from '@river/log';

/** A staff member acting in the studio; `label` is their IAP-verified e-mail (team visibility). */
export function staffActor(label: string, role: ActorRole = 'coordinator'): Actor {
  return { personId: null, role, via: 'studio', label };
}
