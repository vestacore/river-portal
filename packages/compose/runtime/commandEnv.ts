import type { Actor, CommandEnv } from '@river/log';
import type { SettingsSnapshot } from '@river/settings';
import type { Runtime } from './types/Runtime.ts';

/** A command environment for one action by `actor`, with the settings in force. */
export function commandEnv(runtime: Runtime, actor: Actor, settings: SettingsSnapshot, at?: string): CommandEnv {
  return { store: runtime.store, projectors: runtime.projectors, settings, ctx: { orgId: runtime.config.orgId, actor, ...(at ? { at } : {}) } };
}
