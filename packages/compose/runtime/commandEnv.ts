import type { Actor, CommandEnv } from '@river/log';
import type { Runtime } from './types/Runtime.ts';

/** A command environment for one action by `actor`. */
export function commandEnv(runtime: Runtime, actor: Actor, at?: string): CommandEnv {
  return { store: runtime.store, projectors: runtime.projectors, ctx: { orgId: runtime.config.orgId, actor, ...(at ? { at } : {}) } };
}
