import { definitions } from './data/definitions.ts';
import type { SettingDefinition } from './types/SettingDefinition.ts';
import type { SettingGroup } from './types/SettingGroup.ts';

/** Registered settings, optionally of one group, in registry order. */
export function listSettingDefinitions(group?: SettingGroup): readonly SettingDefinition[] {
  return group ? definitions.filter((d) => d.group === group) : definitions;
}
