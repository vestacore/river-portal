import type { AgentDefinition } from '../types/Agent.ts';

const t = (en: string, uk: string) => ({ 'en-GB': en, uk });

/**
 * The swarm. In this demo each agent is a deterministic analyser standing in for a model: the same
 * projections always give the same insights, so every proposal can be checked against its evidence.
 */
export const agentCatalogue: readonly AgentDefinition[] = [
  { id: 'sentinel', glyph: 'shield', name: t('Sentinel', 'Вартовий'),
    role: t('Watches attempts for fraud: card testing, sudden amounts, mismatched countries.', 'Стежить за спробами: перебір карток, раптові суми, невідповідність країн.'),
    watches: ['session', 'payment', 'order'], proposes: ['open_alert', 'hold_payouts'], audience: ['compliance_officer', 'operator', 'hierarchy_admin'] },
  { id: 'router', glyph: 'route', name: t('Navigator', 'Штурман'),
    role: t('Replays the history of payments under each routing strategy, compares what every bank’s terms would cost, online and at the tills, and proposes a strategy, a terminal bank or an on-us clause to negotiate.', 'Відтворює історію платежів за кожною стратегією маршрутизації, порівнює, скільки коштували б умови кожного банку онлайн і на касах, і пропонує стратегію, банк терміналів чи пункт on-us для переговорів.'),
    watches: ['session', 'routes', 'costs', 'settlement'], proposes: ['change_policy', 'negotiate_terms', 'shift_route'], audience: ['payments_manager', 'hierarchy_admin', 'operator'] },
  { id: 'reconciler', glyph: 'scales', name: t('Reconciler', 'Звіряльник'),
    role: t('Reconciles every settlement batch three ways — the merchant’s records, the provider’s report, the bank’s credit — and finds fees above the terms, missing reports and missing credits.', 'Звіряє кожен пакет розрахунків трьома способами — облік мерчанта, звіт провайдера, зарахування банку — і знаходить комісії вище умов, відсутні звіти й незараховані кошти.'),
    watches: ['payment', 'settlement', 'ledger'], proposes: ['raise_claim', 'investigate_break'], audience: ['finance_controller', 'operator', 'hierarchy_admin'] },
  { id: 'collector', glyph: 'bell', name: t('Collector', 'Збирач'),
    role: t('Follows invoices to their due date and proposes reminders.', 'Веде інвойси до строку оплати і пропонує нагадування.'),
    watches: ['invoice', 'order'], proposes: ['send_reminder'], audience: ['operator', 'merchant_owner'] },
  { id: 'analyst', glyph: 'magnifier', name: t('Analyst', 'Аналітик'),
    role: t('Reads alerts and onboarding cases, drafts the narrative, proposes escalation or closure.', 'Читає сповіщення й справи онбордингу, готує опис, пропонує ескалацію чи закриття.'),
    watches: ['alerts', 'onboarding', 'payment'], proposes: ['escalate_alert', 'close_alert'], audience: ['compliance_officer'] },
  { id: 'clerk', glyph: 'folder', name: t('Dispute clerk', 'Секретар спорів'),
    role: t('Gathers evidence for disputes before the deadline: receipt, 3-D Secure, delivery.', 'Збирає докази для спорів до строку: квитанція, 3-D Secure, доставка.'),
    watches: ['payment', 'session', 'order'], proposes: ['prepare_evidence'], audience: ['operator'] },
  { id: 'copilot', glyph: 'plug', name: t('Integration copilot', 'Помічник інтегратора'),
    role: t('Reads webhook deliveries and API calls, explains failures, proposes fixes and retries.', 'Читає доставки вебхуків і виклики API, пояснює збої, пропонує виправлення й повтори.'),
    watches: ['webhooks'], proposes: ['retry_deliveries', 'fix_endpoint'], audience: ['integrator', 'hierarchy_admin'] },
  { id: 'treasurer', glyph: 'coins', name: t('Treasurer', 'Скарбник'),
    role: t('Where the platform holds the money as a PSP: forecasts payouts by entity and currency and watches reserves.', 'Де платформа тримає кошти як PSP: прогнозує виплати за юрособами й валютами та стежить за резервами.'),
    watches: ['payment', 'ledger'], proposes: ['prefund_payouts'], audience: ['hierarchy_admin', 'operator'] },
];
