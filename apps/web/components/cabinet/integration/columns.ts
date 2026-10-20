import { pickText } from '@river/i18n';
import { factDefinition } from '@river/psp-facts';
import { endpointHealth, type ApiKey, type ApiLogEntry, type WebhookDelivery, type WebhookEndpoint } from '@river/psp-integration';
import type { World } from '@river/psp-runtime';
import type { Column } from '@/components/panels/DataTable';
import type { Cell, Tone } from '@/components/panels/Value';
import type { Ctx } from '@/lib/columns';
import { percent } from '@/lib/format';
import { lt } from '@/lib/lt';

/**
 * The integrator's tables, declared once: endpoints with their health, the deliveries of one endpoint,
 * and the calls of the API log — the same columns on the overview and on the pages of their own.
 */
export type EndpointRow = { endpoint: WebhookEndpoint; health: ReturnType<typeof endpointHealth>; last: WebhookDelivery | null };

/** The endpoints of a reach, each with its health over the deliveries the world keeps (the last two days). */
export function endpointRows(w: World, visible: ReadonlySet<string>): EndpointRow[] {
  return w.endpoints.filter((e) => visible.has(e.unitId)).map((endpoint) => {
    const deliveries = w.deliveries.filter((d) => d.endpointId === endpoint.id);
    const last = deliveries.reduce<WebhookDelivery | null>((a, d) => (!a || d.at >= a.at ? d : a), null);
    return { endpoint, health: endpointHealth(deliveries), last };
  });
}

/** The tone of a share delivered: all but a few is well, under nine in ten is not. */
export const deliveredTone = (bps: number): Tone => (bps >= 9_900 ? 'success' : bps >= 9_000 ? 'warning' : 'danger');

/** The tone of an HTTP status: 2xx went through, 4xx was refused as asked, 5xx failed. */
export const httpTone = (status: number): Tone => (status >= 500 ? 'danger' : status >= 400 ? 'warning' : status >= 200 && status < 300 ? 'success' : 'neutral');

/** The events an endpoint hears, as tags: their names as people read them, or "all events". */
export function eventTags(ctx: Ctx, events: WebhookEndpoint['events'], max = 4): Cell {
  const t = lt(ctx.locale);
  if (events.includes('*')) return { kind: 'tags', items: [{ label: t('all events', 'усі події'), tone: 'info' }] };
  const labels = events.map((e) => pickText(factDefinition(e).label, ctx.locale));
  return { kind: 'tags', items: [...labels.slice(0, max).map((label) => ({ label })), ...(labels.length > max ? [{ label: t(`+${labels.length - max} more`, `+ще ${labels.length - max}`) }] : [])] };
}

export function endpointColumns(ctx: Ctx): Column<EndpointRow>[] {
  const t = lt(ctx.locale);
  return [
    { key: 'endpoint', label: t('Endpoint', 'Кінцева точка'), cell: (r) => ({ kind: 'link', label: r.endpoint.url.replace(/^https:\/\//, ''), href: ctx.link(`/webhooks/${r.endpoint.id}`), sub: r.endpoint.description || undefined }), sort: (r) => r.endpoint.url },
    { key: 'status', label: t('Status', 'Статус'), cell: (r) => (r.endpoint.status === 'disabled' ? { kind: 'status', label: t('disabled', 'вимкнено'), tone: 'neutral' } : r.health.failingStreak >= 3 ? { kind: 'status', label: t('failing', 'збоїть'), tone: 'danger' } : { kind: 'status', label: t('enabled', 'увімкнено'), tone: 'success' }), sort: (r) => r.endpoint.status },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (r) => ({ kind: 'unit', name: ctx.unitName(r.endpoint.unitId) }), sort: (r) => ctx.unitName(r.endpoint.unitId) },
    { key: 'events', label: t('Hears', 'Отримує'), cell: (r) => eventTags(ctx, r.endpoint.events, 3) },
    { key: 'deliveries', label: t('Deliveries', 'Доставки'), align: 'end', cell: (r) => ({ kind: 'count', n: r.health.total }), sort: (r) => r.health.total },
    { key: 'delivered', label: t('Delivered', 'Доставлено'), cell: (r) => (r.health.total ? { kind: 'bar', share: r.health.deliveredBps / 10_000, label: percent(r.health.deliveredBps, ctx.locale), tone: deliveredTone(r.health.deliveredBps) } : { kind: 'empty' }), sort: (r) => r.health.deliveredBps },
    { key: 'streak', label: t('Failing in a row', 'Збоїв поспіль'), align: 'end', cell: (r) => ({ kind: 'status', label: String(r.health.failingStreak), tone: r.health.failingStreak >= 3 ? 'danger' : r.health.failingStreak > 0 ? 'warning' : 'neutral' }), sort: (r) => r.health.failingStreak },
    { key: 'p95', label: t('p95', 'p95'), align: 'end', cell: (r) => (r.health.total ? { kind: 'text', value: `${r.health.p95Ms} ${t('ms', 'мс')}` } : { kind: 'empty' }), sort: (r) => r.health.p95Ms },
    { key: 'error', label: t('Last error', 'Остання помилка'), cell: (r) => (r.health.lastError ? { kind: 'mono', value: r.health.lastError } : { kind: 'empty' }) },
    { key: 'last', label: t('Last delivery', 'Остання доставка'), cell: (r) => ({ kind: 'ago', iso: r.last?.at ?? null, now: ctx.now }), sort: (r) => r.last?.at ?? '' },
  ];
}

const deliveryTone: Record<WebhookDelivery['status'], Tone> = { delivered: 'success', failed: 'danger', pending: 'warning' };

export function deliveryColumns(ctx: Ctx): Column<WebhookDelivery>[] {
  const t = lt(ctx.locale);
  const status: Record<WebhookDelivery['status'], string> = { delivered: t('delivered', 'доставлено'), failed: t('failed', 'не доставлено'), pending: t('pending', 'очікує') };
  return [
    { key: 'at', label: t('Sent', 'Надіслано'), cell: (d) => ({ kind: 'datetime', iso: d.at }), sort: (d) => d.at },
    { key: 'type', label: t('Event', 'Подія'), cell: (d) => ({ kind: 'text', value: pickText(factDefinition(d.type).label, ctx.locale), sub: d.eventId.startsWith('evt_test_') ? t('test event', 'тестова подія') : d.type }), sort: (d) => d.type },
    { key: 'event', label: t('Event id', 'Id події'), cell: (d) => ({ kind: 'mono', value: d.eventId }) },
    { key: 'attempt', label: t('Attempt', 'Спроба'), align: 'end', cell: (d) => ({ kind: 'count', n: d.attempt }), sort: (d) => d.attempt },
    { key: 'status', label: t('Status', 'Статус'), cell: (d) => ({ kind: 'status', label: status[d.status], tone: deliveryTone[d.status] }), sort: (d) => d.status },
    { key: 'http', label: 'HTTP', align: 'end', cell: (d) => (d.httpStatus === null ? { kind: 'empty' } : { kind: 'mono', value: String(d.httpStatus) }), sort: (d) => d.httpStatus ?? 0 },
    { key: 'ms', label: t('Time', 'Час'), align: 'end', cell: (d) => ({ kind: 'text', value: `${d.durationMs} ${t('ms', 'мс')}` }), sort: (d) => d.durationMs },
    { key: 'error', label: t('Error', 'Помилка'), cell: (d) => (d.error ? { kind: 'mono', value: d.error } : { kind: 'empty' }) },
    { key: 'retry', label: t('Next retry', 'Наступний повтор'), cell: (d) => ({ kind: 'datetime', iso: d.nextRetryAt }), sort: (d) => d.nextRetryAt ?? '' },
  ];
}

export function apiLogColumns(ctx: Ctx, keys: readonly ApiKey[]): Column<ApiLogEntry>[] {
  const t = lt(ctx.locale);
  const keyOf = new Map(keys.map((k) => [k.id, k]));
  return [
    { key: 'at', label: t('When', 'Коли'), cell: (e) => ({ kind: 'datetime', iso: e.at }), sort: (e) => e.at },
    { key: 'method', label: t('Method', 'Метод'), cell: (e) => ({ kind: 'mono', value: e.method }), sort: (e) => e.method },
    { key: 'path', label: t('Path', 'Шлях'), cell: (e) => ({ kind: 'mono', value: e.path }), sort: (e) => e.path },
    { key: 'status', label: t('Status', 'Статус'), cell: (e) => ({ kind: 'status', label: String(e.status), tone: httpTone(e.status) }), sort: (e) => e.status },
    { key: 'ms', label: t('Time', 'Час'), align: 'end', cell: (e) => ({ kind: 'text', value: `${e.durationMs} ${t('ms', 'мс')}` }), sort: (e) => e.durationMs },
    { key: 'key', label: t('Key', 'Ключ'), cell: (e) => ({ kind: 'text', value: keyOf.get(e.keyId)?.label ?? e.keyId, sub: `${e.mode === 'live' ? t('live', 'бойовий') : t('test', 'тестовий')} · ${ctx.unitName(e.unitId)}` }), sort: (e) => keyOf.get(e.keyId)?.label ?? e.keyId },
    { key: 'idempotency', label: t('Idempotency key', 'Ключ ідемпотентності'), cell: (e) => (e.idempotencyKey ? { kind: 'mono', value: e.idempotencyKey } : { kind: 'empty' }) },
    { key: 'summary', label: t('Summary', 'Підсумок'), cell: (e) => ({ kind: 'text', value: e.summary }) },
  ];
}
