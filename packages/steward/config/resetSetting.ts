import { commit, type CommandEnv } from '@river/log';
import { findSettingDefinition } from '@river/settings';

/** Removes a custom value, so the profile's (or the registry's) value applies again. */
export async function resetSetting(env: CommandEnv, input: { key: string }): Promise<void> {
  if (!findSettingDefinition(input.key)) return;
  await commit(env, [{ type: 'settings.ValueReset', aggregate: { kind: 'settings', id: env.ctx.orgId }, visibility: 'team', payload: { key: input.key } }]);
}
