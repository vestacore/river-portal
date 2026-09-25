import Link from 'next/link';
import { listOblasts, pickText, segmentForLocale, type LocalisedText } from '@river/i18n';
import { hasRole } from '@river/identity';
import { listCategories } from '@river/needs';
import { findProfile, listProfiles, listSettingDefinitions, settingGroups, settingText, type SettingGroup } from '@river/settings';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { requireStage } from '@/lib/requireStage';
import { resolveLocale } from '@/lib/resolveLocale';
import { applyProfileAction } from '../actions';
import { SettingsForm } from './SettingsForm';
import type { FieldView } from './types';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ group?: string; saved?: string }> };

// A short, stable fingerprint of the values shown, so the form starts afresh when they change.
const fingerprint = (text: string) => { let h = 5381; for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

/**
 * The bed of the river: every parameter of the portal from the settings registry (ADR-0020), grouped,
 * each with where its value comes from (default, profile or custom) and who may change it.
 */
export default async function SettingsPage({ params, searchParams }: Props) {
  const locale = resolveLocale((await params).locale);
  const { identity } = await requireStage('settings', locale);
  const dict = getDictionary(locale);
  const t = dict.studio.settingsPage;
  const settings = await loadSettings();
  const { group: requested, saved } = await searchParams;
  const group: SettingGroup = (settingGroups as readonly string[]).includes(requested ?? '') ? (requested as SettingGroup) : 'organisation';
  const profile = findProfile(settings.profileId);
  const pick = (text: LocalisedText | undefined) => pickText(text, locale);
  const referenceChoices = { oblasts: listOblasts(locale).map((o) => ({ value: o.id, label: o.label })), categories: listCategories().map((c) => ({ value: c.id, label: pick(c.label) })) };
  const fields: FieldView[] = listSettingDefinitions(group).map((d) => ({
    key: d.key, kind: d.kind, label: pick(d.label), help: d.help ? pick(d.help) : null,
    value: settings.values[d.key] ?? d.default, source: settings.sources[d.key] ?? 'default',
    editable: hasRole(identity, ...d.editableBy), editors: d.editableBy.map((r) => dict.roles[r]).join(', '),
    ...(d.min !== undefined ? { min: d.floor ?? d.min } : {}), ...(d.max !== undefined ? { max: d.max } : {}),
    ...(d.kind === 'money' ? { currency: settingText(settings, 'money.reportingCurrency') } : {}),
    ...(d.choicesFrom ? { choices: referenceChoices[d.choicesFrom] } : d.choices ? { choices: d.choices.map((c) => ({ value: c.value, label: pick(c.label) })) } : {}),
    ...(d.fields ? { fields: d.fields.map((x) => ({ key: x.key, label: pick(x.label), kind: x.kind, ...(x.choices ? { choices: x.choices.map((c) => ({ value: c.value, label: pick(c.label) })) } : {}) })) } : {}),
  }));
  const isAdmin = hasRole(identity, 'administrator');
  return (
    <div>
      <div className="mb-10 flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl"><h2 className="text-2xl font-semibold">{t.title}</h2><p className="mt-1 text-ink-500">{t.lead}</p></div>
        <form action={applyProfileAction} className="sketch grid w-full max-w-md gap-3 bg-paper p-5">
          <input type="hidden" name="localeSegment" value={segmentForLocale(locale)} />
          <p className="annot text-ink-500">{t.current}</p>
          <p className="text-lg font-semibold">{pick(profile.label)}</p>
          {isAdmin ? (
            <>
              <select name="profileId" defaultValue={profile.id} aria-label={t.profile} className="border-0 bg-white px-3 py-2 ring-1 ring-graphite/30">
                {listProfiles().map((p) => <option key={p.id} value={p.id}>{pick(p.label)}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="keepOverrides" className="size-4 accent-ink-900" />{t.keepCustom}</label>
              <button type="submit" className="annot justify-self-start border border-graphite/50 px-3 py-2 text-ink-900 hover:border-graphite">{t.apply}</button>
            </>
          ) : null}
        </form>
      </div>
      {saved ? <p role="status" className="mb-6 border-l-2 border-teal-500 bg-teal-100/60 px-4 py-3 font-medium text-ink-900">{t.saved}</p> : null}
      <div className="grid gap-10 lg:grid-cols-[13rem_1fr]">
        <nav aria-label={t.title} className="lg:sticky lg:top-28 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto lg:grid">
            {settingGroups.map((g) => (
              <li key={g}>
                <Link href={`${href(locale, '/studio/settings')}?group=${g}`} aria-current={g === group ? 'page' : undefined}
                  className={`block whitespace-nowrap px-3 py-2 text-sm font-semibold ${g === group ? 'bg-ink-900 text-paper' : 'text-ink-700 hover:bg-paper-deep'}`}>{t.groups[g]}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <SettingsForm key={fingerprint(JSON.stringify([group, fields.map((x) => [x.value, x.source])]))} group={group} localeSegment={segmentForLocale(locale)} fields={fields} t={t} />
      </div>
    </div>
  );
}
