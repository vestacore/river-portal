import { profiles } from './data/profiles.ts';
import type { Profile } from './types/Profile.ts';
import { profileIds, type ProfileId } from './types/ProfileId.ts';

/** The profile with this id; unknown ids fall back to the small nationwide profile. */
export function findProfile(id: string | undefined): Profile {
  return profiles[(profileIds as readonly string[]).includes(id ?? '') ? (id as ProfileId) : 'small-nationwide'];
}
