import type { Actor } from './Actor.ts';

/** Who acts, for which organisation; `at` back-dates events (demo seeds and imports only). */
export type CommandContext = {
  orgId: string;
  actor: Actor;
  at?: string;
  correlationId?: string;
};
