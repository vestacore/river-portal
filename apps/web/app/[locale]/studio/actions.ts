'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { publishFeedItem, rejectFeedItem, suggestFeedItems, withdrawFeedItem } from '@river/feed';
import { approveCost, dispatchFlow, matchNeed, recordDelivery, validateDispatchInput } from '@river/flows';
import { markGiftReceived } from '@river/gifts';
import { localeFromSegment } from '@river/i18n';
import { triageNeed } from '@river/needs';
import { draftReportFromFlow, publishReport, reviseReport, withdrawReport } from '@river/reports';
import { commandEnv, getRuntime, staffActor } from '@river/runtime';
import { formToRecord } from '@/lib/formToRecord';
import { requireStaff } from '@/lib/requireStaff';

async function env() {
  const staff = await requireStaff();
  const runtime = await getRuntime();
  return { runtime, env: commandEnv(runtime, staffActor(staff.email, staff.role)) };
}
const done = () => revalidatePath('/', 'layout');

export async function triageAction(form: FormData) {
  const { env: e } = await env();
  await triageNeed(e, { needId: String(form.get('needId')) });
  done();
}

export async function matchAction(form: FormData) {
  const { env: e } = await env();
  const giftIds = form.getAll('giftIds').map(String).filter(Boolean);
  if (giftIds.length === 0) return;
  const campaignId = String(form.get('campaignId') ?? '') || null;
  await matchNeed(e, { needId: String(form.get('needId')), giftIds, campaignId });
  done();
}

export async function dispatchAction(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const { env: e } = await env();
  const input = validateDispatchInput(formToRecord(form));
  if (!input.ok) return { error: input.errors.map((x) => x.field).join(', ') };
  await dispatchFlow(e, input.value);
  done();
  return {};
}

export async function approveCostAction(form: FormData) {
  const { env: e } = await env();
  await approveCost(e, { flowId: String(form.get('flowId')), costId: String(form.get('costId')) });
  done();
}

export async function recordDeliveryAction(form: FormData) {
  const { env: e } = await env();
  await recordDelivery(e, { flowId: String(form.get('flowId')) });
  done();
}

export async function draftReportAction(form: FormData) {
  const { env: e } = await env();
  const reportId = await draftReportFromFlow(e, { flowId: String(form.get('flowId')) });
  done();
  redirect(`/${String(form.get('localeSegment'))}/studio/reports/${reportId}`);
}

export async function reviseReportAction(reportId: string, localeSegment: string, title: string, doc: unknown): Promise<{ ok: boolean }> {
  const { env: e } = await env();
  const locale = localeFromSegment(localeSegment);
  if (!locale) return { ok: false };
  try {
    await reviseReport(e, { reportId, locale, title, doc });
    done();
    return { ok: true };
  } catch (error) {
    console.error('reviseReportAction', error);
    return { ok: false };
  }
}

export async function publishReportAction(_prev: { outcome?: string; days?: number }, form: FormData): Promise<{ outcome?: string; days?: number }> {
  const { env: e } = await env();
  const outcome = await publishReport(e, { reportId: String(form.get('reportId')), acknowledgeSafetyDelay: form.get('acknowledge') === 'on' });
  done();
  return outcome.ok ? { outcome: 'published' } : { outcome: outcome.reason, ...(outcome.daysSinceDelivery !== undefined ? { days: outcome.daysSinceDelivery } : {}) };
}

export async function withdrawReportAction(form: FormData) {
  const { env: e } = await env();
  await withdrawReport(e, { reportId: String(form.get('reportId')), reason: 'editor' });
  done();
}

export async function suggestFeedAction(form: FormData) {
  const { runtime, env: e } = await env();
  await suggestFeedItems(e, { reportId: String(form.get('reportId')) }, runtime.assistant);
  done();
  redirect(`/${String(form.get('localeSegment'))}/studio/feed`);
}

export async function publishFeedItemAction(form: FormData) {
  const { env: e } = await env();
  await publishFeedItem(e, { itemId: String(form.get('itemId')), text: { 'en-GB': String(form.get('textEn') ?? ''), uk: String(form.get('textUk') ?? '') } });
  done();
}

export async function rejectFeedItemAction(form: FormData) {
  const { env: e } = await env();
  await rejectFeedItem(e, { itemId: String(form.get('itemId')) });
  done();
}

export async function withdrawFeedItemAction(form: FormData) {
  const { env: e } = await env();
  await withdrawFeedItem(e, { itemId: String(form.get('itemId')) });
  done();
}

export async function markGiftReceivedAction(form: FormData) {
  const { env: e } = await env();
  await markGiftReceived(e, { giftId: String(form.get('giftId')) });
  done();
}
