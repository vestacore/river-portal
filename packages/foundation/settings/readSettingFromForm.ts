import { locales, type LocalisedText } from '@river/i18n';
import type { SettingDefinition } from './types/SettingDefinition.ts';
import type { EntryValue } from './types/SettingValue.ts';

type Form = { get: (name: string) => string | undefined; getAll: (name: string) => string[] };

/**
 * Reads one setting from a studio form. Field names: `v:<key>`, `v:<key>:<locale>`,
 * `v:<key>[<row>]:<field>[:<locale>]`, and for ordered choices `o:<key>:<value>` (position) with
 * `e:<key>:<value>` (enabled). Returns the raw value for validation, or undefined when absent.
 */
export function readSettingFromForm(d: SettingDefinition, form: Form): unknown {
  const name = `v:${d.key}`;
  switch (d.kind) {
    case 'localisedText':
      return Object.fromEntries(locales.map((l) => [l, form.get(`${name}:${l}`) ?? '']));
    case 'boolean':
      return form.get(name) === 'on';
    case 'number':
      return form.get(name) === undefined ? undefined : Number(form.get(name));
    case 'money': {
      const major = form.get(name);
      return major === undefined ? undefined : Math.round(Number(major.replace(',', '.')) * 100);
    }
    case 'multiChoice':
      return form.getAll(name);
    case 'orderedChoices': {
      const rows = (d.choices ?? []).map((c) => ({ value: c.value, on: form.get(`e:${d.key}:${c.value}`) === 'on', pos: Number(form.get(`o:${d.key}:${c.value}`) ?? 99) }));
      return rows.filter((r) => r.on).sort((a, b) => a.pos - b.pos).map((r) => r.value);
    }
    case 'numbers':
      return (form.get(name) ?? '').split(/[,;\s]+/).filter(Boolean).map(Number);
    case 'entries': {
      const rows: EntryValue[] = [];
      for (let i = 0; i < 20; i++) {
        if (form.get(`${name}[${i}]:present`) !== 'on' || form.get(`${name}[${i}]:remove`) === 'on') continue;
        const row: EntryValue = {};
        for (const field of d.fields ?? []) {
          row[field.key] = field.kind === 'localisedText'
            ? (Object.fromEntries(locales.map((l) => [l, (form.get(`${name}[${i}]:${field.key}:${l}`) ?? '').trim()])) as LocalisedText)
            : (form.get(`${name}[${i}]:${field.key}`) ?? '').trim();
        }
        const empty = Object.values(row).every((v) => (typeof v === 'string' ? v === '' : Object.values(v).every((s) => s === '')));
        if (!empty) rows.push(row);
      }
      return rows;
    }
    default:
      return form.get(name);
  }
}
