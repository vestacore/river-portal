/** Who performed an action and through which surface. `label` is a staff e-mail for audit (team). */
export type ActorRole =
  | 'recipient' | 'giver' | 'coordinator' | 'editor' | 'administrator' | 'carrier' | 'system' | 'anonymous';

export type Actor = {
  personId: string | null;
  role: ActorRole;
  via: 'web' | 'studio' | 'api' | 'system' | 'vertex';
  label?: string;
};
