import type { AccessRequest, Grant, Person } from '@river/psp-access';
import type { Persona } from '../types/World.ts';

const person = (id: string, en: string, uk: string, titleEn: string, titleUk: string, homeUnitId: string, mfa = true): Person => ({
  id, name: { 'en-GB': en, uk }, title: { 'en-GB': titleEn, uk: titleUk }, homeUnitId, mfa, lastSeenAt: '2026-10-19T08:00:00.000Z',
});
const g = (id: string, personId: string, role: Grant['role'], unitId: string, grantedBy = 'r-ivan', grantedAt = '2026-06-01T09:00:00.000Z'): Grant => ({
  id, personId, role, unitId, grantedBy, grantedAt, expiresAt: null, status: 'active',
});
const t = (en: string, uk: string) => ({ 'en-GB': en, uk });

/** The retail stand's people: the group's payments, finance, e-commerce, risk, access and IT teams. All invented. */
export const retailPeople: readonly Person[] = [
  person('r-olha', 'Olha Vasylenko', 'Ольга Василенко', 'Head of payments, Yarmarok Group', 'Керівниця платіжного напряму, група «Ярмарок»', 'rt-group'),
  person('r-mykola', 'Mykola Hrytsai', 'Микола Грицай', 'Payments manager: routing and costs', 'Менеджер платежів: маршрутизація і витрати', 'rt-group'),
  person('r-natalia', 'Natalia Kravets', 'Наталія Кравець', 'Finance controller: reconciliation', 'Фінансова контролерка: звірка', 'rt-group'),
  person('r-serhii', 'Serhii Melnychuk', 'Сергій Мельничук', 'E-commerce operations', 'Операції інтернет-магазину', 'rt-online'),
  person('r-anna', 'Anna Savytska', 'Анна Савицька', 'Risk and fraud', 'Ризики й антифрод', 'rt-group'),
  person('r-ivan', 'Ivan Tkachuk', 'Іван Ткачук', 'Contracts and access', 'Договори й доступи', 'rt-group'),
  person('r-daria', 'Daria Lytvyn', 'Дарія Литвин', 'Product owner, checkout', 'Власниця продукту: оплата', 'rt-online'),
  person('r-yurii', 'Yurii Moroz', 'Юрій Мороз', 'Integration engineer', 'Інженер інтеграцій', 'rt-group'),
  person('r-kateryna', 'Kateryna Shevchuk', 'Катерина Шевчук', 'Regional director, West', 'Регіональна директорка, Захід', 'rt-west', false),
];

/** Their grants: each a role at a unit of the group, reaching down its subtree. */
export const retailGrants: readonly Grant[] = [
  g('gr-r-olha-admin', 'r-olha', 'hierarchy_admin', 'rt-group', 'r-olha', '2025-01-10T09:00:00.000Z'),
  g('gr-r-mykola-pay', 'r-mykola', 'payments_manager', 'rt-group', 'r-olha'),
  g('gr-r-natalia-fin', 'r-natalia', 'finance_controller', 'rt-group', 'r-olha'),
  g('gr-r-serhii-ops', 'r-serhii', 'operator', 'rt-online'),
  g('gr-r-anna-risk', 'r-anna', 'compliance_officer', 'rt-group', 'r-olha'),
  g('gr-r-ivan-access', 'r-ivan', 'access_manager', 'rt-group', 'r-olha'),
  g('gr-r-daria-checkout', 'r-daria', 'checkout_designer', 'rt-online'),
  g('gr-r-yurii-int', 'r-yurii', 'integrator', 'rt-group', 'r-olha'),
  g('gr-r-kateryna-region', 'r-kateryna', 'auditor', 'rt-west'),
];

export const retailRequests: readonly AccessRequest[] = [
  { id: 'rq-r-kateryna', personId: 'r-kateryna', role: 'auditor', unitId: 'rt-retail', reason: t('To compare my region’s card costs with the other regions', 'Щоб порівняти карткові витрати мого регіону з іншими'), requestedAt: '2026-10-18T10:20:00.000Z', status: 'pending', decidedBy: null, decidedAt: null },
  { id: 'rq-r-serhii-fin', personId: 'r-serhii', role: 'finance_controller', unitId: 'rt-online', reason: t('To close refund differences myself', 'Щоб самому закривати розбіжності з поверненнями'), requestedAt: '2026-10-15T14:00:00.000Z', status: 'rejected', decidedBy: 'r-ivan', decidedAt: '2026-10-15T16:30:00.000Z' },
];

/** The cabinets of the retail stand, in the order the demo offers them. */
export const retailPersonas: readonly Persona[] = [
  { personId: 'r-mykola', cabinet: 'routing', description: t('How each payment is routed and what it costs: the routing strategy and its threshold, on-us share, effective rates by bank and channel, the terminal banks of the regions, simulations on history.', 'Як маршрутизується кожен платіж і скільки він коштує: стратегія маршрутизації та поріг, частка on-us, ефективні ставки за банками й каналами, банки терміналів у регіонах, симуляції на історії.') },
  { personId: 'r-natalia', cabinet: 'reconciliation', description: t('Settlement batches of every bank, store and channel reconciled three ways — sales, the bank’s report, the credit — with the differences and the claims raised.', 'Пакети розрахунків кожного банку, магазину й каналу, звірені трьома способами — продажі, звіт банку, зарахування, — з розбіжностями й поданими претензіями.') },
  { personId: 'r-serhii', cabinet: 'operator', description: t('Online orders: holds awaiting picking, captures of the picked total, refunds, disputes, bonus points in the payment.', 'Онлайн-замовлення: блокування до комплектації, списання суми після комплектації, повернення, спори, бонусні бали в оплаті.') },
  { personId: 'r-olha', cabinet: 'hierarchy', description: t('The whole group: legal entities, regions and stores, the policies that flow down them, connections with banks, the agents. Full access.', 'Уся група: юрособи, регіони й магазини, політики, що діють донизу, підключення до банків, агенти. Повний доступ.') },
  { personId: 'r-anna', cabinet: 'compliance', description: t('Risk and fraud of online payments: screening rules, held attempts, alerts.', 'Ризики й шахрайство в онлайн-платежах: правила перевірки, затримані спроби, сповіщення.') },
  { personId: 'r-ivan', cabinet: 'access', description: t('Agreements with the acquiring banks and their terms, who may do what and where, access requests and the audit trail.', 'Договори з банками-еквайрами та їхні умови, хто, що і де може робити, запити доступу та журнал аудиту.') },
  { personId: 'r-daria', cabinet: 'checkout', description: t('The pay page of the web shop and the app: instruments and their order, bonus points, languages.', 'Сторінка оплати інтернет-магазину й застосунку: інструменти та їх порядок, бонусні бали, мови.') },
  { personId: 'r-yurii', cabinet: 'integrator', description: t('Connections with the order system, the bonus system, the accounting system and the banks: keys, webhooks, the API log, events.', 'Підключення до системи замовлень, бонусної системи, облікової системи та банків: ключі, вебхуки, журнал API, події.') },
  { personId: 'r-kateryna', cabinet: 'auditor', description: t('The West region, read only: its stores’ card turnover and costs from the banks’ reports, settlements, sessions and payments — and her request to compare with the other regions, waiting for a decision.', 'Регіон «Захід» у режимі перегляду: картковий оборот і витрати магазинів за звітами банків, розрахунки, сесії й платежі — і її запит на порівняння з іншими регіонами, що чекає рішення.') },
];
