import { notFound } from 'next/navigation';
import { endpointHealth, webhookEventOf, type WebhookEvent } from '@river/psp-integration';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { InsightCard } from '@/components/cabinet/InsightCard';
import { CodeBlock, JsonBlock } from '@/components/cabinet/integration/CodeBlock';
import { EventChoice } from '@/components/cabinet/integration/EventChoice';
import { deliveredTone, deliveryColumns, eventTags } from '@/components/cabinet/integration/columns';
import { factOfEvent } from '@/components/cabinet/integration/facts';
import { DataTable } from '@/components/panels/DataTable';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { endpointAction, testEventAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { count, percent, when } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery, sortAndPage } from '@/lib/table';

const verify = [
  "import { createHmac, timingSafeEqual } from 'node:crypto';",
  '',
  '// rawBody: the bytes exactly as received, before JSON.parse.',
  'export function verifyRiverEvent(rawBody, header, secret) {',
  "  const { t, v1 } = Object.fromEntries(header.split(',').map((kv) => kv.split('=')));",
  '  if (!(Math.abs(Date.now() / 1000 - Number(t)) <= 300)) return null; // missing, or older than five minutes',
  "  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest();",
  "  const given = Buffer.from(v1 ?? '', 'hex');",
  '  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;',
  '  return JSON.parse(rawBody); // then skip it if event.id was handled before',
  '}',
].join('\n');

/**
 * One webhook endpoint: what it hears and how its deliveries went, its settings, a test event on demand,
 * the latest event exactly as its receiver got it, how to check the signature — and what the Integration
 * copilot made of it.
 */
export default async function WebhookPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'webhooks.manage');
  const { t } = c;
  const endpoint = c.w.endpoints.find((e) => e.id === id);
  if (!endpoint || !c.visible.has(endpoint.unitId)) notFound();
  const ctx = { locale, now: c.now, unitName: c.unitName, link: c.link };
  const back = c.link(`/webhooks/${id}`);
  const deliveries = c.w.deliveries.filter((d) => d.endpointId === id).sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
  const health = endpointHealth(deliveries);
  const columns = deliveryColumns(ctx);
  const page = sortAndPage(deliveries, columns, query);
  let latest: { event: WebhookEvent; at: string; deliveryId: string } | null = null;
  for (const d of deliveries) {
    if (d.status !== 'delivered') continue;
    const fact = factOfEvent(c.w, d.eventId);
    const event = fact ? webhookEventOf(fact) : null;
    if (event) { latest = { event, at: d.at, deliveryId: d.id }; break; }
  }
  const insights = c.w.insights.filter((i) => i.agent === 'copilot' && i.subject.kind === 'endpoint' && i.subject.id === id && c.visible.has(i.unitId))
    .sort((a, b) => Number(a.status !== 'open') - Number(b.status !== 'open') || b.at.localeCompare(a.at));
  const may = c.may('webhooks.manage', endpoint.unitId);
  const failing = endpoint.status === 'enabled' && health.failingStreak >= 3;
  const url = new URL(endpoint.url);
  const field = 'border border-graphite/30 bg-paper px-2 py-1.5 text-sm';
  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;
  return (
    <>
      <CabinetHead kicker={`${t('Webhook endpoint', 'Кінцева точка вебхуків')} · ${c.unitName(endpoint.unitId)}`} title={<span className="break-all font-mono text-[1.25rem]">{endpoint.url}</span>}
        lead={<span className="flex flex-wrap items-center gap-x-4 gap-y-1"><Status label={endpoint.status === 'disabled' ? t('disabled', 'вимкнено') : failing ? t('failing', 'збоїть') : t('enabled', 'увімкнено')} tone={endpoint.status === 'disabled' ? 'neutral' : failing ? 'danger' : 'success'} />{endpoint.description ? <span>{endpoint.description}</span> : null}<span className="font-mono text-[0.8rem] text-ink-500">{endpoint.id}</span></span>}
        actions={may ? (
          <form action={testEventAction}>{hidden('endpointId', id)}{hidden('back', back)}<button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-paper [--cut:6px] [--fill:var(--color-ink-900)]">{t('Send a test event', 'Надіслати тестову подію')}</button></form>
        ) : undefined} />
      <Flash query={query} locale={locale} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={t('The endpoint', 'Кінцева точка')}>
          <FieldGrid locale={locale} fields={[
            { label: t('Unit', 'Одиниця'), cell: { kind: 'unit', name: c.unitName(endpoint.unitId), sub: t('hears its whole subtree', 'отримує все її піддерево') } },
            { label: t('Created', 'Створено'), cell: { kind: 'date', iso: endpoint.createdAt } },
            { label: t('Signing secret', 'Секрет підпису'), cell: { kind: 'mono', value: endpoint.secretHint } },
            { label: t('Deliveries kept', 'Збережено доставок'), cell: { kind: 'text', value: count(health.total, locale), sub: t('the last two days', 'за останні два дні') } },
            { label: t('Delivered', 'Доставлено'), cell: health.total ? { kind: 'bar', share: health.deliveredBps / 10_000, label: percent(health.deliveredBps, locale), tone: deliveredTone(health.deliveredBps) } : { kind: 'empty' } },
            { label: t('Failing in a row', 'Збоїв поспіль'), cell: { kind: 'status', label: String(health.failingStreak), tone: health.failingStreak >= 3 ? 'danger' : health.failingStreak > 0 ? 'warning' : 'neutral' } },
            { label: t('p95 answer time', 'Час відповіді, p95'), cell: health.total ? { kind: 'text', value: `${health.p95Ms} ${t('ms', 'мс')}` } : { kind: 'empty' } },
            { label: t('Last error', 'Остання помилка'), cell: health.lastError ? { kind: 'mono', value: health.lastError } : { kind: 'empty' } },
            { label: t('Last delivery', 'Остання доставка'), cell: { kind: 'ago', iso: deliveries[0]?.at ?? null, now: c.now } },
            { label: t('Hears', 'Отримує'), cell: eventTags(ctx, endpoint.events, 20), wide: true },
          ]} />
        </Panel>
        <div className="space-y-6">
          {insights.length > 0 ? (
            <Panel title={t('What the Integration copilot saw', 'Що побачив помічник інтегратора')}>
              <div className="space-y-3">{insights.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
            </Panel>
          ) : null}
          <Panel title={t('Retries', 'Повтори')} note={t('A delivery that is not answered with 2xx is tried again: after 1, 5 and 30 minutes, 2 and 12 hours, and a day — then no more. A retry carries the same event id.', 'Доставку без відповіді 2xx повторюємо: через 1, 5 і 30 хвилин, 2 і 12 годин і через добу — далі ні. Повтор несе той самий id події.')}>
            <p className="text-[0.88rem] text-ink-700">{t('Answer 200 at once and do the work afterwards: a slow handler looks like a failing one.', 'Відповідайте 200 одразу, а роботу виконуйте потім: повільний обробник виглядає як збійний.')}</p>
          </Panel>
        </div>
      </div>
      <Panel title={t('Deliveries', 'Доставки')} note={t('Every attempt to deliver an event to this endpoint, newest first. Retries are rows of their own.', 'Кожна спроба доставити подію на цю кінцеву точку, найновіші вгорі. Повтори — окремі рядки.')} className="mt-6" flush>
        <div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} empty={t('Nothing was delivered here yet.', 'Сюди ще нічого не доставляли.')} /></div>
      </Panel>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={t('The latest event, as the receiver got it', 'Остання подія — як її отримав одержувач')}
          note={latest ? t(`Delivered ${when(latest.at, locale)} (${latest.deliveryId}). The event is the fact itself: its id names it in its stream.`, `Доставлено ${when(latest.at, locale)} (${latest.deliveryId}). Подія — це сам факт: її id називає його в потоці.`) : undefined}>
          {latest ? (
            <div className="space-y-3">
              <CodeBlock label={t('Request', 'Запит')} code={[
                `POST ${url.pathname}${url.search} HTTP/1.1`,
                `Host: ${url.host}`,
                'Content-Type: application/json',
                `River-Signature: t=${Math.floor(Date.parse(latest.at) / 1000)},v1=…`,
              ].join('\n')} />
              <JsonBlock label={t('Body', 'Тіло')} value={latest.event} locale={locale} />
            </div>
          ) : <p className="text-ink-500">{t('No event of the river was delivered here in the last two days.', 'За останні два дні сюди не доставлено жодної події ріки.')}</p>}
        </Panel>
        <Panel title={t('Checking the signature', 'Перевірка підпису')}
          note={t('Every delivery is signed with the endpoint’s secret, so your server can tell it came from the platform and was not changed on the way.', 'Кожну доставку підписано секретом кінцевої точки, тож ваш сервер може переконатися, що вона від платформи й не змінена дорогою.')}>
          <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-[0.88rem] text-ink-700">
            <li>{t('Read the header', 'Прочитайте заголовок')} <code className="font-mono text-[0.8rem] text-ink-900">River-Signature: t=&lt;unix&gt;,v1=&lt;hex&gt;</code>.</li>
            <li>{t('Compute HMAC-SHA256 with the endpoint’s secret over the timestamp, a full stop and the raw body — the bytes as received, not JSON parsed and written again.', 'Обчисліть HMAC-SHA256 із секретом кінцевої точки від мітки часу, крапки й сирого тіла — байтів, як їх отримано, а не JSON, розібраного й записаного наново.')}</li>
            <li>{t('Compare the result with v1 in constant time; reject the delivery if they differ or if the timestamp t is older than five minutes.', 'Порівняйте результат із v1 за сталий час; відхиліть доставку, якщо вони різні або якщо мітка часу t старша за п’ять хвилин.')}</li>
            <li>{t('Deduplicate on the event id: a retry carries the same id, and handling it twice must change nothing.', 'Усувайте дублікати за id події: повтор несе той самий id, і повторна обробка не має нічого змінювати.')}</li>
          </ol>
          <CodeBlock label="Node.js" code={verify} />
        </Panel>
      </div>
      {may ? (
        <Panel title={t('Settings', 'Налаштування')} className="mt-6" note={t('Only https addresses under .example are accepted in this demo.', 'У демо приймаємо лише https-адреси в домені .example.')}>
          <form action={endpointAction} className="space-y-4">
            {hidden('endpointId', id)}{hidden('unitId', endpoint.unitId)}{hidden('back', back)}
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[18rem] flex-[2] text-[0.8rem] text-ink-700">{t('Address', 'Адреса')}<input name="url" type="url" required defaultValue={endpoint.url} pattern="https://.+\.example(:\d+)?(/.*)?" className={`mt-1 block w-full font-mono ${field}`} /></label>
              <label className="min-w-[14rem] flex-1 text-[0.8rem] text-ink-700">{t('Description', 'Опис')}<input name="description" maxLength={120} defaultValue={endpoint.description} className={`mt-1 block w-full ${field}`} /></label>
              <fieldset className="flex items-center gap-4 pb-2 text-[0.85rem] text-ink-700">
                <legend className="sr-only">{t('State', 'Стан')}</legend>
                <label className="flex items-center gap-1.5"><input type="radio" name="enabled" value="1" defaultChecked={endpoint.status === 'enabled'} className="accent-ink-900" />{t('Enabled', 'Увімкнено')}</label>
                <label className="flex items-center gap-1.5"><input type="radio" name="enabled" value="0" defaultChecked={endpoint.status === 'disabled'} className="accent-ink-900" />{t('Disabled', 'Вимкнено')}</label>
              </fieldset>
            </div>
            <EventChoice locale={locale} chosen={endpoint.events} />
            <button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-paper [--cut:6px] [--fill:var(--color-ink-900)]">{t('Save', 'Зберегти')}</button>
          </form>
        </Panel>
      ) : null}
    </>
  );
}
