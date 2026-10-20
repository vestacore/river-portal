import { notFound } from 'next/navigation';
import { pickText } from '@river/i18n';
import { invoiceDueMinor, invoiceStatusAt, invoiceStatusLabels } from '@river/psp-invoice';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { DataTable } from '@/components/panels/DataTable';
import { FactTimeline } from '@/components/panels/FactTimeline';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { remindAction, voidInvoiceAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { sessionColumns } from '@/lib/columns';
import { money } from '@/lib/format';
import { href } from '@/lib/href';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';
import { invoiceTone } from '@/lib/tones';

/** One invoice: the claim and what is still due, its attempts, its reminders, its receipts — and the pay link the payer holds. */
export default async function InvoicePage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'flows.read');
  const { t } = c;
  const inv = c.w.views.invoices.get(id);
  if (!inv || !c.visible.has(inv.unitId)) notFound();
  const status = invoiceStatusAt(inv, c.now);
  const sessions = inv.sessionIds.map((x) => c.w.views.sessions.get(x)).filter((x) => x !== undefined);
  const ctx = { locale, now: c.now, unitName: c.unitName, link: c.link };
  const back = c.link(`/invoices/${id}`);
  const payKey = c.w.payKeys[id];
  const open = status !== 'paid' && status !== 'void' && status !== 'refunded' && status !== 'partially_refunded';
  const timeline = c.w.log.filter((f) => (f.payload as { invoiceId?: string }).invoiceId === id && ['invoice', 'session'].some((b) => f.stream.startsWith(b === 'invoice' ? 'inv_' : 'ps_'))).map((f) => ({ at: f.at, type: f.type, stream: f.stream, seq: f.seq }));
  return (
    <>
      <CabinetHead kicker={`${t('Invoice', 'Інвойс')} · ${c.unitName(inv.unitId)}`} title={<span className="font-mono text-[1.4rem]">{inv.number}</span>}
        lead={<span className="flex flex-wrap items-center gap-x-4"><span className="text-lg font-semibold tabular-nums text-ink-900">{money(inv.amountMinor, inv.currency, locale)}</span><Status label={pickText(invoiceStatusLabels[status], locale)} tone={invoiceTone[status]} /><span className="font-mono text-[0.8rem] text-ink-500">{inv.invoiceId}</span></span>}
        actions={open && c.may('orders.write', inv.unitId) ? (
          <div className="flex gap-2">
            <form action={remindAction}><input type="hidden" name="invoiceId" value={id} /><input type="hidden" name="back" value={back} /><button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-paper [--cut:6px] [--fill:var(--color-ink-900)]">{t('Send a reminder', 'Надіслати нагадування')}</button></form>
            {inv.paidMinor === 0 ? <form action={voidInvoiceAction}><input type="hidden" name="invoiceId" value={id} /><input type="hidden" name="back" value={back} /><button type="submit" className="annot border border-attention-500 px-3 py-2 text-attention-500 hover:bg-attention-100">{t('Void', 'Анулювати')}</button></form> : null}
          </div>
        ) : undefined} />
      <Flash query={query} locale={locale} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title={t('The invoice’s view', 'Проєкція інвойсу')}>
          <FieldGrid locale={locale} fields={[
            { label: t('Order', 'Замовлення'), cell: { kind: 'mono', value: c.w.views.orders.get(inv.orderId)?.reference ?? inv.orderId, href: c.link(`/orders/${inv.orderId}`) } },
            { label: t('Unit', 'Одиниця'), cell: { kind: 'unit', name: c.unitName(inv.unitId), href: c.link(`/units/${inv.unitId}`) } },
            { label: t('Issued', 'Виставлено'), cell: { kind: 'datetime', iso: inv.issuedAt } },
            { label: t('Due', 'Строк'), cell: { kind: 'datetime', iso: inv.dueAt } },
            { label: t('Amount', 'Сума'), cell: { kind: 'money', minor: inv.amountMinor, currency: inv.currency } },
            { label: t('Still due', 'До сплати'), cell: { kind: 'money', minor: invoiceDueMinor(inv), currency: inv.currency } },
            { label: t('Paid', 'Сплачено'), cell: { kind: 'money', minor: inv.paidMinor, currency: inv.currency } },
            { label: t('Given back', 'Повернено'), cell: { kind: 'money', minor: inv.refundedMinor, currency: inv.currency, muted: true } },
            { label: t('Parts allowed', 'Частинами'), cell: { kind: 'bool', value: inv.allowPartial, yes: t('yes', 'так'), no: t('no', 'ні') } },
            { label: t('Views', 'Переглядів'), cell: { kind: 'count', n: inv.views } },
            { label: t('Attempts', 'Спроби'), cell: { kind: 'text', value: `${inv.attempts.opened}`, sub: `${t('succeeded', 'успішних')} ${inv.attempts.succeeded} · ${t('failed', 'невдалих')} ${inv.attempts.failed} · ${t('left', 'покинутих')} ${inv.attempts.abandoned}` } },
            { label: t('Sent by', 'Надіслано'), cell: inv.sent.length ? { kind: 'tags', items: inv.sent.map((x) => ({ label: x.channel })) } : { kind: 'empty' } },
            { label: t('Pay key hash', 'Хеш ключа оплати'), cell: { kind: 'mono', value: `${inv.payKeyHash.slice(0, 16)}…` }, wide: true },
          ]} />
        </Panel>
        <div className="space-y-6">
          <Panel title={t('The pay link', 'Платіжне посилання')} note={t('The payer needs no account: the key in the link is their authority. In a real deployment it is shown once; the demo keeps it so you can pay.', 'Платнику не потрібен обліковий запис: ключ у посиланні — його повноваження. У справжньому розгортанні його показують один раз; демо зберігає, щоб ви могли сплатити.')}>
            {payKey && open ? <a href={href(locale, `/pay/${payKey}`)} className="chamfer inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-ink-900 [--cut:7px] [--fill:var(--color-sunrise-500)]">{t('Open the pay page', 'Відкрити сторінку оплати')} →</a> : <p className="text-ink-500">{t('Nothing to pay.', 'Нічого сплачувати.')}</p>}
          </Panel>
          <Panel title={t('Reminders', 'Нагадування')}>
            {inv.reminders.length === 0 ? <p className="text-ink-500">{t('None yet.', 'Поки немає.')}</p> : (
              <ul className="divide-y divide-graphite/15 text-[0.88rem]">{inv.reminders.map((r) => <li key={`${r.at}${r.step}`} className="flex justify-between gap-3 py-1.5"><span>{t('Step', 'Крок')} {r.step + 1} · {r.channel}</span><span className="text-ink-500">{c.personName(r.decidedBy)} · {r.at.slice(0, 10)}</span></li>)}</ul>
            )}
          </Panel>
        </div>
      </div>
      <Panel title={t('Attempts to pay it', 'Спроби його сплатити')} className="mt-6" flush><div className="px-1"><DataTable columns={sessionColumns(ctx)} rows={sessions} locale={locale} query={{}} link={(s) => c.link(`/sessions/${s.sessionId}`)} /></div></Panel>
      <Panel title={t('What formed it', 'Що його сформувало')} className="mt-6"><FactTimeline entries={timeline} locale={locale} link={c.link} /></Panel>
    </>
  );
}
