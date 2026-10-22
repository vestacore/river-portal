import { pickText, type Locale } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { invoiceStatusAt, invoiceStatusLabels, invoiceStatuses } from '@river/psp-invoice';
import { fulfilmentLabels, orderStatusLabels, orderStatuses } from '@river/psp-order';
import { effectiveFor } from '@river/psp-runtime';
import { policyValue } from '@river/psp-units';
import { count, money, when } from '@/lib/format';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { FactTimeline } from '../panels/FactTimeline';
import { ArticleFrame, Figure, Section, type ArticleWorlds } from './ArticleFrame';

/** Article 06 — orders and invoices: the order from the order system, the invoice and its adjustment after picking, corporate invoices and reminders, the order's whole story. */
export function InvoicingArticle({ locale, worlds }: { locale: Locale; worlds: ArticleWorlds }) {
  const t = lt(locale);
  const w = worlds.retail;
  const now = new Date().toISOString();
  const invoices = [...w.views.invoices.values()];
  const orders = [...w.views.orders.values()];
  const adjusted = invoices.filter((i) => i.originalMinor !== null && i.originalMinor !== i.amountMinor);
  const corporate = invoices.filter((i) => i.unitId === 'rt-b2b');
  const overdue = corporate.filter((i) => invoiceStatusAt(i, now) === 'overdue' && i.reminders.length > 0).sort((a, b) => b.amountMinor - a.amountMinor)[0] ?? corporate.filter((i) => i.reminders.length > 1).at(-1);
  const tracked = orders.filter((o) => o.fulfilment === 'delivered' && o.picked && o.picked.changes.length > 0).at(-1) ?? orders.filter((o) => o.fulfilment === 'delivered').at(-1);
  const collector = pickText(agentCatalogue.find((a) => a.id === 'collector')!.name, locale);
  const reminders = (policyValue(effectiveFor(w, 'rt-b2b'), 'invoices.reminders') as number[] | undefined) ?? [];
  const dueDays = String(policyValue(effectiveFor(w, 'rt-b2b'), 'invoices.dueDays') ?? '');
  return (
    <ArticleFrame locale={locale} slug="invoicing" sheet="RP-06" title={t('Orders, invoices and tracking', 'Замовлення, інвойси й відстеження')}
      lead={t('An order says what is bought and how its money is distributed; an invoice says how much is to be paid, by when, and how much is still due. Both are boundaries of their own, with their own events and views. The group’s order system stays the system of record for its orders: it creates them through the platform’s interface, reports picking and delivery, and receives every payment event back.', 'Замовлення каже, що купують і як розподіляються гроші; інвойс — скільки сплатити, до коли і скільки ще належить. Обидва — окремі межі з власними подіями й проєкціями. Система замовлень групи лишається основною для її замовлень: вона створює їх через інтерфейс платформи, повідомляє про комплектацію й доставку і отримує назад кожну подію оплати.')}
      cta={{ label: t('Open an order in the cabinet', 'Відкрити замовлення в кабінеті'), path: '/demo' }}>
      <Section index="1" title={t('The order', 'Замовлення')}>
        <p>{t('An order carries its lines — weighed goods among them — its total, the payer’s pseudonymous handle (never a name), its distribution plan and how its money is captured: at once, or after picking. Its status is never set by hand; it is read from the events:', 'Замовлення несе свої позиції — серед них ваговий товар, — суму, псевдонім платника (ніколи не ім’я), план розподілу і спосіб списання: одразу чи після комплектації. Його статус ніколи не задають вручну; він читається з подій:')} {orderStatuses.map((s) => `${pickText(orderStatusLabels[s], locale).toLowerCase()} (${count(orders.filter((o) => o.status === s).length, locale)})`).join(', ')}.</p>
        <p>{t('Goods move along their own line —', 'Товар рухається власною лінією —')} {(['accepted', 'picked', 'shipped', 'delivered'] as const).map((f) => pickText(fulfilmentLabels[f], locale).toLowerCase()).join(' → ')}. {t('Picking is reported by the order system with the lines as picked: weights, missing items, substitutes.', 'Комплектацію повідомляє система замовлень разом із позиціями, як їх скомплектовано: вага, відсутні позиції, заміни.')}</p>
      </Section>

      <Section index="2" title={t('The invoice', 'Інвойс')}>
        <p>{t('An invoice is the amount to be paid. Its pay link carries a key that is the payer’s only authority — only its hash is kept. It can be paid in parts, for instance with bonus points and a card; it counts its views and attempts; overdue is read from the clock, never stored. After picking it is adjusted to the picked amount, and the original stays in its history. Statuses on the stand now:', 'Інвойс — це сума до сплати. Його платіжне посилання містить ключ — єдине повноваження платника; зберігається лише хеш. Його можна сплатити частинами, наприклад бонусними балами й карткою; він рахує перегляди й спроби; «прострочено» читається з годинника, а не зберігається. Після комплектації інвойс коригується до суми комплектації, а початкова сума лишається в його історії. Статуси на стенді зараз:')} {invoiceStatuses.map((s) => `${pickText(invoiceStatusLabels[s], locale).toLowerCase()} (${count(invoices.filter((i) => invoiceStatusAt(i, now) === s).length, locale)})`).join(', ')}.</p>
        <p>{t(`${count(adjusted.length, locale)} invoices were adjusted after picking. An online checkout’s invoice lives a day: unpaid by then, the clock withdraws it and cancels its order. An invoice sent on terms stays overdue until it is paid.`, `${count(adjusted.length, locale)} інвойсів скориговано після комплектації. Інвойс онлайн-оплати живе добу: якщо його не сплатили, годинник відкликає його й скасовує замовлення. Інвойс, надісланий з умовами оплати, лишається простроченим, доки його не сплатять.`)}</p>
      </Section>

      <Section index="3" title={t('Corporate customers: terms and reminders', 'Корпоративні клієнти: умови й нагадування')}>
        <p>{t(`Offices and businesses order on terms: an invoice due in ${dueDays} days, paid by bank transfer, QR or card. When to remind is a policy of the unit — here ${reminders.map((d) => (d > 0 ? `+${d}` : String(d))).join(', ')} days around the due date. The ${collector} agent follows every invoice to its due date and proposes the next reminder; a person sends it, or — where the unit allows agents to act on low-risk proposals — the policy does. Every reminder records who decided.`, `Офіси й компанії замовляють з умовами оплати: інвойс зі строком ${dueDays} дн., оплата переказом, QR чи карткою. Коли нагадувати — політика одиниці: тут ${reminders.map((d) => (d > 0 ? `+${d}` : String(d))).join(', ')} дн. відносно строку. Агент «${collector}» веде кожен інвойс до строку й пропонує наступне нагадування; надсилає його людина — або, де одиниця дозволяє агентам діяти за низькоризиковими пропозиціями, політика. Кожне нагадування записує, хто вирішив.`)}</p>
        {overdue ? (
          <p>{t('For example, invoice', 'Наприклад, інвойс')} <b>{overdue.number}</b>, {money(overdue.amountMinor, overdue.currency, locale)}, {t('due', 'строк')} {when(overdue.dueAt, locale)}: {overdue.reminders.map((r) => `${t('reminder', 'нагадування')} ${r.step + 1} (${r.decidedBy === 'policy' ? t('by policy', 'за політикою') : pickText(w.people.find((p) => p.id === r.decidedBy)?.name, locale) || r.decidedBy})`).join(', ')}.</p>
        ) : null}
      </Section>

      {tracked ? (
        <Section index="4" title={t('Tracking: every event of one order', 'Відстеження: кожна подія одного замовлення')}>
          <p>{t('The order’s page in the cabinet shows its whole story, whichever stream wrote it: the order’s own events, its invoice’s, its sessions’, its payment’s capture and refunds, and the settlement batch that carried it. The payer has their own view through the pay link. A real order of the demo group:', 'Сторінка замовлення в кабінеті показує всю його історію, хоч який потік її записав: власні події замовлення, події інвойсу, сесій, списання й повернення платежу, і пакет розрахунку, що його провів. Платник має власний погляд через платіжне посилання. Справжнє замовлення демо-групи:')} <b>{tracked.reference}</b>.</p>
          <Figure caption={t('Fig. 6.1 — every event that formed the order, in order; each links to the stream it came from.', 'Рис. 6.1 — кожна подія, що сформувала замовлення, по порядку; кожна посилається на свій потік.')}>
            <FactTimeline entries={tracked.timeline} locale={locale} link={(p) => href(locale, `/cabinet${p}`)} />
          </Figure>
        </Section>
      ) : null}
    </ArticleFrame>
  );
}
