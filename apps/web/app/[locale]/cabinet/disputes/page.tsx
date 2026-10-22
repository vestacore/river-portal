import { pickText } from '@river/i18n';
import type { DisputeOpened } from '@river/psp-facts';
import { disputeReasonLabels, type DisputeLine, type PaymentView } from '@river/psp-payment';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { InsightCard } from '@/components/cabinet/InsightCard';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { ActionTable } from '@/components/cabinet/integration/ActionTable';
import type { Column } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Flash } from '@/components/panels/Flash';
import { Metric } from '@/components/panels/Metric';
import { Panel } from '@/components/panels/Panel';
import type { Tone } from '@/components/panels/Value';
import { evidenceAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { count, money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { scoped } from '@/lib/scoped';
import { matches, readQuery, sortAndPage } from '@/lib/table';

const day = 86_400_000;
type Row = { p: PaymentView; d: DisputeLine; left: number };

/**
 * Every dispute of the payments within reach: the scheme holds the amount from the merchant until it
 * decides. An open one waits for evidence before its deadline; the Dispute clerk gathers what the river
 * already holds — the receipt, the 3-D Secure result, the delivery.
 */
export default async function Disputes({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'disputes.respond');
  const { t } = c;
  const back = c.link(`/disputes${query.unit ? `?unit=${query.unit}` : ''}`);
  const now = Date.parse(c.now);
  const reasons = Object.fromEntries(Object.entries(disputeReasonLabels).map(([k, v]) => [k, pickText(v, locale)])) as Record<DisputeOpened['reason'], string>;
  const statuses: Record<DisputeLine['status'], [string, Tone]> = {
    open: [t('open', 'відкрито'), 'warning'], evidenced: [t('evidence submitted', 'докази подано'), 'info'], won: [t('won', 'виграно'), 'success'], lost: [t('lost', 'програно'), 'danger'],
  };
  const all: Row[] = scoped(c.w, c.visible).payments.flatMap((p) => p.disputes.map((d) => ({ p, d, left: Math.ceil((Date.parse(d.respondBy) - now) / day) })))
    .sort((a, b) => Number(a.d.status !== 'open') - Number(b.d.status !== 'open') || (a.d.status === 'open' ? a.d.respondBy.localeCompare(b.d.respondBy) : b.d.openedAt.localeCompare(a.d.openedAt)));
  const rows = all.filter((r) => (!query.status || r.d.status === query.status) && matches(query.q, r.d.disputeId, r.p.paymentId, r.p.orderId, c.unitName(r.p.unitId), reasons[r.d.reason as DisputeOpened['reason']] ?? r.d.reason));
  const leftText = (n: number) => (n > 1 ? t(`${n} days left`, `лишилося днів: ${n}`) : n === 1 ? t('1 day left', 'лишився 1 день') : n === 0 ? t('due today', 'строк сьогодні') : t(`${-n} days overdue`, `прострочено днів: ${-n}`));
  const columns: Column<Row>[] = [
    { key: 'dispute', label: t('Dispute', 'Спір'), cell: (r) => ({ kind: 'mono', value: r.d.disputeId, href: c.link(`/payments/${r.p.paymentId}`) }), sort: (r) => r.d.disputeId },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (r) => ({ kind: 'unit', name: c.unitName(r.p.unitId), sub: r.p.acquirer }), sort: (r) => c.unitName(r.p.unitId) },
    { key: 'reason', label: t('Reason', 'Причина'), cell: (r) => ({ kind: 'text', value: reasons[r.d.reason as DisputeOpened['reason']] ?? r.d.reason }), sort: (r) => r.d.reason },
    { key: 'amount', label: t('Amount', 'Сума'), align: 'end', cell: (r) => ({ kind: 'money', minor: r.d.amountMinor, currency: r.p.currency }), sort: (r) => r.d.amountMinor },
    { key: 'respondBy', label: t('Respond by', 'Відповісти до'), cell: (r) => ({ kind: 'date', iso: r.d.respondBy }), sort: (r) => r.d.respondBy },
    { key: 'left', label: t('Time left', 'Залишок часу'), cell: (r) => (r.d.status === 'open' ? { kind: 'status', label: leftText(r.left), tone: r.left < 3 ? 'danger' : r.left < 7 ? 'warning' : 'neutral' } : { kind: 'empty' }), sort: (r) => (r.d.status === 'open' ? r.left : 9_999) },
    { key: 'status', label: t('Status', 'Статус'), cell: (r) => ({ kind: 'status', label: statuses[r.d.status][0], tone: statuses[r.d.status][1] }), sort: (r) => r.d.status },
  ];
  const page = sortAndPage(rows, columns, query);
  const open = all.filter((r) => r.d.status === 'open');
  const atStake = [...new Set(open.map((r) => r.p.currency))].map((cur) => money(open.filter((r) => r.p.currency === cur).reduce((s, r) => s + r.d.amountMinor, 0), cur, locale));
  const insights = c.w.insights.filter((i) => i.agent === 'clerk' && c.visible.has(i.unitId))
    .sort((a, b) => Number(a.status !== 'open') - Number(b.status !== 'open') || b.at.localeCompare(a.at)).slice(0, 6);
  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;
  return (
    <>
      <CabinetHead kicker={t('After the mouth', 'Після гирла')} title={t('Disputes', 'Спори')}
        lead={t('When a payer’s bank disputes a payment, the scheme holds the amount from the merchant until it decides. Evidence sent before the deadline is the merchant’s answer; a won dispute releases the hold, a lost one takes the amount back from the shares that received it.', 'Коли банк платника оскаржує платіж, платіжна система утримує суму з мерчанта до свого рішення. Докази, подані до строку, — відповідь мерчанта; виграний спір знімає утримання, програний забирає суму з тих часток, що її отримали.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t('Open', 'Відкриті')} value={count(open.length, locale)} tone={open.length ? 'warning' : 'success'} note={atStake.length ? `${t('at stake', 'під загрозою')} ${atStake.join(' + ')}` : t('nothing waits for evidence', 'ніщо не чекає доказів')} />
        <Metric label={t('Due within 3 days', 'Строк до 3 днів')} value={count(open.filter((r) => r.left < 3).length, locale)} tone={open.some((r) => r.left < 3) ? 'danger' : 'success'} note={t('evidence first', 'спершу докази')} />
        <Metric label={t('Waiting for the scheme', 'Чекають рішення системи')} value={count(all.filter((r) => r.d.status === 'evidenced').length, locale)} note={t('evidence submitted', 'докази подано')} />
        <Metric label={t('Won · lost', 'Виграно · програно')} value={`${count(all.filter((r) => r.d.status === 'won').length, locale)} · ${count(all.filter((r) => r.d.status === 'lost').length, locale)}`} note={t('decided by the schemes', 'рішення платіжних систем')} />
      </div>
      <FilterBar locale={locale} query={query} groups={[
        { param: 'status', label: t('Status', 'Статус'), options: (['open', 'evidenced', 'won', 'lost'] as const).map((s) => ({ value: s, label: statuses[s][0], count: all.filter((r) => r.d.status === s).length })).filter((o) => o.count > 0) },
      ]} />
      <Panel flush>
        <div className="px-1">
          <ActionTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query}
            empty={t('No disputes in this scope.', 'У цих межах спорів немає.')}
            trailing={{ label: t('Answer', 'Відповідь'), align: 'end', render: (r) => (r.d.status === 'open' && c.may('disputes.respond', r.p.unitId) ? (
              <form action={evidenceAction} className="flex items-center justify-end gap-2">
                {hidden('paymentId', r.p.paymentId)}{hidden('disputeId', r.d.disputeId)}{hidden('back', back)}
                <label className="sr-only" htmlFor={`docs-${r.d.disputeId}`}>{t('Documents', 'Документів')}</label>
                <input id={`docs-${r.d.disputeId}`} name="documents" type="number" min={1} max={20} defaultValue={3} title={t('Documents in the evidence pack', 'Документів у пакеті доказів')} className="w-14 border border-graphite/30 bg-paper px-2 py-1.5 text-sm" />
                <button type="submit" aria-label={`${t('Submit evidence', 'Подати докази')} · ${r.d.disputeId}`} className="chamfer whitespace-nowrap px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Submit evidence', 'Подати докази')}</button>
              </form>
            ) : null) }} />
        </div>
      </Panel>
      <Panel title={t('What the Dispute clerk gathered', 'Що зібрав секретар спорів')} className="mt-6" note={t('Open disputes due within a week, with the evidence the platform’s records already hold: the order, picking, delivery, 3-D Secure.', 'Відкриті спори зі строком до тижня — з доказами, які вже є в записах платформи: замовлення, комплектація, доставка, 3-D Secure.')}>
        {insights.length === 0 ? <p className="text-ink-500">{t('Nothing to raise: no open dispute in your reach is due within a week.', 'Нічого нагального: жоден відкритий спір у ваших межах не має строку до тижня.')}</p> : (
          <div className="space-y-3">{insights.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
        )}
      </Panel>
    </>
  );
}
