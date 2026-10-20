import type { AccessRequest, Grant, Person } from '@river/psp-access';
import type { Persona } from '../types/World.ts';

const person = (id: string, en: string, uk: string, titleEn: string, titleUk: string, homeUnitId: string, mfa = true): Person => ({
  id, name: { 'en-GB': en, uk }, title: { 'en-GB': titleEn, uk: titleUk }, homeUnitId, mfa, lastSeenAt: '2026-10-19T08:00:00.000Z',
});

/** The people of the demo. All are invented. */
export const demoPeople: readonly Person[] = [
  person('p-andrii', 'Andrii Melnyk', 'Андрій Мельник', 'Platform administrator', 'Адміністратор платформи', 'ou-riverpay'),
  person('p-iryna', 'Iryna Koval', 'Ірина Коваль', 'Head of payment operations, Ukraine', 'Керівниця платіжних операцій, Україна', 'ou-ua'),
  person('p-marta', 'Marta Savchuk', 'Марта Савчук', 'Money laundering reporting officer', 'Відповідальна за фінансовий моніторинг', 'ou-riverpay'),
  person('p-denys', 'Denys Tkachenko', 'Денис Ткаченко', 'Contracts and access, Ukraine', 'Договори та доступи, Україна', 'ou-ua'),
  person('p-sofiia', 'Sofiia Bondar', 'Софія Бондар', 'E-commerce lead, Kvitka Group', 'Керівниця е-комерції, Квітка Груп', 'ou-kvitka'),
  person('p-oleksii', 'Oleksii Marchenko', 'Олексій Марченко', 'Lead developer, Kvitka Group', 'Провідний розробник, Квітка Груп', 'ou-kvitka'),
  person('p-lina', 'Lina Petraitė', 'Ліна Петрайте', 'Payment operations, Europe', 'Платіжні операції, Європа', 'ou-eu'),
  person('p-jonas', 'Jonas Weber', 'Йонас Вебер', 'CTO, Nordlicht Software', 'Технічний директор, Nordlicht Software', 'ou-nordlicht', false),
  person('p-halyna', 'Halyna Rudenko', 'Галина Руденко', 'Director, Open River Aid', 'Директорка, Відкрита Ріка', 'ou-open-river'),
  person('p-taras', 'Taras Hnatiuk', 'Тарас Гнатюк', 'Partner manager, Karpaty Pay', 'Менеджер партнерств, Карпати Пей', 'ou-karpaty'),
  person('p-olena', 'Olena Lysenko', 'Олена Лисенко', 'Internal auditor', 'Внутрішня аудиторка', 'ou-riverpay'),
  person('p-maksym', 'Maksym Ivanenko', 'Максим Іваненко', 'Product manager, Dnipro Travel', 'Продакт-менеджер, Дніпро Тревел', 'ou-dnipro-travel', false),
];

const g = (id: string, personId: string, role: Grant['role'], unitId: string, grantedBy = 'p-denys', grantedAt = '2026-07-01T09:00:00.000Z'): Grant => ({
  id, personId, role, unitId, grantedBy, grantedAt, expiresAt: null, status: 'active',
});

/** Grants: one role at one unit, reaching down its subtree. Sofiia holds two profiles to switch between. */
export const demoGrants: readonly Grant[] = [
  g('gr-andrii-admin', 'p-andrii', 'hierarchy_admin', 'ou-riverpay', 'p-andrii', '2025-01-15T09:00:00.000Z'),
  g('gr-iryna-ops', 'p-iryna', 'operator', 'ou-ua', 'p-andrii'),
  g('gr-marta-aml', 'p-marta', 'compliance_officer', 'ou-riverpay', 'p-andrii'),
  g('gr-denys-access', 'p-denys', 'access_manager', 'ou-ua', 'p-andrii'),
  g('gr-sofiia-checkout', 'p-sofiia', 'checkout_designer', 'ou-kvitka'),
  g('gr-sofiia-owner', 'p-sofiia', 'merchant_owner', 'ou-kvitka-market'),
  g('gr-oleksii-int', 'p-oleksii', 'integrator', 'ou-kvitka'),
  g('gr-lina-ops', 'p-lina', 'operator', 'ou-eu', 'p-andrii'),
  g('gr-jonas-int', 'p-jonas', 'integrator', 'ou-nordlicht', 'p-andrii'),
  g('gr-halyna-owner', 'p-halyna', 'merchant_owner', 'ou-open-river'),
  g('gr-taras-ops', 'p-taras', 'operator', 'ou-karpaty'),
  g('gr-olena-audit', 'p-olena', 'auditor', 'ou-riverpay', 'p-andrii'),
  g('gr-maksym-checkout', 'p-maksym', 'checkout_designer', 'ou-dnipro-travel'),
  g('gr-maksym-ops', 'p-maksym', 'operator', 'ou-dnipro-travel', 'p-denys', '2026-10-02T16:40:00.000Z'),
];

/** Requests waiting for a decision — one of them breaks the separation of duties. */
export const demoRequests: readonly AccessRequest[] = [
  { id: 'rq-taras-aml', personId: 'p-taras', role: 'compliance_officer', unitId: 'ou-karpaty', reason: { 'en-GB': 'To clear holds of the partner’s merchants myself', uk: 'Щоб самому вирішувати затримки мерчантів партнера' }, requestedAt: '2026-10-18T15:20:00.000Z', status: 'pending', decidedBy: null, decidedAt: null },
  { id: 'rq-jonas-eu', personId: 'p-jonas', role: 'integrator', unitId: 'ou-eu', reason: { 'en-GB': 'One webhook endpoint for all our EU entities', uk: 'Одна кінцева точка вебхуків для всіх наших юросіб у ЄС' }, requestedAt: '2026-10-17T10:05:00.000Z', status: 'pending', decidedBy: null, decidedAt: null },
  { id: 'rq-maksym-ops', personId: 'p-maksym', role: 'operator', unitId: 'ou-dnipro-travel', reason: { 'en-GB': 'Refunds for cancelled tours', uk: 'Повернення за скасовані тури' }, requestedAt: '2026-10-02T12:00:00.000Z', status: 'approved', decidedBy: 'p-denys', decidedAt: '2026-10-02T16:40:00.000Z' },
  { id: 'rq-halyna-admin', personId: 'p-halyna', role: 'hierarchy_admin', unitId: 'ou-ua', reason: { 'en-GB': 'Asked for the whole entity', uk: 'Попросила доступ до всієї юрособи' }, requestedAt: '2026-09-21T09:30:00.000Z', status: 'rejected', decidedBy: 'p-denys', decidedAt: '2026-09-21T11:00:00.000Z' },
];

const t = (en: string, uk: string) => ({ 'en-GB': en, uk });

/** The six cabinets' people, in the order the demo offers them. */
export const demoPersonas: readonly Persona[] = [
  { personId: 'p-iryna', cabinet: 'operator', description: t('Sees every flow of River Pay Ukraine: orders, invoices, attempts, payments. Captures, refunds, answers disputes, watches payouts.', 'Бачить усі потоки River Pay Україна: замовлення, інвойси, спроби, платежі. Списує, повертає, відповідає на спори, стежить за виплатами.') },
  { personId: 'p-andrii', cabinet: 'hierarchy', description: t('The whole tree: units, the policies that flow down it, rules, routes and the swarm. Full access.', 'Усе дерево: одиниці, політики, що течуть донизу, правила, маршрути й рій агентів. Повний доступ.') },
  { personId: 'p-marta', cabinet: 'compliance', description: t('Holds and alerts, threshold reports, merchant onboarding, the rules of financial monitoring across both entities.', 'Затримки та сповіщення, порогові звіти, онбординг мерчантів, правила фінмоніторингу в обох юрособах.') },
  { personId: 'p-denys', cabinet: 'access', description: t('Contracts and tariffs of the Ukrainian merchants; who may do what and where; requests and separation of duties.', 'Договори й тарифи українських мерчантів; хто, що і де може робити; запити та розподіл обов’язків.') },
  { personId: 'p-sofiia', cabinet: 'checkout', description: t('The pay pages of Kvitka Group: colours, instruments and their order, languages, showing the payer the split. Two profiles.', 'Сторінки оплати Квітка Груп: кольори, інструменти та їх порядок, мови, показ розщеплення платнику. Два профілі.') },
  { personId: 'p-oleksii', cabinet: 'integrator', description: t('API keys, webhook endpoints and deliveries, the API log, the event catalogue and the sandbox of Kvitka Group.', 'API-ключі, вебхуки та доставки, журнал API, каталог подій і пісочниця Квітка Груп.') },
];
