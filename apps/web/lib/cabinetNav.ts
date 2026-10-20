import type { Permission, PspRole } from '@river/psp-access';

/**
 * The sections of the cabinets. Each names the permission its page checks; each role's menu lists the
 * sections that role works with, in its own order — as the earlier portal's server-driven menus did per
 * profile. A section outside a role's menu still opens if the profile has its permission.
 */
export type SectionKey =
  | 'overview' | 'orders' | 'invoices' | 'sessions' | 'payments' | 'disputes' | 'payouts' | 'ledger'
  | 'units' | 'policies' | 'rules' | 'routes'
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
  ledger: { path: '/ledger', icon: 'scales', permission: 'payouts.read', en: 'Ledger', uk: 'Облік' },
  units: { path: '/units', icon: 'tree', permission: 'flows.read', en: 'Hierarchy', uk: 'Ієрархія' },
  policies: { path: '/policies', icon: 'layers', permission: 'policies.write', en: 'Policies', uk: 'Політики' },
  rules: { path: '/rules', icon: 'filter', permission: 'rules.write', en: 'Rules', uk: 'Правила' },
  routes: { path: '/routes', icon: 'route', permission: 'policies.write', en: 'Routes', uk: 'Маршрути' },
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
  agents: { path: '/agents', icon: 'bot', permission: null, en: 'Agent swarm', uk: 'Рій агентів' },
};

export const menus: Record<PspRole, ReadonlyArray<{ group: [string, string] | null; items: SectionKey[] }>> = {
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
};
