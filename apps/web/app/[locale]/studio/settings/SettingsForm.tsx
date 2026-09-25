'use client';

import { useActionState, useState } from 'react';
import type { SettingGroup } from '@river/settings';
import { Badge } from '@/components/ui/Badge';
import { inputClass } from '@/components/ui/Field';
import type { Dictionary } from '@/lib/dictionary/types';
import { resetSettingAction, saveSettingsAction, type SettingsFormState } from '../actions';
import type { FieldView } from './types';

type Labels = Dictionary['studio']['settingsPage'];
type Entry = Record<string, string | Record<string, string>>;

const locales = [['en-GB', 'EN'], ['uk', 'UK']] as const;
const small = `${inputClass} py-2`;

/** A group of settings, each edited with the control its kind calls for; validated on the server. */
export function SettingsForm({ group, localeSegment, fields, t }: { group: SettingGroup; localeSegment: string; fields: FieldView[]; t: Labels }) {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(saveSettingsAction.bind(null, group), { saved: false, errors: {} });
  const anyEditable = fields.some((f) => f.editable);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="localeSegment" value={localeSegment} />
      {Object.keys(state.errors).length > 0 ? <p role="alert" className="border-l-2 border-attention-500 bg-attention-100 px-4 py-3 text-attention-500">{t.errors.entries}</p> : null}
      {fields.map((f) => (
        <fieldset key={f.key} disabled={!f.editable} className="grid gap-3 border-t border-graphite/30 py-6 lg:grid-cols-[17rem_1fr]">
          <legend className="sr-only">{f.label}</legend>
          <div>
            <p className="font-semibold text-ink-900">{f.label}</p>
            {f.help ? <p className="mt-1 text-sm text-ink-500">{f.help}</p> : null}
            <p className="mt-2 flex flex-wrap items-center gap-3">
              <Badge tone={f.source === 'custom' ? 'sunrise' : f.source === 'profile' ? 'teal' : 'ink'}>{t.source[f.source]}</Badge>
              {!f.editable ? <span className="annot text-ink-500">{t.editableBy}: {f.editors}</span> : null}
              {f.editable && f.source === 'custom' ? <button type="submit" formAction={resetSettingAction.bind(null, f.key)} className="annot text-ink-500 underline underline-offset-4 hover:text-ink-900">{t.reset}</button> : null}
            </p>
          </div>
          <div>
            {f.editable ? <input type="hidden" name={`present:${f.key}`} value="1" /> : null}
            <Control field={f} t={t} />
            {state.errors[f.key] ? <p role="alert" className="mt-2 text-sm font-medium text-attention-500">{(t.errors as Record<string, string>)[state.errors[f.key] as string] ?? t.errors.entries}</p> : null}
          </div>
        </fieldset>
      ))}
      {anyEditable ? (
        <div className="sticky bottom-0 -mx-1 flex items-center gap-4 border-t border-graphite/40 bg-paper/95 px-1 py-4 backdrop-blur">
          <button type="submit" disabled={pending} className="chamfer px-6 py-3 font-semibold text-paper [--cut:8px] [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)] disabled:opacity-60">{t.save}</button>
        </div>
      ) : <p className="annot border-t border-graphite/30 pt-4 text-ink-500">{t.readOnlyNote}</p>}
    </form>
  );
}

function Control({ field: f, t }: { field: FieldView; t: Labels }) {
  const name = `v:${f.key}`;
  switch (f.kind) {
    case 'localisedText': {
      const value = (f.value ?? {}) as Record<string, string>;
      const long = Object.values(value).some((v) => v.length > 60);
      return (
        <div className="grid gap-2">
          {locales.map(([l, tag]) => (
            <label key={l} className="grid grid-cols-[2.5rem_1fr] items-start gap-2">
              <span className="annot pt-2.5 text-ink-500">{tag}</span>
              {long ? <textarea name={`${name}:${l}`} lang={l} rows={3} defaultValue={value[l] ?? ''} className={small} /> : <input name={`${name}:${l}`} lang={l} defaultValue={value[l] ?? ''} className={small} />}
            </label>
          ))}
        </div>
      );
    }
    case 'boolean':
      return <label className="inline-flex items-center gap-3"><input type="checkbox" name={name} defaultChecked={f.value === true} className="size-5 accent-ink-900" />{f.value ? t.yes : t.no}</label>;
    case 'number':
      return <input type="number" name={name} min={f.min} max={f.max} defaultValue={String(f.value)} className={`${small} max-w-[10rem]`} />;
    case 'money':
      return <label className="inline-flex items-center gap-2"><input name={name} inputMode="decimal" defaultValue={String(Number(f.value) / 100)} className={`${small} max-w-[12rem]`} /><span className="annot text-ink-500">{f.currency}</span></label>;
    case 'colour':
      return <input type="color" name={name} defaultValue={String(f.value)} className="h-11 w-24 cursor-pointer border border-graphite/30 bg-white p-1" />;
    case 'choice':
      return <select name={name} defaultValue={String(f.value)} className={`${small} max-w-xs`}>{(f.choices ?? []).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>;
    case 'multiChoice': {
      const chosen = new Set((f.value ?? []) as string[]);
      return (
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
          {(f.choices ?? []).map((c) => <label key={c.value} className="flex items-center gap-2 text-[0.95rem]"><input type="checkbox" name={name} value={c.value} defaultChecked={chosen.has(c.value)} className="size-4 accent-ink-900" />{c.label}</label>)}
        </div>
      );
    }
    case 'orderedChoices': {
      const order = (f.value ?? []) as string[];
      const rows = [...(f.choices ?? [])].sort((a, b) => (order.indexOf(a.value) + 1 || 99) - (order.indexOf(b.value) + 1 || 99));
      return (
        <ol className="grid gap-1.5">
          <li className="annot grid grid-cols-[4.5rem_3rem_1fr] gap-3 text-ink-500"><span>{t.order}</span><span>{t.show}</span><span /></li>
          {rows.map((c) => {
            const at = order.indexOf(c.value);
            return (
              <li key={c.value} className="grid grid-cols-[4.5rem_3rem_1fr] items-center gap-3">
                <input type="number" name={`o:${f.key}:${c.value}`} min={1} max={99} defaultValue={at >= 0 ? at + 1 : 99} aria-label={`${t.order}: ${c.label}`} className={`${small} px-2`} />
                <input type="checkbox" name={`e:${f.key}:${c.value}`} defaultChecked={at >= 0} aria-label={`${t.show}: ${c.label}`} className="size-4 justify-self-center accent-ink-900" />
                <span>{c.label}</span>
              </li>
            );
          })}
        </ol>
      );
    }
    case 'numbers':
      return <input name={name} defaultValue={((f.value ?? []) as number[]).join(', ')} className={`${small} max-w-md`} />;
    case 'entries':
      return <Entries field={f} t={t} />;
    default:
      return <input name={name} type={f.kind === 'email' ? 'email' : f.kind === 'url' ? 'url' : f.kind === 'phone' ? 'tel' : 'text'} defaultValue={String(f.value ?? '')} className={`${small} max-w-xl`} />;
  }
}

function Entries({ field: f, t }: { field: FieldView; t: Labels }) {
  const existing = (f.value ?? []) as Entry[];
  const [extra, setExtra] = useState(1);
  const rows: Array<Entry | null> = [...existing, ...Array.from({ length: extra }, () => null)];
  return (
    <div className="grid gap-3">
      {rows.map((row, i) => (
        <div key={i} className="grid gap-2 border border-graphite/20 bg-paper-deep/40 p-3">
          <input type="hidden" name={`v:${f.key}[${i}]:present`} value="on" />
          {(f.fields ?? []).map((field) => {
            const base = `v:${f.key}[${i}]:${field.key}`;
            const value = row?.[field.key];
            if (field.kind === 'localisedText') {
              const v = (value ?? {}) as Record<string, string>;
              return (
                <div key={field.key} className="grid gap-1.5 sm:grid-cols-[9rem_1fr] sm:items-start">
                  <span className="text-sm text-ink-500 sm:pt-2">{field.label}</span>
                  <div className="grid gap-1.5 sm:grid-cols-2">{locales.map(([l, tag]) => <input key={l} name={`${base}:${l}`} lang={l} placeholder={tag} aria-label={`${field.label} (${tag})`} defaultValue={v[l] ?? ''} className={small} />)}</div>
                </div>
              );
            }
            return (
              <label key={field.key} className="grid gap-1.5 sm:grid-cols-[9rem_1fr] sm:items-center">
                <span className="text-sm text-ink-500">{field.label}</span>
                {field.kind === 'choice'
                  ? <select name={base} defaultValue={String(value ?? '')} className={`${small} max-w-xs`}>{(field.choices ?? []).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
                  : <input name={base} defaultValue={String(value ?? '')} inputMode={field.kind === 'number' ? 'decimal' : undefined} className={small} />}
              </label>
            );
          })}
          {row ? <label className="annot flex items-center gap-2 justify-self-end text-ink-500"><input type="checkbox" name={`v:${f.key}[${i}]:remove`} className="size-4 accent-attention-500" />{t.removeRow}</label> : null}
        </div>
      ))}
      {rows.length < 20 ? <button type="button" onClick={() => setExtra((n) => n + 1)} className="annot justify-self-start border border-dashed border-graphite/50 px-3 py-2 text-ink-700 hover:border-graphite">+ {t.addRow}</button> : null}
    </div>
  );
}
