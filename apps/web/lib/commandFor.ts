import type { Identity } from '@river/identity';
import type { CommandEnv } from '@river/log';
import { commandEnv, getRuntime, identityActor, publicActor, type Runtime } from '@river/runtime';
import type { SettingsSnapshot } from '@river/settings';
import { loadSettings } from './loadSettings';

/** The runtime, settings and a command environment for an action by `identity` (or an anonymous visitor). */
export async function commandFor(identity: Identity | null, surface: 'web' | 'studio', anonymousRole: 'recipient' | 'giver' | 'anonymous' = 'anonymous'): Promise<{ runtime: Runtime; settings: SettingsSnapshot; env: CommandEnv }> {
  const [runtime, settings] = await Promise.all([getRuntime(), loadSettings()]);
  const actor = identity ? identityActor(identity, surface) : publicActor(anonymousRole);
  return { runtime, settings, env: commandEnv(runtime, actor, settings) };
}
