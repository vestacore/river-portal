import type { Role } from './Role.ts';

/**
 * Who is acting (adr/records/ADR-0021). `via` says how the identity was established: Identity-Aware
 * Proxy for staff in the cloud, a demo persona in local or sandbox runs, later Firebase for the public.
 */
export type Identity = {
  personId: string | null;
  name: string;
  roles: Role[];
  via: 'iap' | 'demo' | 'firebase';
  email?: string;
  personaId?: string;
};
