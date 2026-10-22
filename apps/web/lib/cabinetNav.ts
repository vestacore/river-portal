import type { Permission, PspRole } from '@river/psp-access';
import type { StandId } from '@river/psp-runtime';

/**
 * The sections of the cabinets. Each names the permission its page checks; each role's menu lists the
 * sections that role works with, in its own order — as the earlier portal's server-driven menus did per
 * profile. A section outside a role's menu still opens if the profile has its permission.
 */
export type SectionKey =
  | 'overview' | 'orders' | 'invoices' | 'sessions' | 'payments' | 'disputes' | 'payouts' | 'settlements' | 'ledger' | 'costs'
  | 'units' | 'policies' | 'rules' | 'routes' | 'connectors'
  | 'reviews' | 'alerts' | 'onboarding'
  | 'contracts' | 'tariffs' | 'people' | 'requests' | 'audit'
  | 'paypages'
  | 'keys' | 'webhooks' | 'logs' | 'events' | 'sandbox'
  | 'agents';

export const sections: Record<SectionKey, { path: string; icon: string; permission: Permission | null; en: string; uk: string }> = {
  overview: { path: '', icon: 'chart', permission: null, en: 'Overview', uk: 'Огляд' },
  orders: { path: '/orders', icon: 'invoice', permission: 'flows.read', en: 'Orders', uk: 'Замовлення' },
  invoices: { path: '/invoices', icon: 'file', permission: 'flows.read', en: 'Invoices', uk: 'Інвойси' },
  sessions: { path: '/sessions', icon: 'bridge', permission: 'flows.read', en: 'Sessions', uk: 'Сесії' },
  payments: { path: '/payments', icon: 'card', permission: 'flows.read', en: 'Payments', uk: 'Платежі' },
  disputes: { path: '/disputes', icon: 'warning', permission: 'disputes.respond', en: 'Disputes', uk: 'Спори' },
  payouts: { path: '/payouts', icon: 'coins', permission: 'payouts.read', en: 'Payouts', uk: 'Виплати' },
  settlements: { path: '/settlements', icon: 'scales', permission: 'payouts.read', en: 'Settlements and reconciliation', uk: 'Розрахунки і звірка' },
  costs: { path: '/costs', icon: 'chart', permission: 'costs.read', en: 'Costs', uk: 'Витрати' },
  connectors: { path: '/connectors', icon: 'plug', permission: 'flows.read', en: 'Connections', uk: 'Підключення' },
  ledger: { path: '/ledger', icon: 'scales', permission: 'payouts.read', en: 'Ledger', uk: 'Облік' },
  units: { path: '/units', icon: 'tree', permission: 'flows.read', en: 'Hierarchy', uk: 'Ієрархія' },
  policies: { path: '/policies', icon: 'layers', permission: 'policies.write', en: 'Policies', uk: 'Політики' },
  rules: { path: '/rules', icon: 'filter', permission: 'rules.write', en: 'Rules', uk: 'Правила' },
  routes: { path: '/routes', icon: 'route', permission: 'flows.read', en: 'Routing', uk: 'Маршрутизація' },
  reviews: { path: '/reviews', icon: 'pause', permission: 'aml.review', en: 'Held attempts', uk: 'Затримані спроби' },
  alerts: { path: '/alerts', icon: 'bell', permission: 'aml.read', en: 'Alerts', uk: 'Сповіщення' },
  onboarding: { path: '/onboarding', icon: 'magnifier', permission: 'aml.read', en: 'Onboarding', uk: 'Онбординг' },
  contracts: { path: '/contracts', icon: 'file', permission: 'contracts.read', en: 'Contracts', uk: 'Договори' },
  tariffs: { path: '/tariffs', icon: 'coins', permission: 'contracts.read', en: 'Tariffs', uk: 'Тарифи' },
  people: { path: '/people', icon: 'users', permission: 'grants.read', en: 'People and grants', uk: 'Люди та доступи' },
  requests: { path: '/requests', icon: 'inbox', permission: 'grants.read', en: 'Access requests', uk: 'Запити доступу' },
  audit: { path: '/audit', icon: 'log', permission: 'audit.read', en: 'Audit trail', uk: 'Журнал аудиту' },
  paypages: { path: '/paypages', icon: 'phone', permission: 'checkout.read', en: 'Pay pages', uk: 'Сторінки оплати' },
  keys: { path: '/keys', icon: 'key', permission: 'keys.manage', en: 'API keys', uk: 'API-ключі' },
  webhooks: { path: '/webhooks', icon: 'hook', permission: 'webhooks.manage', en: 'Webhooks', uk: 'Вебхуки' },
  logs: { path: '/logs', icon: 'terminal', permission: 'logs.read', en: 'API log', uk: 'Журнал API' },
  events: { path: '/events', icon: 'stack', permission: null, en: 'Event catalogue', uk: 'Каталог подій' },
  sandbox: { path: '/sandbox', icon: 'play', permission: 'orders.write', en: 'Sandbox', uk: 'Пісочниця' },
  agents: { path: '/agents', icon: 'bot', permission: null, en: 'Agents', uk: 'Агенти' },
};

type Menu = ReadonlyArray<{ group: [string, string] | null; items: SectionKey[] }>;

/** The labels a stand gives a section differently: the retail group's acquiring terms are what the PSP calls tariffs. */
export const standLabels: Partial<Record<StandId, Partial<Record<SectionKey, [string, string]>>>> = {
  retail: { tariffs: ['Acquiring terms', 'Умови еквайрингу'], reviews: ['Held attempts', 'Затримані спроби'], alerts: ['Fraud alerts', 'Сповіщення про шахрайство'] },
};

/** The retail group's menus: routing and costs, reconciliation, the group's own systems; no PSP payouts or merchant onboarding. */
const retailMenus: Partial<Record<PspRole, Menu>> = {
  operator: [
    { group: null, items: ['overview'] },
    { group: ['Online orders', 'Онлайн-замовлення'], items: ['orders', 'invoices', 'sessions', 'payments'] },
    { group: ['After payment', 'Після оплати'], items: ['disputes', 'settlements'] },
    { group: ['Assistance', 'Допомога'], items: ['agents'] },
  ],
  hierarchy_admin: [
    { group: null, items: ['overview'] },
    { group: ['Group', 'Група'], items: ['units', 'policies', 'rules', 'routes', 'connectors'] },
    { group: ['Flows', 'Потоки'], items: ['orders', 'invoices', 'sessions', 'payments'] },
    { group: ['Money', 'Гроші'], items: ['costs', 'settlements', 'ledger'] },
    { group: ['Risk', 'Ризики'], items: ['reviews', 'alerts'] },
    { group: ['Access', 'Доступ'], items: ['contracts', 'tariffs', 'people', 'requests', 'audit'] },
    { group: ['Pay page and integration', 'Оплата й інтеграція'], items: ['paypages', 'keys', 'webhooks', 'logs', 'events'] },
    { group: ['Assistance', 'Допомога'], items: ['agents'] },
  ],
  payments_manager: [
    { group: null, items: ['overview'] },
    { group: ['Routing and costs', 'Маршрутизація і витрати'], items: ['routes', 'costs', 'connectors'] },
    { group: ['Flows', 'Потоки'], items: ['sessions', 'payments'] },
    { group: ['Agreements', 'Договори'], items: ['contracts', 'tariffs'] },
    { group: ['Assistance', 'Допомога'], items: ['agents'] },
  ],
  finance_controller: [
    { group: null, items: ['overview'] },
    { group: ['Reconciliation', 'Звірка'], items: ['settlements', 'costs', 'ledger'] },
    { group: ['Flows', 'Потоки'], items: ['payments', 'disputes'] },
    { group: ['Assistance', 'Допомога'], items: ['agents', 'audit'] },
  ],
  compliance_officer: [
    { group: null, items: ['overview'] },
    { group: ['Risk and fraud', 'Ризики й антифрод'], items: ['reviews', 'alerts', 'rules'] },
    { group: ['Flows', 'Потоки'], items: ['sessions', 'payments'] },
    { group: ['Assistance', 'Допомога'], items: ['agents', 'audit'] },
  ],
  access_manager: [
    { group: null, items: ['overview'] },
    { group: ['Agreements', 'Договори'], items: ['contracts', 'tariffs'] },
    { group: ['Access', 'Доступ'], items: ['people', 'requests', 'audit'] },
    { group: ['Group', 'Група'], items: ['units'] },
  ],
  checkout_designer: [
    { group: null, items: ['overview'] },
    { group: ['Pay page', 'Сторінка оплати'], items: ['paypages', 'sessions'] },
  ],
  integrator: [
    { group: null, items: ['overview'] },
    { group: ['Integration', 'Інтеграція'], items: ['connectors', 'keys', 'webhooks', 'logs', 'events', 'sandbox'] },
    { group: ['Flows', 'Потоки'], items: ['orders', 'sessions'] },
    { group: ['Assistance', 'Допомога'], items: ['agents'] },
  ],
  auditor: [
    { group: null, items: ['overview'] },
    { group: ['Read only', 'Лише перегляд'], items: ['units', 'costs', 'settlements', 'sessions', 'payments', 'audit'] },
  ],
};

/** The menu of a role on a stand. */
export function menuOf(stand: StandId, role: PspRole): Menu {
  return (stand === 'retail' ? retailMenus[role] : undefined) ?? menus[role];
}

/** The PSP's menus — the platform assembled as a PSP that holds its merchants' money. */
export const menus: Record<PspRole, Menu> = {
  operator: [
    { group: null, items: ['overview'] },
    { group: ['Flows', 'Потоки'], items: ['orders', 'invoices', 'sessions', 'payments'] },
    { group: ['After the mouth', 'Після гирла'], items: ['disputes', 'payouts', 'ledger'] },
    { group: ['Assistance', 'Допомога'], items: ['agents'] },
  ],
  hierarchy_admin: [
    { group: null, items: ['overview'] },
    { group: ['Hierarchy', 'Ієрархія'], items: ['units', 'policies', 'rules', 'routes'] },
    { group: ['Flows', 'Потоки'], items: ['orders', 'invoices', 'sessions', 'payments', 'payouts', 'ledger'] },
    { group: ['Compliance', 'Комплаєнс'], items: ['reviews', 'alerts', 'onboarding'] },
    { group: ['Access', 'Доступ'], items: ['contracts', 'tariffs', 'people', 'requests', 'audit'] },
    { group: ['Pay pages and integration', 'Оплата й інтеграція'], items: ['paypages', 'keys', 'webhooks', 'logs', 'events'] },
    { group: ['Assistance', 'Допомога'], items: ['agents'] },
  ],
  compliance_officer: [
    { group: null, items: ['overview'] },
    { group: ['Financial monitoring', 'Фінмоніторинг'], items: ['reviews', 'alerts', 'onboarding', 'rules'] },
    { group: ['Flows', 'Потоки'], items: ['sessions', 'payments'] },
    { group: ['Assistance', 'Допомога'], items: ['agents', 'audit'] },
  ],
  access_manager: [
    { group: null, items: ['overview'] },
    { group: ['Contracts', 'Договори'], items: ['contracts', 'tariffs'] },
    { group: ['Access', 'Доступ'], items: ['people', 'requests', 'audit'] },
    { group: ['Hierarchy', 'Ієрархія'], items: ['units'] },
  ],
  checkout_designer: [
    { group: null, items: ['overview'] },
    { group: ['Pay page', 'Сторінка оплати'], items: ['paypages', 'sessions'] },
  ],
  integrator: [
    { group: null, items: ['overview'] },
    { group: ['Integration', 'Інтеграція'], items: ['keys', 'webhooks', 'logs', 'events', 'sandbox'] },
    { group: ['Flows', 'Потоки'], items: ['orders', 'sessions'] },
    { group: ['Assistance', 'Допомога'], items: ['agents'] },
  ],
  merchant_owner: [
    { group: null, items: ['overview'] },
    { group: ['Flows', 'Потоки'], items: ['orders', 'invoices', 'payments', 'payouts'] },
    { group: ['Business', 'Бізнес'], items: ['contracts', 'agents'] },
  ],
  auditor: [
    { group: null, items: ['overview'] },
    { group: ['Read only', 'Лише перегляд'], items: ['units', 'sessions', 'payments', 'ledger', 'audit', 'events'] },
  ],
  payments_manager: [
    { group: null, items: ['overview'] },
    { group: ['Routing and costs', 'Маршрутизація і витрати'], items: ['routes', 'costs'] },
    { group: ['Flows', 'Потоки'], items: ['sessions', 'payments'] },
  ],
  finance_controller: [
    { group: null, items: ['overview'] },
    { group: ['Money', 'Гроші'], items: ['payouts', 'ledger', 'costs'] },
    { group: ['Flows', 'Потоки'], items: ['payments', 'disputes'] },
  ],
};
