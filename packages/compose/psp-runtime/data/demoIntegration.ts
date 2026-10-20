import type { ApiKey, WebhookEndpoint } from '@river/psp-integration';

const key = (id: string, unitId: string, label: string, mode: ApiKey['mode'], kind: ApiKey['kind'], last4: string, createdBy: string, createdAt: string): ApiKey => ({
  id, unitId, label, mode, kind, prefix: `rp_${mode}_${kind === 'secret' ? 'sk' : 'pk'}`, last4, createdAt, createdBy, lastUsedAt: null, status: 'active',
});

/** API keys of the demo. Only a prefix and the last four are kept; the full key was shown once. */
export const demoKeys: readonly ApiKey[] = [
  key('key-kvg-live', 'ou-kvitka', 'Kvitka backend (live)', 'live', 'secret', '7Q2a', 'p-oleksii', '2025-04-02T10:00:00.000Z'),
  key('key-kvg-test', 'ou-kvitka', 'Kvitka staging', 'test', 'secret', 'k91Z', 'p-oleksii', '2025-04-02T10:05:00.000Z'),
  key('key-kvg-pk', 'ou-kvitka', 'Kvitka web checkout', 'live', 'publishable', 'Pw3e', 'p-oleksii', '2025-04-02T10:07:00.000Z'),
  { ...key('key-kvg-old', 'ou-kvitka', 'Kvitka backend (replaced)', 'live', 'secret', 'Zx0d', 'p-oleksii', '2024-11-20T09:00:00.000Z'), lastUsedAt: '2025-04-02T10:30:00.000Z', status: 'revoked' },
  key('key-dtr-live', 'ou-dnipro-travel', 'Booking engine', 'live', 'secret', 'aa04', 'p-andrii', '2025-06-03T08:00:00.000Z'),
  key('key-nls-live', 'ou-nordlicht', 'Billing service', 'live', 'secret', 'Hx77', 'p-jonas', '2025-05-02T07:30:00.000Z'),
  key('key-bbk-live', 'ou-baltic-bikes', 'Shop backend', 'live', 'secret', 'b1k3', 'p-andrii', '2025-04-16T12:00:00.000Z'),
];

const hook = (id: string, unitId: string, url: string, events: WebhookEndpoint['events'], description: string, createdAt: string): WebhookEndpoint => ({
  id, unitId, url, events, status: 'enabled', secretHint: `whsec_…${id.slice(-4)}`, createdAt, description,
});

/** Webhook endpoints of the demo. Every address is under `.example`, a domain reserved for examples. */
export const demoEndpoints: readonly WebhookEndpoint[] = [
  hook('wh-kvg-orders', 'ou-kvitka', 'https://api.kvitka-market.example/webhooks/river', ['capture.Completed', 'refund.Completed', 'session.Failed', 'dispute.Opened', 'payout.Sent', 'split.Allocated'], 'Order service: marks orders paid and refunded', '2025-04-02T11:00:00.000Z'),
  hook('wh-kvg-erp', 'ou-kvitka', 'https://erp.kvitka-group.example/hooks/payments', ['payout.Sent', 'refund.Completed', 'dispute.Lost'], 'Accounting system', '2025-05-10T09:00:00.000Z'),
  hook('wh-dtr-all', 'ou-dnipro-travel', 'https://booking.dnipro-travel.example/payments/hook', ['*'], 'Booking engine, all events', '2025-06-03T08:30:00.000Z'),
  hook('wh-nls-billing', 'ou-nordlicht', 'https://billing.nordlicht.example/river', ['session.Succeeded', 'session.Failed', 'invoice.Viewed', 'refund.Completed'], 'Billing service', '2025-05-02T08:00:00.000Z'),
];
