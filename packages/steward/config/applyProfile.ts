import { commit, type CommandEnv } from '@river/log';
import { findProfile, type ProfileId } from '@river/settings';

/** An administrator chooses the organisation's profile; custom values are kept unless asked otherwise. */
export async function applyProfile(env: CommandEnv, input: { profileId: ProfileId; keepOverrides: boolean }): Promise<void> {
  const profile = findProfile(input.profileId);
  await commit(env, [
    { type: 'settings.ProfileApplied', aggregate: { kind: 'settings', id: env.ctx.orgId }, visibility: 'team', payload: { profileId: profile.id, keepOverrides: input.keepOverrides } },
  ]);
}
