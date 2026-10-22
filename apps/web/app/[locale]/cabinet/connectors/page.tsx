import Link from 'next/link';
import { pickText } from '@river/i18n';
import { reconcileSettlements } from '@river/psp-runtime';
import { reconciliationStatusLabels, type Reconciliation, type ReconciliationStatus, type SettlementView } from '@river/psp-settlement';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { InsightCard } from '@/components/cabinet/InsightCard';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { SystemPanel } from '@/components/cabinet/connections/SystemPanel';
import { dataFlows } from '@/components/cabinet/connections/dataFlows';
import { providerName } from '@/components/cabinet/connections/providerName';
import { providerRows } from '@/components/cabinet/connections/providerRows';
import { railLabels } from '@/components/cabinet/connections/railLabels';
import { systemsOf } from '@/components/cabinet/connections/systemsOf';
import { termsText } from '@/components/cabinet/connections/termsText';
import { DataTable, type Column } from '@/components/panels/DataTable';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Metric } from '@/components/panels/Metric';
import { Panel } from '@/components/panels/Panel';
import { Status, Value, type Tone } from '@/components/panels/Value';
import { cabinet } from '@/lib/cabinet';
import { ago, count, day as dayOf, percent } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';

const day = 86_400_000;

const reconciliationTone: Record<ReconciliationStatus, Tone> = {
  not_reported: 'danger', not_credited: 'danger', short_credit: 'danger', fee_difference: 'warning', gross_difference: 'warning',
  resolved: 'neutral', awaiting_report: 'info', awaiting_credit: 'info', matched: 'success',
};

/**
 * The connections of an assembly. On the retail stand: the group's own systems — the order system, the
 * bonus system, accounting and analytics — with what each exchanges with the platform, the keys and
 * endpoints it uses and how it did in the last day; the banks and providers with the terms in force,
 * their approval and their latest settlement report; the data of one order step by step; and what the
 * Integration copilot proposes. On the PSP stand the same, for its merchants' systems and its providers.
 */
export default async function Connectors({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'flows.read');
  const { t } = c;
  const retail = c.stand === 'retail';
  const can = { keys: c.may('keys.manage', c.actor.unitId), webhooks: c.may('webhooks.manage', c.actor.unitId), logs: c.may('logs.read', c.actor.unitId) };
  const canTerms = c.may('contracts.read', c.actor.unitId);
  const canSettlements = c.may('payouts.read', c.actor.unitId);
  const back = c.link(`/connectors${query.unit ? `?unit=${query.unit}` : ''}`);
  const systems = systemsOf(c.w, c.visible, c.now);
  const seen = systems.filter((s) => s.health.state !== 'unseen');
  const failing = seen.filter((s) => s.health.state === 'failing');
  const working = seen.filter((s) => s.health.state === 'working' || s.health.state === 'quiet').length;
  const degraded = seen.filter((s) => s.health.state === 'degraded').length;
  const providers = providerRows(c.w, c.visible, c.now);
  const proposals = c.w.insights.filter((i) => i.agent === 'copilot' && i.status === 'open' && c.visible.has(i.unitId)).sort((a, b) => b.at.localeCompare(a.at));
  const linkClass = 'text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700';
  const more = (path: string, label: string) => <Link href={c.link(path)} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{label} →</Link>;
  const currencyOf = (unitId: string) => c.w.units.find((u) => u.id === unitId)?.currency ?? 'UAH';

  // The bonus system pays part of a basket: what it paid in the last 30 days, and its daily batches.
  const since30 = new Date(Date.parse(c.now) - 30 * day).toISOString();
  const points = [...c.w.views.payments.values()].filter((p) => p.instrument === 'bonus_points' && c.visible.has(p.unitId) && p.capturedAt !== null && p.capturedAt >= since30);
  const pointsMinor = points.reduce((s, p) => s + p.capturedMinor, 0);
  const returnedMinor = points.reduce((s, p) => s + p.refundedMinor, 0);
  const batches = retail ? reconcileSettlements(c.w, c.now).filter((r) => r.view.channel === 'loyalty' && c.visible.has(r.view.storeId ?? r.view.merchantId)).slice(0, 5) : [];
  const batchColumns: Column<{ view: SettlementView; reconciliation: Reconciliation }>[] = [
    { key: 'date', label: t('Business day', 'Операційний день'), cell: (r) => ({ kind: 'date', iso: `${r.view.businessDate}T12:00:00.000Z` }) },
    { key: 'count', label: t('Payments', 'Оплати'), align: 'end', cell: (r) => ({ kind: 'count', n: r.view.reported?.count ?? r.view.sales?.count ?? 0 }) },
    { key: 'gross', label: t('Points', 'Бали'), align: 'end', cell: (r) => ({ kind: 'money', minor: r.view.reported?.grossMinor ?? r.view.sales?.grossMinor ?? 0, currency: r.view.currency }) },
    { key: 'net', label: t('Net', 'Нетто'), align: 'end', cell: (r) => (r.view.reported ? { kind: 'money', minor: r.view.reported.netMinor, currency: r.view.currency, muted: true } : { kind: 'empty' }) },
    { key: 'status', label: t('Reconciliation', 'Звірка'), cell: (r) => ({ kind: 'status', label: pickText(reconciliationStatusLabels[r.reconciliation.status], locale), tone: reconciliationTone[r.reconciliation.status] }) },
  ];
  const bonusExtras = (
    <div className="mt-4 border-t border-graphite/15 pt-3">
      <p className="annot text-[0.6rem] text-ink-500">{t('Paid with bonus points, last 30 days', 'Сплачено бонусними балами, останні 30 днів')}</p>
      <div className="mt-2"><FieldGrid locale={locale} columns={3} fields={[
        { label: t('Payments with points', 'Оплати балами'), cell: { kind: 'count', n: points.length } },
        { label: t('Points redeemed', 'Списано балів'), cell: { kind: 'money', minor: pointsMinor, currency: 'UAH' } },
        { label: t('Returned on refunds', 'Повернено на баланс після повернень'), cell: { kind: 'money', minor: returnedMinor, currency: 'UAH', muted: true } },
      ]} /></div>
      <p className="mt-2 text-[0.8rem] text-ink-500">{t('One point is worth UAH 1. Points pay part of a basket; the rest is paid by card or another way.', 'Один бал дорівнює 1 ₴. Бали сплачують частину кошика; решту — карткою чи іншим способом.')}</p>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="annot text-[0.6rem] text-ink-500">{t('Its settlement batches', 'Її пакети розрахунків')}</p>
        {canSettlements ? more('/settlements?channel=loyalty', t('All batches of points', 'Усі пакети балів')) : null}
      </div>
      <p className="mt-1 text-[0.8rem] text-ink-500">{t('The bonus system reports the points redeemed each day. The net is zero: points are not money, so no bank credits anything.', 'Бонусна система щодня звітує про списані бали. Нетто — нуль: бали не є грошима, тож банк нічого не зараховує.')}</p>
      <div className="mt-2"><DataTable columns={batchColumns} rows={batches} locale={locale} query={{}} link={canSettlements ? (r) => c.link(`/settlements/${r.view.batchId}`) : undefined} empty={t('No batch of points in your reach yet.', 'У ваших межах ще немає пакетів балів.')} /></div>
    </div>
  );

  const lead = retail
    ? t('What the platform exchanges with the group’s own systems and with its banks, and how each connection is doing. The platform holds no money and replaces none of these systems.', 'Що платформа передає власним системам групи та її банкам і що отримує від них — і як працює кожне підключення. Платформа не тримає коштів і не замінює жодної з цих систем.')
    : t('What the platform exchanges with its merchants’ systems and with its providers, and how each connection is doing.', 'Що платформа передає системам своїх мерчантів і провайдерам та що отримує від них — і як працює кожне підключення.');
  const statement = retail
    ? t('The platform does not replace the order system, the bonus system or the accounting system: it joins them to the banks and carries the payment side of each order. It does not process payments at the stores’ tills — those go from a bank’s terminal to the bank, and the platform only reconciles their settlements. The banks settle to the group’s own accounts; cash forecasting stays in the ERP.', 'Платформа не замінює систему замовлень, бонусну систему чи облікову систему: вона з’єднує їх із банками й веде платіжну частину кожного замовлення. Платежі на касах магазинів вона не обробляє — вони йдуть із термінала банку до банку, а платформа лише звіряє їхні розрахунки. Банки зараховують кошти на власні рахунки групи; прогнозування грошових потоків лишається в ERP.')
    : t('In this assembly the platform holds the merchants’ money: the providers settle to it, and it pays every share out by schedule.', 'У цій збірці платформа тримає кошти мерчантів: провайдери розраховуються з нею, а вона виплачує кожну частку за графіком.');

  return (
    <>
      <CabinetHead kicker={t('Integration', 'Інтеграція')} title={t('Connections', 'Підключення')} lead={lead}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={retail ? t('The group’s systems', 'Системи групи') : t('Connected systems', 'Підключені системи')} value={count(seen.length, locale)} note={t(`${working} working${degraded ? ` · ${degraded} with some failures` : ''}`, `працюють: ${working}${degraded ? ` · зі збоями: ${degraded}` : ''}`)} />
        <Metric label={t('Failing now', 'Збоять зараз')} value={count(failing.length, locale)} tone={failing.length ? 'danger' : 'success'} note={t('three failed deliveries in a row or more', 'три й більше невдалих доставок поспіль')} />
        <Metric label={t('Payment providers', 'Платіжні провайдери')} value={count(providers.length, locale)} note={retail ? t(`${providers.filter((p) => p.terms.length > 0).length} with terms in your reach`, `з умовами у ваших межах: ${providers.filter((p) => p.terms.length > 0).length}`) : t('the platform’s own agreements', 'власні договори платформи')} />
        <Metric label={t('Copilot proposals', 'Пропозиції помічника')} value={count(proposals.length, locale)} tone={proposals.length ? 'warning' : 'success'} note={t('waiting for a person', 'чекають рішення людини')} />
      </div>

      <section>
        <h2 className="text-[1.1rem] font-semibold text-ink-900">{retail ? t('The group’s systems', 'Системи групи') : t('Merchants’ systems', 'Системи мерчантів')}</h2>
        <p className="mt-1 max-w-3xl text-[0.88rem] text-ink-500">{retail
          ? t('The group keeps its own systems. The platform takes orders and picking from the order system, asks the bonus system for points, hands settlements to the accounting system and streams every event to analytics.', 'Група має власні системи. Платформа бере замовлення й комплектацію із системи замовлень, запитує бали в бонусної системи, передає розрахунки обліковій системі й надсилає кожну подію в аналітику.')
          : t('Each merchant’s own systems: the keys they call the platform with, and the endpoints that hear its events.', 'Власні системи кожного мерчанта: ключі, якими вони викликають платформу, і кінцеві точки, що отримують її події.')}</p>
        <div className="mt-4 grid gap-6 xl:grid-cols-2">
          {systems.length === 0 ? <p className="text-ink-500">{t('No keys or endpoints in your reach yet.', 'У ваших межах ще немає ключів чи кінцевих точок.')}</p> : systems.map((s) => (
            <SystemPanel key={s.id} system={s} w={c.w} locale={locale} now={c.now} link={c.link} unitName={c.unitName} can={can}>
              {s.definition?.provider === 'bonus-system' && (s.health.state !== 'unseen' || points.length > 0 || batches.length > 0) ? bonusExtras : null}
            </SystemPanel>
          ))}
        </div>
      </section>

      <Panel className="mt-8" title={t('The Integration copilot proposes', 'Помічник інтегратора пропонує')}
        note={t('Open proposals about the endpoints of your reach. A person decides, and the decision is recorded.', 'Відкриті пропозиції щодо кінцевих точок у ваших межах. Вирішує людина, і рішення записується.')}
        actions={more('/agents?agent=copilot', t('All its proposals', 'Усі його пропозиції'))}>
        {proposals.length === 0 ? <p className="text-ink-500">{t('Nothing to propose: every endpoint takes what it is sent.', 'Пропонувати нічого: кожна кінцева точка приймає все надіслане.')}</p> : (
          <div className="grid gap-3 lg:grid-cols-2">{proposals.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
        )}
      </Panel>

      <section className="mt-8">
        <h2 className="text-[1.1rem] font-semibold text-ink-900">{t('Payment providers', 'Платіжні провайдери')}</h2>
        <p className="mt-1 max-w-3xl text-[0.88rem] text-ink-500">{retail
          ? t('The banks and providers the group has agreements with. They settle to the group’s own accounts; the platform routes the online payments between them and reconciles every report. Nominal approval is the share of attempts a provider is expected to approve; the next column is what it approved of the attempts it carried in the last 30 days.', 'Банки й провайдери, з якими в групи є договори. Вони зараховують кошти на власні рахунки групи; платформа спрямовує між ними онлайн-платежі й звіряє кожен звіт. Номінальне схвалення — частка спроб, яку провайдер мав би схвалювати; наступна колонка — що він схвалив зі спроб, які провів за останні 30 днів.')
          : t('The acquirers and rails the platform is connected with. They settle to the platform, which pays the merchants’ shares out. Nominal approval is the share of attempts a provider is expected to approve; the next column is what it approved of the attempts it carried in the last 30 days.', 'Еквайри й платіжні рейки, з якими з’єднана платформа. Вони розраховуються з платформою, а вона виплачує частки мерчантів. Номінальне схвалення — частка спроб, яку провайдер мав би схвалювати; наступна колонка — що він схвалив зі спроб, які провів за останні 30 днів.')}</p>
        <Panel className="mt-4" flush actions={canTerms ? more('/tariffs', retail ? t('Acquiring terms', 'Умови еквайрингу') : t('Tariffs', 'Тарифи')) : undefined} title={t('Connected providers', 'Підключені провайдери')}>
          <div className="overflow-x-auto px-1">
            <table className="w-full border-collapse text-left text-[0.88rem]">
              <thead>
                <tr className="border-b border-ink-900/80">
                  {[t('Provider', 'Провайдер'), t('Rails', 'Рейки'), t('Terms in force', 'Чинні умови'), t('Nominal approval', 'Номінальне схвалення'), t('Approval, 30 days', 'Схвалення, 30 днів'), t('Latest settlement report', 'Останній звіт про розрахунки')].map((h, i) => (
                    <th key={h} scope="col" className={`annot whitespace-nowrap px-3 py-2.5 text-[0.62rem] font-normal text-ink-500 ${i === 3 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => {
                  const attempts = p.approved + p.refused;
                  const behind = p.actualBps !== null && p.nominalBps !== null && p.actualBps < p.nominalBps - 300;
                  return (
                    <tr key={p.id} className="border-b border-graphite/15 align-top hover:bg-paper-deep">
                      <td className="px-3 py-2.5"><span className="text-ink-900">{providerName(p.id, locale, c.stand)}</span><span className="annot mt-0.5 block text-[0.58rem] text-ink-500">{p.id}</span></td>
                      <td className="px-3 py-2.5"><Value locale={locale} cell={{ kind: 'tags', items: (p.provider?.rails ?? []).map((r) => ({ label: pickText(railLabels[r], locale) })) }} /></td>
                      <td className="min-w-[15rem] px-3 py-2.5">
                        {p.terms.length === 0 ? <span className="text-ink-500">{retail ? t('none in your reach', 'у ваших межах немає') : t('under the platform’s own agreement', 'за власним договором платформи')}</span> : (
                          <ul className="space-y-0.5">{p.terms.map((x) => <li key={x.id} className="text-ink-900">{canTerms ? <Link href={c.link('/tariffs')} className={linkClass}>{termsText(x, currencyOf(x.merchantId), locale)}</Link> : termsText(x, currencyOf(x.merchantId), locale)}<span className="annot block text-[0.55rem] text-ink-500">{c.unitName(x.merchantId)}</span></li>)}</ul>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">{p.nominalBps !== null ? <Value locale={locale} cell={{ kind: 'percent', bps: p.nominalBps }} /> : <Value locale={locale} cell={{ kind: 'empty' }} />}</td>
                      <td className="min-w-[10rem] px-3 py-2.5">
                        {p.actualBps === null ? <span className="text-ink-500">{t('no attempts in your reach', 'у ваших межах спроб не було')}</span> : (
                          <>
                            <Value locale={locale} cell={{ kind: 'bar', share: p.actualBps / 10_000, label: percent(p.actualBps, locale), tone: behind ? 'warning' : 'success' }} />
                            <span className="annot mt-0.5 block text-[0.55rem] text-ink-500">{t(`of ${attempts} attempts`, `зі спроб: ${attempts}`)}{behind ? ` · ${t('below the nominal', 'нижче номінального')}` : ''}</span>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {p.latest?.reported ? (
                          <>
                            {canSettlements ? <Link href={c.link(`/settlements/${p.latest.batchId}`)} className={`whitespace-nowrap tabular-nums ${linkClass}`}>{dayOf(`${p.latest.businessDate}T12:00:00.000Z`, locale)}</Link> : <span className="whitespace-nowrap tabular-nums text-ink-900">{dayOf(`${p.latest.businessDate}T12:00:00.000Z`, locale)}</span>}
                            <span className="annot mt-0.5 block text-[0.55rem] text-ink-500">{t(`reported ${ago(p.latest.reported.at, c.now, locale)}`, `звіт ${ago(p.latest.reported.at, c.now, locale)}`)} · {canSettlements ? <Link href={c.link(`/settlements?provider=${p.id}`)} className="text-river-700 hover:text-ink-900">{t(`${p.batches} batches in 30 days`, `пакетів за 30 днів: ${p.batches}`)}</Link> : t(`${p.batches} batches in 30 days`, `пакетів за 30 днів: ${p.batches}`)}</span>
                          </>
                        ) : <span className="text-ink-500">{retail ? t('no report in your reach', 'у ваших межах звітів немає') : t('settles to the platform', 'розраховується з платформою')}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <Panel className="mt-8" title={t('How the data flows', 'Як рухаються дані')}
        note={retail ? t('One online order and one day’s settlement, step by step.', 'Одне онлайн-замовлення й один день розрахунків, крок за кроком.') : t('One order, step by step.', 'Одне замовлення, крок за кроком.')}>
        <ol className="divide-y divide-graphite/15">
          {dataFlows[c.stand].map((f, i) => (
            <li key={`${i}${f.how['en-GB']}`} className="grid gap-x-4 gap-y-1 py-2.5 sm:grid-cols-[2rem_minmax(0,15rem)_minmax(0,1fr)] lg:grid-cols-[2rem_minmax(0,15rem)_minmax(0,1fr)_9rem]">
              <span className="font-mono text-[0.8rem] text-ink-300">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[0.88rem] font-semibold text-ink-900">{pickText(f.from, locale)} <span aria-hidden="true" className="text-sunrise-600">→</span><span className="sr-only"> {t('to', 'до')} </span> {pickText(f.to, locale)}</span>
              <span className="text-[0.85rem] text-ink-700">{pickText(f.what, locale)}</span>
              <span className="sm:col-start-3 lg:col-start-auto lg:text-right"><Status label={pickText(f.how, locale)} tone="info" /></span>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-l-2 border-ink-900 bg-paper-deep px-3 py-2.5 text-[0.88rem] text-ink-900">{statement}</p>
      </Panel>
    </>
  );
}
