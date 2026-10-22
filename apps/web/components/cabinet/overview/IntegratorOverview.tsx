import Link from 'next/link';
import { intlTag, type Locale } from '@river/i18n';
import type { WebhookDelivery } from '@river/psp-integration';
import type { cabinet } from '@/lib/cabinet';
import { count, percent } from '@/lib/format';
import type { Query } from '@/lib/table';
import { StackedBars } from '../../charts/StackedBars';
import { DataTable } from '../../panels/DataTable';
import { Metric } from '../../panels/Metric';
import { Panel } from '../../panels/Panel';
import { InsightCard } from '../InsightCard';
import { SystemsStrip } from '../connections/SystemsStrip';
import { systemsOf } from '../connections/systemsOf';
import { apiLogColumns, deliveredTone, endpointColumns, endpointRows } from '../integration/columns';

const hour = 3_600_000;

/**
 * The overview of the Integrator cabinet: on the retail stand first the group's connected systems at a
 * glance; then how the calls to the API and the deliveries of webhooks went in the last day, the
 * deliveries hour by hour, the endpoints' health, the latest refused calls — and what the Integration
 * copilot proposes. Everything within the profile's reach; the world keeps two days of both.
 */
export function IntegratorOverview({ c, locale, query }: { c: Awaited<ReturnType<typeof cabinet>>; locale: Locale; query: Query }) {
  const { t } = c;
  const ctx = { locale, now: c.now, unitName: c.unitName, link: c.link };
  const back = c.link(query.unit ? `?unit=${query.unit}` : '');
  const now = Date.parse(c.now);
  const since = new Date(now - 24 * hour).toISOString();
  const calls = c.w.apiLog.filter((e) => c.visible.has(e.unitId)).sort((a, b) => b.at.localeCompare(a.at));
  const dayCalls = calls.filter((e) => e.at >= since);
  const errors = dayCalls.filter((e) => e.status >= 400).length;
  const errorBps = dayCalls.length ? Math.round((errors / dayCalls.length) * 10_000) : 0;
  const endpoints = endpointRows(c.w, c.visible);
  const failing = endpoints.filter((r) => r.health.failingStreak >= 3);
  const ids = new Set(endpoints.map((r) => r.endpoint.id));
  const deliveries = c.w.deliveries.filter((d) => ids.has(d.endpointId));
  const dayDeliveries = deliveries.filter((d) => d.at >= since);
  const dayFailed = dayDeliveries.filter((d) => d.status === 'failed').length;
  const deliveredBps = dayDeliveries.length ? Math.round((dayDeliveries.filter((d) => d.status === 'delivered').length / dayDeliveries.length) * 10_000) : 10_000;
  const keys = c.w.keys.filter((k) => c.visible.has(k.unitId) && k.status === 'active');
  const top = Math.floor(now / hour) * hour;
  const hours = Array.from({ length: 48 }, (_, i) => new Date(top - (47 - i) * hour).toISOString().slice(0, 13));
  const byHour = new Map(hours.map((h) => [h, { delivered: 0, failed: 0, pending: 0 } as Record<WebhookDelivery['status'], number>]));
  for (const d of deliveries) { const row = byHour.get(d.at.slice(0, 13)); if (row) row[d.status] += 1; }
  const perHour = hours.map((h) => ({ day: h, values: byHour.get(h) ?? {} }));
  const hourLabel = (h: string) => new Intl.DateTimeFormat(intlTag(locale), { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' }).format(new Date(`${h}:00:00.000Z`));
  const refused = calls.filter((e) => e.status >= 400).slice(0, 8);
  const insights = c.w.insights.filter((i) => i.agent === 'copilot' && c.visible.has(i.unitId))
    .sort((a, b) => Number(a.status !== 'open') - Number(b.status !== 'open') || b.at.localeCompare(a.at)).slice(0, 3);
  const more = (path: string, label: string) => <Link href={c.link(path)} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{label} →</Link>;
  const systems = c.stand === 'retail' ? systemsOf(c.w, c.visible, c.now) : [];
  return (
    <div className="space-y-6">
      {systems.length > 0 ? <SystemsStrip systems={systems} locale={locale} now={c.now} link={c.link} unitName={c.unitName} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Metric label={t('API calls, 24 h', 'Виклики API, 24 год')} value={count(dayCalls.length, locale)} note={t(`${count(calls.length, locale)} in two days`, `${count(calls.length, locale)} за два дні`)} href={c.link('/logs')} />
        <Metric label={t('Error rate, 24 h', 'Частка помилок, 24 год')} value={percent(errorBps, locale)} tone={errorBps > 500 ? 'danger' : errorBps > 0 ? 'warning' : 'success'} note={t(`${errors} refused or failed`, `відхилено чи збій: ${errors}`)} href={c.link('/logs')} />
        <Metric label={t('Endpoints failing', 'Кінцеві точки зі збоями')} value={count(failing.length, locale)} tone={failing.length ? 'danger' : 'success'} note={t(`of ${endpoints.length}; three failures in a row`, `з ${endpoints.length}; три збої поспіль`)} href={c.link('/webhooks?state=failing')} />
        <Metric label={t('Deliveries, 24 h', 'Доставки, 24 год')} value={count(dayDeliveries.length, locale)} note={t(`${dayFailed} failed`, `не доставлено: ${dayFailed}`)} href={c.link('/webhooks')} />
        <Metric label={t('Delivered, 24 h', 'Доставлено, 24 год')} value={percent(deliveredBps, locale)} tone={deliveredTone(deliveredBps)} note={t('of the attempts to deliver', 'від спроб доставити')} />
        <Metric label={t('Active keys', 'Чинні ключі')} value={count(keys.length, locale)} note={t(`${keys.filter((k) => k.mode === 'live').length} live · ${keys.filter((k) => k.mode === 'test').length} test`, `бойових: ${keys.filter((k) => k.mode === 'live').length} · тестових: ${keys.filter((k) => k.mode === 'test').length}`)} href={c.link('/keys')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title={t('Deliveries per hour, last 48 hours', 'Доставки за годину, останні 48 годин')} note={t('Every attempt to deliver an event to your endpoints; a retry is an attempt of its own.', 'Кожна спроба доставити подію на ваші кінцеві точки; повтор — окрема спроба.')}>
          <StackedBars rows={perHour} dayLabel={hourLabel} unit={t('deliveries', 'доставок')} stacks={[
            { key: 'delivered', label: t('delivered', 'доставлено'), fill: 'var(--color-teal-500)' },
            { key: 'failed', label: t('failed', 'не доставлено'), fill: 'var(--color-attention-500)' },
            ...(deliveries.some((d) => d.status === 'pending') ? [{ key: 'pending', label: t('waiting for a retry', 'чекає повтору'), fill: 'var(--color-river-600)', hatch: true }] : []),
          ]} />
        </Panel>
        <Panel title={t('The Integration copilot', 'Помічник інтегратора')} actions={more('/agents', t('All proposals', 'Усі пропозиції'))}>
          {insights.length === 0 ? <p className="text-ink-500">{t('Nothing to report: every endpoint takes what it is sent.', 'Повідомляти нема про що: кожна кінцева точка приймає все надіслане.')}</p> : (
            <div className="space-y-3">{insights.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
          )}
        </Panel>
      </div>

      <Panel title={t('Endpoints and their health', 'Кінцеві точки та їхній стан')} flush actions={more('/webhooks', t('All endpoints', 'Усі кінцеві точки'))}>
        <div className="px-1"><DataTable columns={endpointColumns(ctx)} rows={endpoints} locale={locale} query={{}} link={(r) => c.link(`/webhooks/${r.endpoint.id}`)} empty={t('No endpoints yet.', 'Кінцевих точок ще немає.')} /></div>
      </Panel>

      <Panel title={t('Latest refused or failed calls', 'Останні відхилені чи збійні виклики')} flush actions={more('/logs', t('The API log', 'Журнал API'))}>
        <div className="px-1"><DataTable columns={apiLogColumns(ctx, c.w.keys)} rows={refused} locale={locale} query={{}} empty={t('No call was refused in the last two days.', 'За останні два дні жоден виклик не відхилено.')} /></div>
      </Panel>
    </div>
  );
}
