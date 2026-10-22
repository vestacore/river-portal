import type { ApiKey, WebhookEndpoint } from '@river/psp-integration';

const key = (id: string, unitId: string, label: string, mode: ApiKey['mode'], kind: ApiKey['kind'], last4: string, createdAt: string): ApiKey => ({
  id, unitId, label, mode, kind, prefix: `rv_${mode}_${kind === 'secret' ? 'sk' : 'pk'}`, last4, createdAt, createdBy: 'r-yurii', lastUsedAt: null, status: 'active',
});
const hook = (id: string, unitId: string, url: string, events: WebhookEndpoint['events'], description: string, createdAt: string): WebhookEndpoint => ({
  id, unitId, url, events, status: 'enabled', secretHint: `whsec_…${id.slice(-4)}`, createdAt, description,
});

/** The group's API keys: its order system, its accounting export, its BI. Only a prefix and the last four are kept. */
export const retailKeys: readonly ApiKey[] = [
  key('key-r-oms', 'rt-online', 'Order system (live)', 'live', 'secret', 'Om5s', '2025-03-01T09:00:00.000Z'),
  key('key-r-erp', 'rt-group', 'Accounting export (live)', 'live', 'secret', 'Er9p', '2025-03-01T09:10:00.000Z'),
  key('key-r-web', 'rt-online', 'Web shop checkout', 'live', 'publishable', 'Wb2k', '2025-03-01T09:20:00.000Z'),
  key('key-r-test', 'rt-online', 'Order system (staging)', 'test', 'secret', 'Ts7q', '2025-03-01T09:30:00.000Z'),
];

/**
 * Where the group's systems hear the platform's events. The order system follows payments to pick and
 * ship; the bonus system accrues and reverses points on captures and refunds; the accounting system takes
 * settlements and credits; BI takes everything. Every address is under `.example`.
 */
export const retailEndpoints: readonly WebhookEndpoint[] = [
  hook('wh-r-oms', 'rt-online', 'https://oms.yarmarok.example/payments/events', ['authorisation.Approved', 'capture.Completed', 'session.Failed', 'refund.Completed', 'capture.Voided'], 'Order system: holds, captures, refunds', '2025-03-01T10:00:00.000Z'),
  hook('wh-r-bonus', 'rt-online', 'https://bonus.yarmarok.example/hooks/purchase', ['capture.Completed', 'refund.Completed'], 'Bonus system: accrue and reverse points', '2025-03-01T10:05:00.000Z'),
  hook('wh-r-erp', 'rt-group', 'https://erp.yarmarok.example/integration/settlements', ['settlement.Reported', 'settlement.Credited', 'refund.Completed', 'dispute.Lost'], 'Accounting system: settlements, credits, refunds', '2025-03-01T10:10:00.000Z'),
  hook('wh-r-bi', 'rt-group', 'https://bi.yarmarok.example/ingest/river', ['*'], 'Analytics: every event', '2025-05-01T10:00:00.000Z'),
];
