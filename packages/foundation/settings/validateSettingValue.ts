import { isOblast, locales, type LocalisedText } from '@river/i18n';
import type { FieldError, Result } from '@river/kernel';
import { contrastRatio } from './contrastRatio.ts';
import type { SettingDefinition } from './types/SettingDefinition.ts';
import type { EntryValue, SettingValue } from './types/SettingValue.ts';

const INK = '#1c2228';
const isLocalised = (v: unknown): v is LocalisedText =>
  !!v && typeof v === 'object' && !Array.isArray(v) && locales.every((l) => typeof (v as Record<string, unknown>)[l] === 'string');

/**
 * Checks a value against its definition: type, range, canonical floor, choices, formats and the
 * accent colour's contrast. Error codes are dictionary keys (`settings.errors.<code>`).
 */
export function validateSettingValue(d: SettingDefinition, value: unknown): Result<SettingValue> {
  const fail = (code: string): Result<SettingValue> => ({ ok: false, errors: [{ field: d.key, code } satisfies FieldError] });
  const choiceValues = d.choices?.map((c) => c.value);
  switch (d.kind) {
    case 'text': return typeof value === 'string' && value.length <= 500 ? { ok: true, value: value.trim() } : fail('text');
    case 'email': return typeof value === 'string' && (value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ? { ok: true, value: value.trim() } : fail('email');
    case 'phone': return typeof value === 'string' && (value === '' || /^[+0-9 ()-]{3,30}$/.test(value)) ? { ok: true, value: value.trim() } : fail('phone');
    case 'url': return typeof value === 'string' && (value === '' || /^https:\/\//.test(value)) ? { ok: true, value: value.trim() } : fail('url');
    case 'colour':
      if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) return fail('colour');
      return contrastRatio(value, INK) >= 4.5 ? { ok: true, value: value.toLowerCase() } : fail('contrast');
    case 'localisedText': return isLocalised(value) && Object.values(value).every((s) => s.length <= 4000) ? { ok: true, value } : fail('localisedText');
    case 'boolean': return typeof value === 'boolean' ? { ok: true, value } : fail('boolean');
    case 'number':
    case 'money': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return fail('number');
      if (d.floor !== undefined && value < d.floor) return fail('floor');
      if ((d.min !== undefined && value < d.min) || (d.max !== undefined && value > d.max)) return fail('range');
      return { ok: true, value: d.kind === 'money' ? Math.round(value) : value };
    }
    case 'choice': return typeof value === 'string' && (!choiceValues || choiceValues.includes(value)) ? { ok: true, value } : fail('choice');
    case 'multiChoice':
    case 'orderedChoices': {
      if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) return fail('choice');
      const ok = value.every((v: string) => (choiceValues ? choiceValues.includes(v) : d.choicesFrom === 'oblasts' ? isOblast(v) : /^[a-z-]{2,30}$/.test(v)));
      return ok ? { ok: true, value: [...new Set(value as string[])] } : fail('choice');
    }
    case 'numbers':
      return Array.isArray(value) && value.length <= 8 && value.every((v) => typeof v === 'number' && v > 0) ? { ok: true, value: value as number[] } : fail('numbers');
    case 'entries': {
      if (!Array.isArray(value) || value.length > 20) return fail('entries');
      const rows = value as EntryValue[];
      for (const row of rows) {
        for (const field of d.fields ?? []) {
          const v = row[field.key];
          if (field.kind === 'localisedText' ? !isLocalised(v) : typeof v !== 'string') return fail('entries');
          if (field.kind === 'number' && !Number.isFinite(Number(v))) return fail('entries');
          if (field.kind === 'url' && v !== '' && !/^https:\/\//.test(v as string)) return fail('url');
          if (field.kind === 'choice' && field.choices && !field.choices.some((c) => c.value === v)) return fail('choice');
        }
      }
      return { ok: true, value: rows };
    }
  }
}
