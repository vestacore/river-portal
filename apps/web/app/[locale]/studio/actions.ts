'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { applyProfile, changeSettings, resetSetting } from '@river/config';
import { editContentBlock } from '@river/content';
import { publishFeedItem, rejectFeedItem, suggestFeedItems, withdrawFeedItem } from '@river/feed';
import { approveCost, approvalLimitMinor, confirmDelivery, dispatchFlow, matchNeed, readFlow, recordDelivery, validateDispatchInput } from '@river/flows';
import { markGiftReceived } from '@river/gifts';
import { hasRole } from '@river/identity';
import { localeFromSegment, locales } from '@river/i18n';
import { readNeed, triageNeed } from '@river/needs';
import { draftReportFromFlow, publishReport, reviseReport, withdrawReport } from '@river/reports';
import { findProfile, findSettingDefinition, listSettingDefinitions, readSettingFromForm, type SettingGroup } from '@river/settings';
import { actingAs } from '@/lib/actingAs';
import { costCurrencies } from '@/lib/costCurrencies';
import { formToRecord } from '@/lib/formToRecord';

// Every action checks the acting person's roles again (defence in depth; pages hide what they cannot do).
const done = () => revalidatePath('/', 'layout');
const segmentOf = (form: FormData) => (String(form.get('localeSegment') ?? '') === 'uk' ? 'uk' : 'en-gb');

// Inflow

export async function triageAction(form: FormData) {
  const { env } = await actingAs('studio', 'coordinator', 'safeguarding_lead', 'administrator');
  await triageNeed(env, { needId: String(form.get('needId')) });
  done();
}

export async function markGiftReceivedAction(form: FormData) {
  const { env } = await actingAs('studio', 'coordinator', 'finance_steward', 'administrator');
  await markGiftReceived(env, { giftId: String(form.get('giftId')) });
  done();
}

// Channels

export async function matchAction(form: FormData) {
  const { env } = await actingAs('studio', 'coordinator', 'administrator');
  const giftIds = form.getAll('giftIds').map(String).filter(Boolean);
  if (giftIds.length === 0) return;
  const campaignId = String(form.get('campaignId') ?? '') || null;
  await matchNeed(env, { needId: String(form.get('needId')), giftIds, campaignId });
  done();
}

export async function dispatchAction(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const { env, settings } = await actingAs('studio', 'coordinator', 'administrator');
  const input = validateDispatchInput(formToRecord(form), costCurrencies(settings));
  if (!input.ok) return { error: input.errors.map((x) => x.field).join(', ') };
  await dispatchFlow(env, input.value);
  done();
  return {};
}

export async function recordDeliveryAction(form: FormData) {
  const { env } = await actingAs('studio', 'coordinator', 'administrator');
  await recordDelivery(env, { flowId: String(form.get('flowId')) });
  done();
}

// Tolls (DP-06: a coordinator within the limit, the Finance Steward above it)

export async function approveCostAction(form: FormData) {
  const { identity, runtime, settings, env } = await actingAs('studio', 'finance_steward', 'administrator', 'coordinator');
  const flow = await readFlow(runtime.store, runtime.config.orgId, String(form.get('flowId')));
  const cost = flow?.costs.find((c) => c.id === String(form.get('costId')));
  if (!flow || !cost) return;
  if (!hasRole(identity, 'finance_steward', 'administrator') && cost.reportingMinor > approvalLimitMinor(settings)) throw new Error('Forbidden');
  await approveCost(env, { flowId: flow.id, costId: cost.id });
  done();
}

// Mouth (DP-08: a coordinator records a confirmation for someone without a smartphone)

export async function confirmByProxyAction(form: FormData) {
  const { runtime, env } = await actingAs('studio', 'coordinator', 'safeguarding_lead', 'administrator');
  const need = await readNeed(runtime.store, runtime.config.orgId, String(form.get('needId')));
  const note = String(form.get('note') ?? '').trim().slice(0, 500);
  if (!need || note.length < 3 || (need.record.status !== 'delivered' && need.record.status !== 'in_delivery')) return;
  await confirmDelivery(env, { needId: need.record.id, by: 'proxy', note, thanks: '', shareWithParticipants: false, showOnWall: false, locale: need.record.locale });
  done();
}

// Surface

export async function draftReportAction(form: FormData) {
  const { env } = await actingAs('studio', 'coordinator', 'editor', 'administrator');
  const reportId = await draftReportFromFlow(env, { flowId: String(form.get('flowId')) });
  done();
  redirect(`/${segmentOf(form)}/studio/surface/reports/${reportId}`);
}

export async function reviseReportAction(reportId: string, localeSegment: string, title: string, doc: unknown): Promise<{ ok: boolean }> {
  const { env } = await actingAs('studio', 'editor', 'administrator');
  const locale = localeFromSegment(localeSegment);
  if (!locale) return { ok: false };
  try {
    await reviseReport(env, { reportId, locale, title, doc });
    done();
    return { ok: true };
  } catch (error) {
    console.error('reviseReportAction', error);
    return { ok: false };
  }
}

export async function publishReportAction(_prev: { outcome?: string; days?: number }, form: FormData): Promise<{ outcome?: string; days?: number }> {
  const { env } = await actingAs('studio', 'editor', 'administrator');
  const outcome = await publishReport(env, { reportId: String(form.get('reportId')), acknowledgeSafetyDelay: form.get('acknowledge') === 'on' });
  done();
  return outcome.ok ? { outcome: 'published' } : { outcome: outcome.reason, ...(outcome.daysSinceDelivery !== undefined ? { days: outcome.daysSinceDelivery } : {}) };
}

export async function withdrawReportAction(form: FormData) {
  const { env } = await actingAs('studio', 'editor', 'administrator');
  await withdrawReport(env, { reportId: String(form.get('reportId')), reason: 'editor' });
  done();
}

export async function suggestFeedAction(form: FormData) {
  const { runtime, env } = await actingAs('studio', 'editor', 'administrator');
  await suggestFeedItems(env, { reportId: String(form.get('reportId')) }, runtime.assistant);
  done();
  redirect(`/${segmentOf(form)}/studio/surface/feed`);
}

export async function publishFeedItemAction(form: FormData) {
  const { env } = await actingAs('studio', 'editor', 'administrator');
  await publishFeedItem(env, { itemId: String(form.get('itemId')), text: { 'en-GB': String(form.get('textEn') ?? ''), uk: String(form.get('textUk') ?? '') } });
  done();
}

export async function rejectFeedItemAction(form: FormData) {
  const { env } = await actingAs('studio', 'editor', 'administrator');
  await rejectFeedItem(env, { itemId: String(form.get('itemId')) });
  done();
}

export async function withdrawFeedItemAction(form: FormData) {
  const { env } = await actingAs('studio', 'editor', 'administrator');
  await withdrawFeedItem(env, { itemId: String(form.get('itemId')) });
  done();
}

/** A site text, edited in the studio (adr/records/ADR-0022); HTML is rendered on the server. */
export async function editBlockAction(blockId: string, localeSegment: string, doc: unknown): Promise<{ ok: boolean }> {
  const { env } = await actingAs('studio', 'editor', 'administrator');
  const locale = localeFromSegment(localeSegment);
  if (!locale || !(locales as readonly string[]).includes(locale)) return { ok: false };
  try {
    await editContentBlock(env, { blockId, locale, doc });
    done();
    return { ok: true };
  } catch (error) {
    console.error('editBlockAction', error);
    return { ok: false };
  }
}

// Settings (adr/records/ADR-0020)

export type SettingsFormState = { saved: boolean; errors: Record<string, string> };

/** Saves one group of settings; each value is validated against the registry, floors included. */
export async function saveSettingsAction(group: SettingGroup, _prev: SettingsFormState, form: FormData): Promise<SettingsFormState> {
  const { identity, env } = await actingAs('studio', 'administrator', 'editor');
  const read = { get: (name: string) => { const v = form.get(name); return v === null ? undefined : String(v); }, getAll: (name: string) => form.getAll(name).map(String) };
  const values: Record<string, unknown> = {};
  for (const definition of listSettingDefinitions(group)) {
    if (!hasRole(identity, ...definition.editableBy)) continue;
    if (form.get(`present:${definition.key}`) !== '1') continue;
    values[definition.key] = readSettingFromForm(definition, read);
  }
  const result = await changeSettings(env, { values });
  if (!result.ok) return { saved: false, errors: Object.fromEntries(result.errors.map((e) => [e.field, e.code])) };
  done();
  redirect(`/${segmentOf(form)}/studio/settings?group=${group}&saved=1`);
}

export async function resetSettingAction(key: string, form: FormData) {
  const { identity, env } = await actingAs('studio', 'administrator', 'editor');
  const definition = findSettingDefinition(key);
  if (!definition || !hasRole(identity, ...definition.editableBy)) return;
  await resetSetting(env, { key: definition.key });
  done();
  redirect(`/${segmentOf(form)}/studio/settings?group=${definition.group}&saved=1`);
}

export async function applyProfileAction(form: FormData) {
  const { env } = await actingAs('studio', 'administrator');
  await applyProfile(env, { profileId: findProfile(String(form.get('profileId'))).id, keepOverrides: form.get('keepOverrides') === 'on' });
  done();
  redirect(`/${segmentOf(form)}/studio/settings?saved=1`);
}
