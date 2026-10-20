import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { EventChoice } from '@/components/cabinet/integration/EventChoice';
import { UnitSelect, unitsFor } from '@/components/cabinet/integration/UnitSelect';
import { deliveredTone, endpointColumns, endpointRows } from '@/components/cabinet/integration/columns';
import { DataTable } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Flash } from '@/components/panels/Flash';
import { Metric } from '@/components/panels/Metric';
import { Panel } from '@/components/panels/Panel';
import { endpointAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { count, percent } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { matches, readQuery, sortAndPage } from '@/lib/table';

const day = 86_400_000;

/**
 * Where the units of a reach want to hear about the river: each endpoint, the events it hears, and how its
 * deliveries have gone — the share delivered, the failures in a row, the slow ones, the last error.
 */
export default async function Webhooks({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'webhooks.manage');
  const { t } = c;
  const ctx = { locale, now: c.now, unitName: c.unitName, link: c.link };
  const back = c.link(`/webhooks${query.unit ? `?unit=${query.unit}` : ''}`);
  const all = endpointRows(c.w, c.visible);
  const state = (r: (typeof all)[number]) => (r.endpoint.status === 'disabled' ? 'disabled' : r.health.failingStreak >= 3 ? 'failing' : 'enabled');
  const rows = all.filter((r) => (!query.state || state(r) === query.state) && matches(query.q, r.endpoint.id, r.endpoint.url, r.endpoint.description, c.unitName(r.endpoint.unitId)));
  const columns = endpointColumns(ctx);
  const page = sortAndPage(rows, columns, query);
  const ids = new Set(all.map((r) => r.endpoint.id));
  const since = new Date(Date.parse(c.now) - day).toISOString();
  const recent = c.w.deliveries.filter((d) => ids.has(d.endpointId) && d.at >= since);
  const deliveredBps = recent.length ? Math.round((recent.filter((d) => d.status === 'delivered').length / recent.length) * 10_000) : 10_000;
  const units = unitsFor(c.w, c.actor.unitId, c.visible, (u) => c.may('webhooks.manage', u.id));
  const field = 'border border-graphite/30 bg-paper px-2 py-1.5 text-sm';
  const labels = { enabled: t('enabled', 'увімкнено'), failing: t('failing', 'збоїть'), disabled: t('disabled', 'вимкнено') };
  return (
    <>
      <CabinetHead kicker={t('Integration', 'Інтеграція')} title={t('Webhooks', 'Вебхуки')}
        lead={t('A webhook is a released fact: when a bridge of the river is one the catalogue releases, it goes, signed, to every endpoint that hears it — and is tried again for up to a day until it is taken.', 'Вебхук — це випущений факт: коли міст ріки належить до тих, що їх каталог випускає назовні, він іде, підписаний, на кожну кінцеву точку, яка його отримує, — і повторюється впродовж доби, доки його не приймуть.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t('Endpoints', 'Кінцеві точки')} value={count(all.length, locale)} note={t(`${all.filter((r) => r.endpoint.status === 'enabled').length} enabled`, `увімкнено: ${all.filter((r) => r.endpoint.status === 'enabled').length}`)} />
        <Metric label={t('Failing now', 'Збоять зараз')} value={count(all.filter((r) => r.health.failingStreak >= 3).length, locale)} tone={all.some((r) => r.health.failingStreak >= 3) ? 'danger' : 'success'} note={t('three or more failures in a row', 'три й більше збоїв поспіль')} />
        <Metric label={t('Deliveries, 24 h', 'Доставки, 24 год')} value={count(recent.length, locale)} note={t(`${recent.filter((d) => d.status === 'failed').length} failed`, `не доставлено: ${recent.filter((d) => d.status === 'failed').length}`)} />
        <Metric label={t('Delivered, 24 h', 'Доставлено, 24 год')} value={percent(deliveredBps, locale)} tone={deliveredTone(deliveredBps)} note={t('of the attempts to deliver', 'від спроб доставити')} />
      </div>
      <FilterBar locale={locale} query={query} groups={[
        { param: 'state', label: t('State', 'Стан'), options: (['enabled', 'failing', 'disabled'] as const).map((s) => ({ value: s, label: labels[s], count: all.filter((r) => state(r) === s).length })).filter((o) => o.count > 0) },
      ]} />
      <Panel flush><div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} link={(r) => c.link(`/webhooks/${r.endpoint.id}`)} empty={t('No endpoints in this scope yet.', 'У цих межах кінцевих точок ще немає.')} /></div></Panel>
      {units.length > 0 ? (
        <Panel title={t('Add an endpoint', 'Додати кінцеву точку')} className="mt-6"
          note={t('An endpoint set on a unit hears the facts of its whole subtree. In this demo only https addresses under .example are accepted — nothing ever leaves the stand.', 'Кінцева точка одиниці отримує факти всього її піддерева. У демо приймаємо лише https-адреси в домені .example — нічого не виходить за межі стенда.')}>
          <form action={endpointAction} className="space-y-4">
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="enabled" value="1" />
            <div className="flex flex-wrap items-end gap-3">
              <UnitSelect w={c.w} rootId={c.actor.unitId} units={units} locale={locale} label={t('Unit', 'Одиниця')} defaultValue={units.some((u) => u.id === c.focus) ? c.focus : undefined} />
              <label className="min-w-[18rem] flex-[2] text-[0.8rem] text-ink-700">{t('Address', 'Адреса')}<input name="url" type="url" required pattern="https://.+\.example(:\d+)?(/.*)?" placeholder="https://api.your-shop.example/webhooks/river" className={`mt-1 block w-full font-mono ${field}`} /></label>
              <label className="min-w-[14rem] flex-1 text-[0.8rem] text-ink-700">{t('Description', 'Опис')}<input name="description" maxLength={120} placeholder={t('Order service: marks orders paid', 'Сервіс замовлень: позначає оплачені')} className={`mt-1 block w-full ${field}`} /></label>
            </div>
            <EventChoice locale={locale} chosen={['capture.Completed', 'refund.Completed']} />
            <button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Add the endpoint', 'Додати кінцеву точку')}</button>
          </form>
        </Panel>
      ) : null}
    </>
  );
}
