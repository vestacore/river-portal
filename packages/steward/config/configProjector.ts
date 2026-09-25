import type { Projector } from '@river/log';
import type { ProfileId, SettingValue } from '@river/settings';
import { configPaths } from './paths.ts';
import type { ConfigDoc } from './types/ConfigDoc.ts';

/** Keeps the organisation's settings document: the active profile and the custom overrides. */
export const configProjector: Projector = {
  name: 'config',
  handles: ['settings.ProfileApplied', 'settings.ValuesChanged', 'settings.ValueReset'],
  async project(event, tx) {
    const path = configPaths.settings(event.orgId);
    const doc = (await tx.get<ConfigDoc>(path)) ?? { profileId: 'small-nationwide', overrides: {}, updatedAt: event.occurredAt, updatedBy: '' };
    const p = event.payload as Record<string, unknown>;
    if (event.type === 'settings.ProfileApplied') {
      doc.profileId = p.profileId as ProfileId;
      if (p.keepOverrides !== true) doc.overrides = {};
    } else if (event.type === 'settings.ValuesChanged') {
      doc.overrides = { ...doc.overrides, ...(p.values as Record<string, SettingValue>) };
    } else {
      const { [p.key as string]: _removed, ...rest } = doc.overrides;
      doc.overrides = rest;
    }
    doc.updatedAt = event.occurredAt;
    doc.updatedBy = event.actor.label ?? event.actor.role;
    tx.set(path, doc);
  },
};
