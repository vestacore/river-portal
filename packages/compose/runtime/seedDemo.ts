import { suggestFeedItems, publishFeedItem, readFeedItem, draftFeedItem } from '@river/feed';
import { confirmDelivery, dispatchFlow, matchNeed, recordDelivery, approveCost, readFlow } from '@river/flows';
import { launchCampaign, markGiftReceived, pledgeGift } from '@river/gifts';
import { submitNeed, triageNeed, validateNeedInput } from '@river/needs';
import { draftReportFromFlow, publishReport } from '@river/reports';
import { commandEnv } from './commandEnv.ts';
import { publicActor } from './publicActor.ts';
import { staffActor } from './staffActor.ts';
import type { Runtime } from './types/Runtime.ts';

const daysAgo = (days: number, hour = 10) => {
  const d = new Date(Date.now() - days * 86_400_000);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

/**
 * Seeds fictional, bilingual demo data (spec: 10-demo-content) through the same commands the UI
 * uses, so every page and projection is exercised. Runs once per store (guarded by a marker).
 */
export async function seedDemo(runtime: Runtime): Promise<void> {
  const orgId = runtime.config.orgId;
  try {
    await runtime.store.transact(async (tx) => tx.create(`orgs/${orgId}/meta/seed`, { at: new Date().toISOString(), kind: 'demo' }));
  } catch {
    return; // already seeded
  }
  const andriy = staffActor('andriy@openriver.example', 'coordinator');
  const helen = staffActor('helen@openriver.example', 'administrator');
  const staff = (at: string, who = andriy) => commandEnv(runtime, who, at);
  const web = (at: string, role: 'recipient' | 'giver' = 'giver') => commandEnv(runtime, publicActor(role), at);

  const fuel = await launchCampaign(staff(daysAgo(60)), {
    slug: 'fuel-for-the-kharkiv-run',
    title: { 'en-GB': 'Fuel for the Kharkiv run', uk: 'Пальне для харківського рейсу' },
    summary: {
      'en-GB': 'One van, one driver, 2,300 km from Leeds to Kharkiv oblast. Your gift covers fuel, the ferry and road tolls — and you will see every receipt.',
      uk: 'Один бус, один водій, 2 300 км від Лідса до Харківщини. Ваш дар покриває пальне, пором і платні дороги — і ви побачите кожен чек.',
    },
    goalMinor: 240_000, currency: 'GBP',
  });
  const winter = await launchCampaign(staff(daysAgo(20)), {
    slug: 'warm-homes-this-winter',
    title: { 'en-GB': 'Warm homes this winter', uk: 'Теплі домівки цієї зими' },
    summary: {
      'en-GB': 'Generators, power banks and heaters for families and schools near the front line, chosen by the people who will use them.',
      uk: 'Генератори, павербанки й обігрівачі для родин і шкіл біля лінії фронту — саме те, що обрали люди, які ними користуватимуться.',
    },
    goalMinor: 600_000, currency: 'GBP',
  });

  const money: Array<[number, string, string, number, string | null]> = [
    [58, 'James Hart', 'james@example.org', 50_000, fuel], [57, 'Harbour Print Ltd', 'sarah@harbourprint.example', 100_000, fuel],
    [55, 'Aisha Rahman', 'aisha@example.org', 2_500, fuel], [54, 'Tom Price', 'tom@example.org', 4_000, fuel],
    [52, 'Ірина Коваль', 'iryna@example.org', 10_000, fuel], [50, 'Grace Lee', 'grace@example.org', 3_000, fuel],
    [18, 'Oliver Byrne', 'oliver@example.org', 20_000, winter], [15, 'Марта Шевчук', 'marta@example.org', 7_500, winter],
    [9, 'Leeds Community Choir', 'choir@example.org', 45_000, winter], [3, 'Daniel Owusu', 'daniel@example.org', 5_000, winter],
  ];
  const moneyGifts: string[] = [];
  for (const [days, name, email, amountMinor, campaignId] of money) {
    const id = await pledgeGift(web(daysAgo(days)), { kind: 'money', amountMinor, description: '', campaignId, name, email, giverDisplay: days % 2 === 0 ? 'first_name' : 'anonymous' });
    if (days > 4) await markGiftReceived(staff(daysAgo(days - 1)), { giftId: id });
    moneyGifts.push(id);
  }
  const generator = await pledgeGift(web(daysAgo(40)), { kind: 'goods', amountMinor: null, description: '3 kW petrol generator, new, boxed', campaignId: null, name: 'Peter Walsh', email: 'peter@example.org', giverDisplay: 'first_name' });
  await markGiftReceived(staff(daysAgo(38)), { giftId: generator });
  const food = await pledgeGift(web(daysAgo(6)), { kind: 'goods', amountMinor: null, description: '6 food parcels (tinned food, grains, tea)', campaignId: winter, name: 'St Mary Parish', email: 'parish@example.org', giverDisplay: 'first_name' });
  await markGiftReceived(staff(daysAgo(5)), { giftId: food });
  await pledgeGift(web(daysAgo(2)), { kind: 'transport', amountMinor: null, description: 'Van space Lviv → Dnipro, second week of the month', campaignId: null, name: 'Mykhailo', email: 'm@example.org', giverDisplay: 'anonymous' });

  const need = async (days: number, raw: Record<string, string>) => {
    const input = validateNeedInput({ consentToContact: 'on', contactChannel: 'phone', contactValue: '+380 50 000 00 00', ...raw });
    if (!input.ok) throw new Error(`Demo need invalid: ${JSON.stringify(input.errors)}`);
    return submitNeed(web(daysAgo(days), 'recipient'), input.value);
  };
  const olena = await need(36, { categoryId: 'energy', form: 'goods', description: 'Нам потрібен генератор: онук робить уроки при свічці, а холодильник з ліками вимикається. Нас троє.', oblastId: 'kharkiv', settlement: 'Балаклія', forWhom: 'family', householdSize: '3', urgency: 'this_week', name: 'Олена', locale: 'uk', consentToStory: 'on' });
  const sumy = await need(12, { categoryId: 'food', form: 'goods', description: 'Six older neighbours on our street have not had a food delivery for a month. We can collect from the village shop.', oblastId: 'sumy', settlement: 'Krasnopillia', forWhom: 'neighbours', householdSize: '6', urgency: 'this_week', name: 'Vasyl', locale: 'en-GB' });
  const school = await need(8, { categoryId: 'education', form: 'goods', description: 'Школа з укриттям: потрібні павербанки й настільні лампи, щоб діти могли вчитися під час відключень.', oblastId: 'dnipropetrovsk', settlement: 'Нікополь', forWhom: 'institution', householdSize: '120', urgency: 'this_month', name: 'Наталія Петрівна, директорка', locale: 'uk' });
  const kherson = await need(4, { categoryId: 'hygiene', form: 'goods', description: 'Гігієнічні набори для родини з маленькою дитиною: підгузки (розмір 4), мило, серветки.', oblastId: 'kherson', settlement: 'Херсон', forWhom: 'family', householdSize: '4', urgency: 'this_week', name: 'Катерина', locale: 'uk' });
  await need(1, { categoryId: 'medicine', form: 'money', description: 'I am 78 and need help paying for my heart medication this month.', oblastId: 'zaporizhzhia', settlement: 'Zaporizhzhia', forWhom: 'self', householdSize: '1', urgency: 'today', name: 'Ivan', locale: 'en-GB' });

  for (const [n, days] of [[olena, 35], [sumy, 11], [school, 7], [kherson, 3]] as const) await triageNeed(staff(daysAgo(days)), { needId: n.needId });

  // Flow 1: delivered, confirmed with thanks, reported and shared on the feed.
  const flow1 = await matchNeed(staff(daysAgo(33)), { needId: olena.needId, giftIds: [generator, moneyGifts[0] as string, moneyGifts[1] as string], campaignId: fuel });
  await dispatchFlow(staff(daysAgo(30)), { flowId: flow1, carrierKind: 'volunteer', carrierName: 'Mykola', fromLabel: 'Leeds', costs: [
    { kind: 'fuel', amountMinor: 1_260_000, currency: 'UAH', note: 'Diesel, Lviv → Kharkiv oblast and back' },
    { kind: 'fuel', amountMinor: 18_640, currency: 'GBP', note: 'Diesel, Leeds → Dover and Calais → Lviv' },
    { kind: 'ferry', amountMinor: 31_000, currency: 'GBP', note: 'Dover–Calais, van and driver, return' },
    { kind: 'tolls', amountMinor: 8_950, currency: 'EUR', note: 'German and Polish road tolls' },
  ] });
  const flowDoc = await readFlow(runtime.store, orgId, flow1);
  for (const cost of flowDoc?.costs.filter((c) => c.status === 'submitted') ?? []) {
    await approveCost(staff(daysAgo(29), helen), { flowId: flow1, costId: cost.id });
  }
  await recordDelivery(staff(daysAgo(26, 15)), { flowId: flow1 });
  await confirmDelivery(web(daysAgo(25, 18), 'recipient'), {
    needId: olena.needId, by: 'recipient', note: '', locale: 'uk', shareWithParticipants: true, showOnWall: true,
    thanks: 'Дякуємо всім, хто віз цей генератор через пів Європи. Тепер онук робить уроки при світлі, а ліки в холоді. Ви повернули нам спокій.',
  });
  const report = await draftReportFromFlow(staff(daysAgo(20)), { flowId: flow1 });
  await publishReport(staff(daysAgo(11), helen), { reportId: report, acknowledgeSafetyDelay: false });
  const suggested = await suggestFeedItems(staff(daysAgo(11, 11), helen), { reportId: report }, runtime.assistant);
  for (const id of suggested.slice(0, 3)) {
    const item = await readFeedItem(runtime.store, orgId, id);
    if (item) await publishFeedItem(staff(daysAgo(11, 12), helen), { itemId: id, text: item.text });
  }
  const milestone = await draftFeedItem(staff(daysAgo(2), helen), {
    kind: 'milestone', campaignId: winter,
    text: {
      'en-GB': 'The Leeds Community Choir sang for an evening and gave £450 to Warm homes this winter. Thank you — the first heaters are on their way.',
      uk: 'Громадський хор Лідса співав цілий вечір і передав £450 на «Теплі домівки цієї зими». Дякуємо — перші обігрівачі вже в дорозі.',
    },
  });
  await publishFeedItem(staff(daysAgo(2, 11), helen), { itemId: milestone, text: {
    'en-GB': 'The Leeds Community Choir sang for an evening and gave £450 to Warm homes this winter. Thank you — the first heaters are on their way.',
    uk: 'Громадський хор Лідса співав цілий вечір і передав £450 на «Теплі домівки цієї зими». Дякуємо — перші обігрівачі вже в дорозі.',
  } });

  // Flow 2: on its way.
  const flow2 = await matchNeed(staff(daysAgo(4)), { needId: sumy.needId, giftIds: [food], campaignId: winter });
  await dispatchFlow(staff(daysAgo(2)), { flowId: flow2, carrierKind: 'partner', carrierName: 'Sumy volunteer hub', fromLabel: 'Lviv hub', costs: [
    { kind: 'fuel', amountMinor: 420_000, currency: 'UAH', note: 'Lviv → Sumy oblast' },
  ] });

  runtime.demoTrackingLinks[olena.needId] = olena.trackingToken;
  runtime.demoTrackingLinks[sumy.needId] = sumy.trackingToken;
  runtime.demoTrackingLinks[school.needId] = school.trackingToken;
  runtime.demoTrackingLinks[kherson.needId] = kherson.trackingToken;
}
