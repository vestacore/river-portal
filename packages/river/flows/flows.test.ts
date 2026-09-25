import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSettings } from '@river/settings';
import { createMemoryStore } from '@river/store';
import { needProjector, readNeed, readRecipientView, submitNeed, triageNeed, validateNeedInput } from '@river/needs';
import { campaignProjector, giftProjector, launchCampaign, markGiftReceived, pledgeGift, readGifts } from '@river/gifts';
import { matchNeed } from './matchNeed.ts';
import { dispatchFlow } from './dispatchFlow.ts';
import { recordDelivery } from './recordDelivery.ts';
import { approveCost } from './approveCost.ts';
import { confirmDelivery } from './confirmDelivery.ts';
import { readFlow } from './readFlow.ts';
import { flowProjector } from './flowProjector.ts';

test('the full thread: need → gift → flow → dispatch → delivery → confirmation with thanks', async () => {
  const store = createMemoryStore();
  const projectors = [needProjector, giftProjector, campaignProjector, flowProjector];
  const settings = resolveSettings('small-nationwide');
  const staff = { store, projectors, settings, ctx: { orgId: 'o', actor: { personId: null, role: 'coordinator' as const, via: 'studio' as const, label: 'andriy@example.org' } } };
  const web = { store, projectors, settings, ctx: { orgId: 'o', actor: { personId: null, role: 'anonymous' as const, via: 'web' as const } } };

  const campaignId = await launchCampaign(staff, { title: { 'en-GB': 'Fuel for the run', uk: 'Пальне для рейсу' }, summary: { 'en-GB': '', uk: '' }, goalMinor: 240000, currency: 'GBP' });
  const giftId = await pledgeGift(web, { kind: 'money', amountMinor: 50000, description: '', campaignId, name: 'James Hart', email: 'james@example.org', giverDisplay: 'first_name' });
  await markGiftReceived(staff, { giftId });
  const input = validateNeedInput({ categoryId: 'energy', form: 'goods', description: 'Генератор для родини', oblastId: 'kharkiv', settlement: 'Балаклія', forWhom: 'family', householdSize: '3', urgency: 'this_week', name: 'Олена', contactChannel: 'phone', contactValue: '+380671234567', consentToContact: 'on', locale: 'uk' });
  assert.ok(input.ok);
  const { needId, trackingToken } = await submitNeed(web, input.value);
  await triageNeed(staff, { needId });

  const flowId = await matchNeed(staff, { needId, giftIds: [giftId], campaignId });
  await dispatchFlow(staff, { flowId, carrierKind: 'volunteer', carrierName: 'Mykola', fromLabel: 'Lviv hub', costs: [
    { kind: 'fuel', amountMinor: 1_200_000, currency: 'UAH', note: 'diesel' },
    { kind: 'ferry', amountMinor: 30_000, currency: 'GBP', note: '' },
  ] });
  let flow = await readFlow(store, 'o', flowId);
  assert.equal(flow?.status, 'in_motion');
  assert.deepEqual(flow?.costs.map((c) => c.status), ['approved', 'submitted'], 'GBP 300 waits for the Finance Steward');
  assert.deepEqual(flow?.costs.map((c) => [c.reportingCurrency, c.reportingMinor]), [['GBP', 22_800], ['GBP', 30_000]], 'UAH converted at the settings rate');
  const ferry = flow?.costs[1]?.id as string;
  await assert.rejects(approveCost(staff, { flowId, costId: ferry }), /Finance Steward/, 'a coordinator cannot approve above the limit');
  const steward = { ...staff, ctx: { ...staff.ctx, actor: { personId: 'person_helen', role: 'finance_steward' as const, via: 'studio' as const } } };
  await approveCost(steward, { flowId, costId: ferry });
  assert.equal((await readFlow(store, 'o', flowId))?.costs[1]?.status, 'approved');

  await recordDelivery(staff, { flowId });
  assert.equal((await readRecipientView(store, 'o', trackingToken))?.canConfirm, true);
  await confirmDelivery(web, { needId, by: 'recipient', note: '', thanks: 'Дякуємо! Олена з Балаклії', shareWithParticipants: true, showOnWall: true, locale: 'uk' });

  flow = await readFlow(store, 'o', flowId);
  assert.equal(flow?.status, 'confirmed');
  assert.equal((await readNeed(store, 'o', needId))?.record.status, 'confirmed');
  const events = await store.query<{ type: string; payload: { publicText?: string } }>('orgs/o/events');
  const thanks = events.find((e) => e.type === 'gratitudeNote.Written');
  assert.equal(thanks?.payload.publicText, 'Дякуємо! […] з […]');
  assert.equal(events.filter((e) => e.type === 'consent.Granted').length, 2);
  assert.equal((await readGifts(store, 'o')).find((g) => g.id === giftId)?.status, 'acknowledged', 'shared thanks reaches the gift');
});
