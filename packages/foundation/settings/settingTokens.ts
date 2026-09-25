import type { Locale } from '@river/i18n';
import { definitions } from './data/definitions.ts';
import type { SettingsSnapshot } from './types/SettingsSnapshot.ts';

/**
 * Values that content may embed as {{key}}: every public setting that is a text, a localised text
 * or a number, in the given locale.
 */
export function settingTokens(snapshot: SettingsSnapshot, locale: Locale): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of definitions) {
    if (d.audience !== 'public') continue;
    const v = snapshot.values[d.key];
    if (typeof v === 'string' || typeof v === 'number') out[d.key] = String(v);
    else if (v && typeof v === 'object' && !Array.isArray(v)) out[d.key] = (v as Record<string, string>)[locale] ?? '';
  }
  return out;
}
