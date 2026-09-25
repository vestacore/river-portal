import { applyProfile } from '@river/config';
import { draftFeedItem, publishFeedItem, readFeedItem, suggestFeedItems } from '@river/feed';
import { approveCost, confirmDelivery, dispatchFlow, matchNeed, readFlow, recordDelivery } from '@river/flows';
import { launchCampaign, markGiftReceived, pledgeGift } from '@river/gifts';
import type { Actor } from '@river/log';
import { submitNeed, triageNeed, validateNeedInput } from '@river/needs';
import { draftReportFromFlow, publishReport } from '@river/reports';
import { resolveSettings, settingNumber, type ProfileId } from '@river/settings';
import { commandEnv } from './commandEnv.ts';
import { demoVariants } from './data/demoVariants.ts';
import { personas } from './data/personas.ts';
import { publicActor } from './publicActor.ts';
import type { PersonaId } from './types/PersonaId.ts';
import type { Runtime } from './types/Runtime.ts';

const daysAgo = (days: number, hour = 10) => {
  const d = new Date(Date.now() - days * 86_400_000);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

// Money gifts in the base schedule (pounds; multiplied by the variant's factor): [days ago, amount, campaign].
const schedule: Array<[number, number, 'fuel' | 'winter']> = [
  [58, 500, 'fuel'], [57, 1000, 'fuel'], [55, 25, 'fuel'], [54, 40, 'fuel'], [52, 100, 'fuel'], [50, 30, 'fuel'],
  [18, 200, 'winter'], [15, 75, 'winter'], [9, 450, 'winter'], [3, 50, 'winter'],
];

// The demo needs; a variant may move them (the city foundation serves one oblast).
const needs = [
  { days: 36, raw: { categoryId: 'energy', form: 'goods', description: 'Нам потрібен генератор: онук робить уроки при свічці, а холодильник з ліками вимикається. Нас троє.', oblastId: 'kharkiv', settlement: 'Балаклія', forWhom: 'family', householdSize: '3', urgency: 'this_week', name: 'Олена', locale: 'uk', consentToStory: 'on' } },
  { days: 12, raw: { categoryId: 'food', form: 'goods', description: 'Six older neighbours on our street have not had a food delivery for a month. We can collect from the village shop.', oblastId: 'sumy', settlement: 'Krasnopillia', forWhom: 'neighbours', householdSize: '6', urgency: 'this_week', name: 'Vasyl', locale: 'en-GB' } },
  { days: 8, raw: { categoryId: 'education', form: 'goods', description: 'Школа з укриттям: потрібні павербанки й настільні лампи, щоб діти могли вчитися під час відключень.', oblastId: 'dnipropetrovsk', settlement: 'Нікополь', forWhom: 'institution', householdSize: '120', urgency: 'this_month', name: 'Наталія Петрівна, директорка', locale: 'uk' } },
  { days: 4, raw: { categoryId: 'hygiene', form: 'goods', description: 'Гігієнічні набори для родини з маленькою дитиною: підгузки (розмір 4), мило, серветки.', oblastId: 'kherson', settlement: 'Херсон', forWhom: 'family', householdSize: '4', urgency: 'this_week', name: 'Катерина', locale: 'uk' } },
  { days: 1, raw: { categoryId: 'medicine', form: 'money', description: 'I am 78 and need help paying for my heart medication this month.', oblastId: 'zaporizhzhia', settlement: 'Zaporizhzhia', forWhom: 'self', householdSize: '1', urgency: 'today', name: 'Ivan', locale: 'en-GB' } },
  // Olena's second request, so that the walk can follow a delivery from the carrier to her thanks.
  { days: 9, raw: { categoryId: 'clothing', form: 'goods', description: 'Теплі ковдри для кімнати онука: взимку в будинку дуже холодно.', oblastId: 'kharkiv', settlement: 'Балаклія', forWhom: 'family', householdSize: '3', urgency: 'this_month', name: 'Олена', locale: 'uk' } },
];

/**
 * Seeds fictional, bilingual demo data for a profile (spec: 10-demo-content) through the same
 * commands the UI uses, each performed by the persona whose role it is. Runs once per store.
 */
export async function seedDemo(runtime: Runtime, profileId: ProfileId = runtime.config.profile): Promise<void> {
  const orgId = runtime.config.orgId;
  try {
    await runtime.store.transact(async (tx) => tx.create(`orgs/${orgId}/meta/seed`, { at: new Date().toISOString(), kind: 'demo', profileId }));
  } catch {
    return; // already seeded
  }
  const v = demoVariants[profileId];
  const settings = resolveSettings(profileId, {});
  const person = (id: PersonaId) => personas.find((p) => p.id === id) as (typeof personas)[number];
  const as = (id: PersonaId): Actor => {
    const p = person(id);
    return { personId: p.personId, role: p.roles[0] ?? 'anonymous', via: p.roles.some((r) => ['coordinator', 'finance_steward', 'editor', 'administrator'].includes(r)) ? 'studio' : 'web', label: v.personaNames[id]['en-GB'] };
  };
  const env = (actor: Actor, at: string) => commandEnv(runtime, actor, settings, at);
  const system: Actor = { personId: null, role: 'system', via: 'system' };
  const money = (major: number) => Math.round(major * v.amountFactor) * 100;

  await applyProfile(env(system, daysAgo(61)), { profileId, keepOverrides: false });

  const campaignIds = {
    fuel: await launchCampaign(env(as('andriy'), daysAgo(60)), { slug: v.campaigns.fuel.slug, title: v.campaigns.fuel.title, summary: v.campaigns.fuel.summary, goalMinor: v.campaigns.fuel.goalMajor * 100, currency: v.currency }),
    winter: await launchCampaign(env(as('andriy'), daysAgo(20)), { slug: v.campaigns.winter.slug, title: v.campaigns.winter.title, summary: v.campaigns.winter.summary, goalMinor: v.campaigns.winter.goalMajor * 100, currency: v.currency }),
  };

  const moneyGifts: string[] = [];
  for (const [i, [days, major, campaign]] of schedule.entries()) {
    const giver = v.givers[i] ?? { name: `Giver ${i + 1}`, email: `giver${i + 1}@example.org` };
    const giverId = i === 0 ? person('james').personId : i === 1 ? person('harbour').personId : null;
    const id = await pledgeGift(env(i === 0 ? as('james') : i === 1 ? as('harbour') : publicActor('giver'), daysAgo(days)), {
      kind: 'money', amountMinor: money(major), description: '', campaignId: campaignIds[campaign], name: giver.name, email: giver.email,
      giverDisplay: days % 2 === 0 ? 'first_name' : 'anonymous', giverId,
    });
    if (days > 4) await markGiftReceived(env(as('andriy'), daysAgo(days - 1)), { giftId: id });
    moneyGifts.push(id);
  }
  const generator = await pledgeGift(env(publicActor('giver'), daysAgo(40)), { kind: 'goods', amountMinor: null, description: v.goods.generator.description, campaignId: null, name: v.goods.generator.giver, email: v.goods.generator.email, giverDisplay: 'first_name' });
  await markGiftReceived(env(as('andriy'), daysAgo(38)), { giftId: generator });
  const food = await pledgeGift(env(publicActor('giver'), daysAgo(6)), { kind: 'goods', amountMinor: null, description: v.goods.food.description, campaignId: campaignIds.winter, name: v.goods.food.giver, email: v.goods.food.email, giverDisplay: 'first_name' });
  await markGiftReceived(env(as('andriy'), daysAgo(5)), { giftId: food });
  await pledgeGift(env(publicActor('giver'), daysAgo(2)), { kind: 'transport', amountMinor: null, description: v.goods.transport.description, campaignId: null, name: v.goods.transport.giver, email: v.goods.transport.email, giverDisplay: 'anonymous' });

  const submitted: Array<Awaited<ReturnType<typeof submitNeed>>> = [];
  for (const [i, n] of needs.entries()) {
    const own = i === 0 || i === 5; // Olena's requests; the second keeps the place of her first
    const input = validateNeedInput({ consentToContact: 'on', contactChannel: 'phone', contactValue: '+380 50 000 00 00', ...n.raw, ...v.needOverrides[own ? 0 : i] });
    if (!input.ok) throw new Error(`Demo need invalid: ${JSON.stringify(input.errors)}`);
    const actor = own ? as('olena') : publicActor('recipient');
    submitted.push(await submitNeed(env(actor, daysAgo(n.days)), input.value, own ? { personId: person('olena').personId } : undefined));
  }
  type Submitted = Awaited<ReturnType<typeof submitNeed>>;
  const [olena, sumy, school, kherson, , olenaWinter] = submitted as [Submitted, Submitted, Submitted, Submitted, Submitted, Submitted];
  for (const [n, days] of [[olena, 35], [sumy, 11], [olenaWinter, 8], [school, 7], [kherson, 3]] as const) await triageNeed(env(as('andriy'), daysAgo(days)), { needId: n.needId });

  // Flow 1: delivered by the carrier persona, confirmed with thanks, reported and shared on the feed.
  const flow1 = await matchNeed(env(as('andriy'), daysAgo(33)), { needId: olena.needId, giftIds: [generator, moneyGifts[0] as string, moneyGifts[1] as string], campaignId: campaignIds.fuel });
  await dispatchFlow(env(as('andriy'), daysAgo(30)), {
    flowId: flow1, carrierKind: 'volunteer', carrierName: v.personaNames.mykola['en-GB'], carrierPersonId: person('mykola').personId, fromLabel: v.routes.flow1From,
    costs: v.costs1.map((c) => ({ ...c })),
  });
  const pending = (await readFlow(runtime.store, orgId, flow1))?.costs.filter((c) => c.status === 'submitted') ?? [];
  for (const cost of pending) await approveCost(env(as('helen'), daysAgo(29)), { flowId: flow1, costId: cost.id });
  await recordDelivery(env(as('mykola'), daysAgo(26, 15)), { flowId: flow1 });
  await confirmDelivery(env(as('olena'), daysAgo(25, 18)), {
    needId: olena.needId, by: 'recipient', note: '', locale: 'uk', shareWithParticipants: true, showOnWall: true,
    thanks: v.recipientThanks,
  });
  // Publish only after the profile's safety delay (the delivery was 26 days ago).
  const publishDay = Math.max(1, 26 - settingNumber(settings, 'publication.safetyDelayDays') - 1);
  const report = await draftReportFromFlow(env(as('andriy'), daysAgo(publishDay + 1)), { flowId: flow1 });
  await publishReport(env(as('sofia'), daysAgo(publishDay)), { reportId: report, acknowledgeSafetyDelay: false });
  const suggested = await suggestFeedItems(env(as('sofia'), daysAgo(publishDay, 11)), { reportId: report }, runtime.assistant);
  for (const id of suggested.slice(0, 3)) {
    const item = await readFeedItem(runtime.store, orgId, id);
    if (item) await publishFeedItem(env(as('sofia'), daysAgo(publishDay, 12)), { itemId: id, text: item.text });
  }
  const milestone = await draftFeedItem(env(as('sofia'), daysAgo(2)), { kind: 'milestone', campaignId: campaignIds.winter, text: v.milestone });
  await publishFeedItem(env(as('sofia'), daysAgo(2, 11)), { itemId: milestone, text: v.milestone });

  // Flow 2: on its way with a partner.
  const flow2 = await matchNeed(env(as('andriy'), daysAgo(4)), { needId: sumy.needId, giftIds: [food], campaignId: campaignIds.winter });
  await dispatchFlow(env(as('andriy'), daysAgo(2)), { flowId: flow2, carrierKind: 'partner', carrierName: v.routes.flow2Carrier, fromLabel: v.routes.flow2From, costs: v.costs2.map((c) => ({ ...c })) });

  // Flow 3: on its way with the carrier persona, who hands it over and records costs in "My river";
  // Olena then confirms it herself. Its cost is within every profile's limit, so it is approved.
  const flow3 = await matchNeed(env(as('andriy'), daysAgo(5)), { needId: olenaWinter.needId, giftIds: [moneyGifts[7] as string], campaignId: campaignIds.winter });
  await dispatchFlow(env(as('andriy'), daysAgo(3)), {
    flowId: flow3, carrierKind: 'volunteer', carrierName: v.personaNames.mykola['en-GB'], carrierPersonId: person('mykola').personId, fromLabel: v.routes.flow2From,
    costs: [{ kind: 'fuel', amountMinor: 150_000, currency: 'UAH', note: 'Diesel' }],
  });

  runtime.demoTrackingLinks[olena.needId] = olena.trackingToken;
  runtime.demoTrackingLinks[olenaWinter.needId] = olenaWinter.trackingToken;
  runtime.demoTrackingLinks[sumy.needId] = sumy.trackingToken;
  runtime.demoTrackingLinks[school.needId] = school.trackingToken;
  runtime.demoTrackingLinks[kherson.needId] = kherson.trackingToken;
}
