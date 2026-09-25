import { profiles } from './data/profiles.ts';
import type { Profile } from './types/Profile.ts';
import { profileIds } from './types/ProfileId.ts';

/** All profiles, in a stable order. */
export function listProfiles(): Profile[] {
  return profileIds.map((id) => profiles[id]);
}
