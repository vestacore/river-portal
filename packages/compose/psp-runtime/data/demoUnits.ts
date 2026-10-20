import type { Unit } from '@river/psp-units';

const u = (id: string, parentId: string | null, kind: Unit['kind'], en: string, uk: string, extra: Partial<Unit> = {}): Unit => ({
  id, parentId, kind, name: { 'en-GB': en, uk }, code: id.replace(/^ou-/, '').toUpperCase(), country: 'UA', currency: 'UAH',
  status: 'active', blockInheritance: false, mcc: null, channel: null, createdAt: '2025-03-01T09:00:00.000Z', ...extra,
});

/**
 * The demo hierarchy. Every organisation and person here is invented; any likeness is accidental.
 * The PSP at the root, two licensed entities, a holding with a marketplace and a pharmacy chain, a travel
 * agency with its suppliers, a non-profit, a partner with a coffee franchise and a school, and in Europe a
 * bike shop that captures at shipment, a software firm with subscriptions, a jeweller and a newcomer.
 */
export const demoUnits: readonly Unit[] = [
  u('ou-riverpay', null, 'platform', 'River Pay', 'River Pay', { code: 'RP' }),
  u('ou-ua', 'ou-riverpay', 'entity', 'River Pay Ukraine', 'River Pay Україна', { code: 'RP-UA' }),
  u('ou-kvitka', 'ou-ua', 'holding', 'Kvitka Group', 'Квітка Груп', { code: 'KVG' }),
  u('ou-kvitka-market', 'ou-kvitka', 'merchant', 'Kvitka Market', 'Квітка Маркет', { code: 'KVM', mcc: '5399' }),
  u('ou-kvitka-web', 'ou-kvitka-market', 'store', 'kvitka-market.example', 'kvitka-market.example', { code: 'KVM-WEB', channel: 'web' }),
  u('ou-kvitka-app', 'ou-kvitka-market', 'store', 'Kvitka Market app', 'Застосунок Квітка Маркет', { code: 'KVM-APP', channel: 'app' }),
  u('ou-seller-honey', 'ou-kvitka-market', 'seller', 'Poltava Apiary', 'Пасіка «Полтавська»', { code: 'S-HONEY' }),
  u('ou-seller-ceramics', 'ou-kvitka-market', 'seller', 'Opishnia Ceramics', 'Опішнянська кераміка', { code: 'S-CERAM' }),
  u('ou-seller-bakery', 'ou-kvitka-market', 'seller', 'Rynok Bakery', 'Пекарня «Ринок»', { code: 'S-BAKE' }),
  u('ou-kvitka-pharmacy', 'ou-kvitka', 'merchant', 'Kvitka Pharmacy', 'Квітка Аптека', { code: 'KVP', mcc: '5912' }),
  u('ou-pharmacy-podil', 'ou-kvitka-pharmacy', 'store', 'Kyiv, Podil', 'Київ, Поділ', { code: 'KVP-01', channel: 'pos' }),
  u('ou-pharmacy-rynok', 'ou-kvitka-pharmacy', 'store', 'Lviv, Rynok Square', 'Львів, площа Ринок', { code: 'KVP-02', channel: 'pos' }),
  u('ou-dnipro-travel', 'ou-ua', 'merchant', 'Dnipro Travel', 'Дніпро Тревел', { code: 'DTR', mcc: '4722' }),
  u('ou-dnipro-travel-web', 'ou-dnipro-travel', 'store', 'dnipro-travel.example', 'dnipro-travel.example', { code: 'DTR-WEB', channel: 'web' }),
  u('ou-supplier-hotel', 'ou-dnipro-travel', 'seller', 'Naberezhna Hotel', 'Готель «Набережна»', { code: 'S-HOTEL' }),
  u('ou-supplier-coach', 'ou-dnipro-travel', 'seller', 'Lastivka Coaches', 'Перевізник «Ластівка»', { code: 'S-COACH' }),
  u('ou-open-river', 'ou-ua', 'merchant', 'Open River Aid', 'Відкрита Ріка', { code: 'ORA', mcc: '8398' }),
  u('ou-karpaty', 'ou-ua', 'partner', 'Karpaty Pay', 'Карпати Пей', { code: 'KRP' }),
  u('ou-zerno', 'ou-karpaty', 'holding', 'Zerno Coffee', 'Кав’ярні «Зерно»', { code: 'ZRN', mcc: '5814' }),
  u('ou-zerno-if', 'ou-zerno', 'merchant', 'Zerno Ivano-Frankivsk', 'Зерно Івано-Франківськ', { code: 'ZRN-IF', mcc: '5814', channel: 'pos' }),
  u('ou-zerno-uzh', 'ou-zerno', 'merchant', 'Zerno Uzhhorod', 'Зерно Ужгород', { code: 'ZRN-UZH', mcc: '5814', channel: 'pos', blockInheritance: true }),
  u('ou-krok', 'ou-karpaty', 'merchant', 'Krok Online School', 'Онлайн-школа «Крок»', { code: 'KRK', mcc: '8299' }),
  u('ou-lis', 'ou-karpaty', 'merchant', 'Forest Shop', 'Лісова крамниця', { code: 'LIS', mcc: '5992', status: 'onboarding', createdAt: '2026-10-12T09:00:00.000Z' }),
  u('ou-eu', 'ou-riverpay', 'entity', 'River Pay Europe', 'River Pay Європа', { code: 'RP-EU', country: 'LT', currency: 'EUR' }),
  u('ou-baltic-bikes', 'ou-eu', 'merchant', 'Baltic Bikes', 'Baltic Bikes', { code: 'BBK', country: 'LT', currency: 'EUR', mcc: '5940' }),
  u('ou-baltic-bikes-web', 'ou-baltic-bikes', 'store', 'baltic-bikes.example', 'baltic-bikes.example', { code: 'BBK-WEB', country: 'LT', currency: 'EUR', channel: 'web' }),
  u('ou-nordlicht', 'ou-eu', 'merchant', 'Nordlicht Software', 'Nordlicht Software', { code: 'NLS', country: 'DE', currency: 'EUR', mcc: '5734' }),
  u('ou-amber', 'ou-eu', 'merchant', 'Amber & Silver', 'Amber & Silver', { code: 'AMB', country: 'LV', currency: 'EUR', mcc: '5944' }),
  u('ou-vilnius-hall', 'ou-eu', 'merchant', 'Vilnius Market Hall', 'Vilnius Market Hall', { code: 'VMH', country: 'LT', currency: 'EUR', mcc: '5411', status: 'onboarding', createdAt: '2026-10-05T09:00:00.000Z' }),
];
