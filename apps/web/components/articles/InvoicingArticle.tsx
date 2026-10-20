import { pickText, type Locale } from '@river/i18n';
import { invoiceStatusAt, invoiceStatusLabels, invoiceStatuses } from '@river/psp-invoice';
import { fulfilmentLabels, orderStatusLabels, orderStatuses } from '@river/psp-order';
import { effectiveFor, type World } from '@river/psp-runtime';
import { policyValue } from '@river/psp-units';
import { money, when } from '@/lib/format';
import { lt } from '@/lib/lt';
import { FactTimeline } from '../panels/FactTimeline';
import { href } from '@/lib/href';
import { ArticleFrame, Figure, Section } from './ArticleFrame';

/** Article 06 — invoices, orders and tracking: two boundaries of their own, reminders by policy and by agent, the order's whole story. */
export function InvoicingArticle({ locale, w }: { locale: Locale; w: World }) {
  const t = lt(locale);
  const now = new Date().toISOString();
  const invoices = [...w.views.invoices.values()];
  const orders = [...w.views.orders.values()];
  const overdue = invoices.filter((i) => invoiceStatusAt(i, now) === 'overdue' && i.reminders.length > 0).sort((a, b) => b.amountMinor - a.amountMinor)[0];
  const tracked = orders.filter((o) => o.fulfilment === 'delivered' && o.refundedMinor > 0).at(-1) ?? orders.filter((o) => o.fulfilment === 'delivered').at(-1);
  const units = ['ou-kvitka', 'ou-dnipro-travel', 'ou-nordlicht', 'ou-open-river'];
  return (
    <ArticleFrame locale={locale} slug="invoicing" sheet="RP-06" title={t('Invoices, orders and tracking, built in', 'Інвойси, замовлення й відстеження — вбудовані')}
      lead={t('An order says what is bought and how its money will flow; an invoice says how much is owed, by when, and how much is still due. Both are boundaries of their own, with their own streams and their own views — so a merchant can invoice by link, by terms or at a till, remind on a schedule, ship and track, and see every fact that touched an order on one page.', 'Замовлення каже, що купують і як потечуть гроші; інвойс — скільки належить, до коли і скільки ще до сплати. Обидва — окремі межі з власними потоками й проєкціями, тож мерчант може виставляти рахунок посиланням, на умовах чи на касі, нагадувати за розкладом, відвантажувати й відстежувати, і бачити кожен факт, що торкнувся замовлення, на одній сторінці.')}
      cta={{ label: t('Open an invoice in the cabinet', 'Відкрити інвойс у кабінеті'), path: '/demo' }}>
      <Section index="1" title={t('The order', 'Замовлення')}>
        <p>{t('An order carries its lines — each naming its seller, if it has one — its total, the payer’s handle (never a name), the split plan its unit gave it, and how its money is captured: at once, or at shipment. Its status is never set by hand; it is read from the facts:', 'Замовлення несе свої позиції — кожна називає свого продавця, якщо він є, — суму, псевдонім платника (ніколи не ім’я), план розщеплення від одиниці і спосіб списання: одразу чи при відвантаженні. Його статус ніколи не задають вручну; він читається з фактів:')} {orderStatuses.map((s) => `${pickText(orderStatusLabels[s], locale).toLowerCase()} (${orders.filter((o) => o.status === s).length})`).join(', ')}.</p>
        <p>{t('Goods move along their own line —', 'Товар рухається власною лінією —')} {(['accepted', 'shipped', 'delivered'] as const).map((f) => pickText(fulfilmentLabels[f], locale).toLowerCase()).join(' → ')} {t('— with a carrier and a tracking reference recorded when it ships.', '— з перевізником і номером відстеження, записаними при відправленні.')}</p>
      </Section>

      <Section index="2" title={t('The invoice', 'Інвойс')}>
        <p>{t('An invoice is the payable claim. Its pay link carries a key that is the payer’s only authority — only its hash is kept. It can be paid in parts where the merchant allows; it counts its views and its attempts; overdue is read from the clock, never stored. Statuses on the stand right now:', 'Інвойс — це вимога до сплати. Його платіжне посилання містить ключ — єдине повноваження платника; зберігається лише хеш. Його можна сплатити частинами, якщо мерчант дозволяє; він рахує перегляди й спроби; «прострочено» читається з годинника, а не зберігається. Статуси на стенді просто зараз:')} {invoiceStatuses.map((s) => `${pickText(invoiceStatusLabels[s], locale).toLowerCase()} (${invoices.filter((i) => invoiceStatusAt(i, now) === s).length})`).join(', ')}.</p>
        <p>{t('A checkout’s invoice — a shop, a till, a pay link — lives a day: unpaid by then, the clock withdraws it and cancels its order. An invoice sent on terms stays overdue until someone collects it.', 'Інвойс чекаута — магазину, каси, платіжного посилання — живе добу: якщо його не сплатили, годинник відкликає його й скасовує замовлення. Інвойс, надісланий на умовах, лишається простроченим, доки його не стягнуть.')}</p>
      </Section>

      <Section index="3" title={t('Reminders: by policy, proposed by an agent, sent by a person', 'Нагадування: за політикою, запропоновані агентом, надіслані людиною')}>
        <p>{t('When to remind is a policy of the unit — days before and after the due date:', 'Коли нагадувати — політика одиниці: дні до та після строку оплати:')}</p>
        <ul>{units.map((id) => <li key={id}><b>{pickText(w.units.find((u) => u.id === id)?.name, locale)}</b>: {((policyValue(effectiveFor(w, id), 'invoices.reminders') as number[]) ?? []).map((d) => (d > 0 ? `+${d}` : String(d))).join(', ')} {t('days', 'дн.')} · {t('due in', 'строк')} {String(policyValue(effectiveFor(w, id), 'invoices.dueDays'))} {t('days', 'дн.')}</li>)}</ul>
        <p>{t('The Collector watches every invoice to its due date and proposes the next reminder; a person sends it — or, where the unit allows agents to act on low-risk proposals, the policy does. Every reminder records who decided.', 'Збирач веде кожен інвойс до строку й пропонує наступне нагадування; надсилає його людина — або, де одиниця дозволяє агентам діяти за низькоризиковими пропозиціями, політика. Кожне нагадування записує, хто вирішив.')}</p>
        {overdue ? (
          <p>{t('For example, invoice', 'Наприклад, інвойс')} <b>{overdue.number}</b> {t('of', 'від')} {pickText(w.units.find((u) => u.id === overdue.unitId)?.name, locale)}, {money(overdue.amountMinor, overdue.currency, locale)}, {t('due', 'строк')} {when(overdue.dueAt, locale)}: {overdue.reminders.map((r) => `${t('reminder', 'нагадування')} ${r.step + 1} (${r.decidedBy === 'policy' ? t('by policy', 'за політикою') : pickText(w.people.find((p) => p.id === r.decidedBy)?.name, locale) || r.decidedBy})`).join(', ')}.</p>
        ) : null}
      </Section>

      {tracked ? (
        <Section index="4" title={t('Tracking: every fact that touched one order', 'Відстеження: кожен факт, що торкнувся одного замовлення')}>
          <p>{t('The order’s page in the cabinet shows its whole story, whichever stream wrote it: the order’s own facts, its invoice’s, the bridges of its sessions, its payment’s refunds and payouts. The payer has their own view through the pay link. Here is a real order of the demo:', 'Сторінка замовлення в кабінеті показує всю його історію, хоч який потік її написав: власні факти замовлення, інвойсу, мости його сесій, повернення й виплати платежу. Платник має власний погляд через платіжне посилання. Ось справжнє замовлення демо:')} <b>{tracked.reference}</b>.</p>
          <Figure caption={t('Every fact that formed the order, in order — each links to the stream it came from.', 'Кожен факт, що сформував замовлення, по порядку — кожен посилається на потік, з якого він прийшов.')}>
            <FactTimeline entries={tracked.timeline} locale={locale} link={(p) => href(locale, `/cabinet${p}`)} />
          </Figure>
        </Section>
      ) : null}
    </ArticleFrame>
  );
}
