import type { Role } from '@river/identity';

/** Who performed an action and through which surface. `label` is a name or staff e-mail for audit (team). */
export type ActorRole = Role | 'system' | 'anonymous';

export type Actor = {
  personId: string | null;
  role: ActorRole;
  via: 'web' | 'studio' | 'api' | 'system' | 'vertex';
  label?: string;
};
