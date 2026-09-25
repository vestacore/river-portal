import { definitions } from './data/definitions.ts';
import type { SettingDefinition } from './types/SettingDefinition.ts';

/** The registered definition of a setting key, or undefined. */
export function findSettingDefinition(key: string): SettingDefinition | undefined {
  return definitions.find((d) => d.key === key);
}
