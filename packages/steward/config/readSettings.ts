import { resolveSettings, type SettingsSnapshot } from '@river/settings';
import type { DocStore } from '@river/store';
import { configPaths } from './paths.ts';
import type { ConfigDoc } from './types/ConfigDoc.ts';

/** The organisation's resolved settings; without a stored document, the given default profile applies. */
export async function readSettings(store: DocStore, orgId: string, defaultProfile: string): Promise<SettingsSnapshot> {
  const doc = await store.get<ConfigDoc>(configPaths.settings(orgId));
  return resolveSettings(doc?.profileId ?? defaultProfile, doc?.overrides ?? {});
}
