import { readSettings } from '@river/config';
import type { SettingsSnapshot } from '@river/settings';
import type { Runtime } from './types/Runtime.ts';

/** The organisation's settings in force now (one document read). */
export function loadSettings(runtime: Runtime): Promise<SettingsSnapshot> {
  return readSettings(runtime.store, runtime.config.orgId, runtime.config.profile);
}
