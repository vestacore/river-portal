import type { Identity, Role } from '@river/identity';
import type { CommandEnv } from '@river/log';
import { commandEnv, getRuntime, identityActor, type Runtime } from '@river/runtime';
import type { SettingsSnapshot } from '@river/settings';
import { loadSettings } from './loadSettings';
import { requireRole } from './requireRole';

/**
 * For a studio or "My river" action: the acting identity must hold one of `roles`, and the command
 * runs in the first of those roles they hold (their capacity), which is what the audit trail records.
 */
export async function actingAs(surface: 'web' | 'studio', ...roles: Role[]): Promise<{ identity: Identity; runtime: Runtime; settings: SettingsSnapshot; env: CommandEnv }> {
  const identity = await requireRole(...roles);
  const [runtime, settings] = await Promise.all([getRuntime(), loadSettings()]);
  const capacity = roles.find((r) => identity.roles.includes(r));
  return { identity, runtime, settings, env: commandEnv(runtime, identityActor(identity, surface, capacity), settings) };
}
