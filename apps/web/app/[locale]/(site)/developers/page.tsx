import type { Metadata } from 'next';
import Link from 'next/link';
import { pickText } from '@river/i18n';
import { factCatalogue, projectionLabels } from '@river/psp-facts';
import { webhookEventOf } from '@river/psp-integration';
import { PageHead } from '@/components/site/PageHead';
import { Container } from '@/components/ui/Container';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import { world } from '@/lib/world';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: lt(resolveLocale((await params).locale))('Developers', 'Розробникам') };
}

const modules: Array<[string, string, string, string]> = [
  ['@river/psp-facts', 'vocabulary', 'The shared vocabulary: boundaries, stages, every event type with its owner and the views it forms.', 'Спільний словник: межі, стадії, кожен тип події з власником і проєкціями.'],
  ['@river/psp-order', 'boundary', 'The order: lines, picking, distribution plan, fulfilment; its view.', 'Замовлення: позиції, комплектація, план розподілу, виконання; його проєкція.'],
  ['@river/psp-invoice', 'boundary', 'The invoice: the amount to pay, its adjustment, what is due, attempts, reminders.', 'Інвойс: сума до сплати, її коригування, борг, спроби, нагадування.'],
  ['@river/psp-session', 'boundary', 'The payment session: one attempt and its events, the routing decision among them.', 'Платіжна сесія: одна спроба та її події, серед них рішення маршрутизації.'],
  ['@river/psp-payment', 'boundary', 'The payment: secured money, capture, distribution, refunds, disputes.', 'Платіж: забезпечені гроші, списання, розподіл, повернення, спори.'],
  ['@river/psp-settlement', 'boundary', 'The settlement batch: sales, the provider’s report, the bank credit, decisions; three-way reconciliation.', 'Пакет розрахунку: продажі, звіт провайдера, зарахування, рішення; трибічна звірка.'],
  ['@river/psp-units', 'assembly', 'The structure and its policies, resolved down the tree.', 'Структура та її політики, розв’язані донизу деревом.'],
  ['@river/psp-instruments', 'assembly', 'The instruments, their courses, the providers of each rail, the directory of issuers.', 'Інструменти, їх русла, провайдери кожної рейки, довідник емітентів.'],
  ['@river/psp-contracts', 'assembly', 'Agreements and their terms: acquiring costs (blended, IC++, on-us) and PSP tariffs.', 'Договори та їх умови: вартість еквайрингу (єдина ставка, IC++, on-us) і тарифи PSP.'],
  ['@river/psp-flow', 'assembly', 'The figure of an attempt: screening, routing by strategy and threshold, consent, course.', 'Фігура спроби: перевірка, маршрутизація за стратегією й порогом, згода, русло.'],
  ['@river/psp-split', 'assembly', 'Distribution plans and the allocation that always sums to the amount.', 'Плани розподілу й розподіл, що завжди дорівнює сумі.'],
  ['@river/psp-ledger', 'assembly', 'The ledger as a projection: balanced entries, clearing with each bank.', 'Облік як проєкція: збалансовані записи, розрахунки з кожним банком.'],
  ['@river/psp-risk', 'assembly', 'Scores, rules down the tree, alerts, onboarding cases.', 'Бали, правила деревом, сповіщення, справи онбордингу.'],
  ['@river/psp-access', 'assembly', 'Roles, grants scoped to units, separation of duties.', 'Ролі, доступи в межах одиниць, розподіл обов’язків.'],
  ['@river/psp-checkout', 'assembly', 'The pay page: configuration from policies, card checks, bonus points, texts.', 'Сторінка оплати: конфігурація з політик, перевірки картки, бонусні бали, тексти.'],
  ['@river/psp-integration', 'assembly', 'Keys, webhook endpoints and deliveries, the API log.', 'Ключі, вебхуки й доставки, журнал API.'],
  ['@river/psp-agents', 'assembly', 'The agents: findings and proposals, never events.', 'Агенти: висновки й пропозиції, ніколи не події.'],
  ['@river/psp-views', 'surface', 'Readings for cabinets: the river of a session, figures, series.', 'Читання для кабінетів: ріка сесії, показники, ряди.'],
  ['@river/psp-runtime', 'compose', 'The stands wired: the one writer, stand-in providers, commands, readings of routing and reconciliation, the clock.', 'Стенди в зборі: єдиний писач, провайдери-імітатори, команди, розрахунки маршрутизації й звірки, годинник.'],
];

/**
 * For developers: the entities and the shape of their views (real objects of the retail stand, trimmed),
 * the calls an order system makes — an order, its picking — webhooks as released events, and the
 * modules the platform is assembled from, each behind one gate.
 */
export default async function Developers({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = lt(locale);
  const w = world('retail');
  const payment = [...w.views.payments.values()].findLast((p) => p.status === 'captured' && p.instrument === 'card' && p.capturedMinor < p.amountMinor && p.payouts.some((x) => x.batchId.startsWith('stl_')));
  const session = payment ? w.views.sessions.get(payment.sessionId) : undefined;
  const invoice = payment ? w.views.invoices.get(payment.invoiceId) : undefined;
  const order = payment ? w.views.orders.get(payment.orderId) : undefined;
  const trim = (o: unknown, keep: string[]) => JSON.stringify(Object.fromEntries(Object.entries(o as Record<string, unknown>).filter(([k]) => keep.includes(k))), null, 2);
  const captureFact = payment ? (w.streams.get(payment.sessionId) ?? []).find((f) => f.type === 'capture.Completed') : undefined;
  const event = captureFact ? webhookEventOf(captureFact) : null;
  const batchId = payment?.payouts.find((x) => x.batchId.startsWith('stl_'))?.batchId;
  const reportFact = batchId ? (w.streams.get(batchId) ?? []).find((f) => f.type === 'settlement.Reported') : undefined;
  const report = reportFact ? webhookEventOf(reportFact) : null;
  const code = 'max-w-full overflow-x-auto bg-ink-900 p-4 font-mono text-[0.76rem] leading-relaxed text-paper';
  return (
    <>
      <PageHead sheet={`${t('Sheet', 'Аркуш')} RP-10`} title={t('The entities, and the events they release', 'Сутності та події, які вони випускають')} lead={t('The order system creates an order and its invoice; the payer pays through the pay link; the order system reports picking and the platform captures; the bank’s settlement follows. Every step comes back as an event. The objects below are real views of the retail demo stand, trimmed.', 'Система замовлень створює замовлення та інвойс; платник сплачує за платіжним посиланням; система замовлень повідомляє про комплектацію, і платформа списує кошти; далі — розрахунок банку. Кожен крок повертається як подія. Об’єкти нижче — справжні проєкції роздрібного демо-стенда, скорочені.')} />
      <Container className="space-y-14 py-14">
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-ink-900">{t('Create an order, report its picking', 'Створіть замовлення, повідомте про комплектацію')}</h2>
            <p className="mt-3 text-ink-700">{t('The order carries its lines — weighed goods with their estimated weight — and takes its capture mode and distribution plan from the unit’s policies: on the website, capture after picking. The response holds the pay link; its key is the payer’s only authority and is shown once. After picking, the order system sends the lines as picked; the invoice is adjusted and the platform captures the picked amount, less any bonus points.', 'Замовлення містить позиції — ваговий товар з орієнтовною вагою — і бере спосіб списання та план розподілу з політик одиниці: на сайті — списання після комплектації. Відповідь містить платіжне посилання; його ключ — єдине повноваження платника, і показується він один раз. Після комплектації система замовлень надсилає позиції, як їх скомплектовано; інвойс коригується, і платформа списує суму комплектації за вирахуванням бонусних балів.')}</p>
            <pre className={`mt-4 ${code}`}>{`POST /v1/orders
Authorization: Bearer rv_live_sk_…
Idempotency-Key: oms-YRO-2026-02512

{
  "unit": "rt-web",
  "reference": "YRO-2026-02512",
  "currency": "UAH",
  "lines": [
    { "sku": "CHK-FIL", "quantity": 1, "unitMinor": 23400, "weighed": true },
    { "sku": "MLK-25",  "quantity": 2, "unitMinor": 4900 }
  ],
  "payer": "py_7f3a"
}

201 Created
{ "orderId": "ord_…", "invoiceId": "inv_…", "payLink": "https://pay.example/uk/pay/…" }

POST /v1/orders/ord_…/picking
{
  "lines": [
    { "sku": "CHK-FIL", "quantity": 1, "unitMinor": 21870 },
    { "sku": "MLK-25",  "quantity": 2, "unitMinor": 4900 }
  ],
  "changes": [{ "sku": "CHK-FIL", "kind": "weight", "deltaMinor": -1530 }]
}

200 OK
{ "invoice": { "amountMinor": 31670, "previousMinor": 33200 }, "capture": "requested" }`}</pre>
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-ink-900">{t('Read the views', 'Читайте проєкції')}</h2>
            <p className="mt-3 text-ink-700">{t('Each entity is a view formed from facts. You never update one; you read it, or you listen to the facts that form it.', 'Кожна сутність — проєкція, сформована з фактів. Ви ніколи її не оновлюєте; ви її читаєте або слухаєте факти, що її формують.')}</p>
            {order && invoice && session && payment ? (
              <div className="mt-4 grid gap-3">
                <pre className={code}>{`GET /v1/sessions/${session.sessionId}\n${trim(session, ['sessionId', 'invoiceId', 'stage', 'outcome', 'instrument', 'risk', 'route', 'paymentId'])}`}</pre>
                <pre className={code}>{`GET /v1/payments/${payment.paymentId}\n${trim(payment, ['paymentId', 'status', 'amountMinor', 'capturedMinor', 'currency', 'acquirer', 'allocations'])}`}</pre>
              </div>
            ) : null}
          </div>
        </section>
        <section id="events">
          <h2 className="text-2xl font-semibold text-ink-900">{t('Webhooks are released events', 'Вебхуки — це випущені події')}</h2>
          <p className="mt-3 max-w-3xl text-ink-700">{t('A webhook is an event, sent as it was written. Its id names one event in one stream, so delivering it twice delivers the same event: deduplicate on the id. Verify the signature — HMAC-SHA256, with your endpoint’s secret, of the timestamp, a full stop and the raw body — refuse a timestamp older than five minutes, and reply 200 at once. The order system listens to the payment’s events; the accounting system to the settlement’s.', 'Вебхук — це подія, надіслана такою, якою її записано. Її id називає одну подію в одному потоці, тож повторна доставка — та сама подія: дедуплікуйте за id. Перевіряйте підпис — HMAC-SHA256 із секретом вашої кінцевої точки від мітки часу, крапки й сирого тіла, — відхиляйте мітку, старшу за п’ять хвилин, і одразу відповідайте 200. Система замовлень слухає події платежу; облікова система — події розрахунку.')}</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {event ? <pre className={`min-w-0 ${code}`}>{`POST https://oms.example/webhooks/river
River-Signature: t=1760900000,v1=5f2c…

${JSON.stringify(event, null, 2)}`}</pre> : null}
            {report ? <pre className={`min-w-0 ${code}`}>{`POST https://erp.example/integration/settlements
River-Signature: t=1760990000,v1=a91e…

${JSON.stringify(report, null, 2)}`}</pre> : null}
          </div>
          <div className="mt-6 overflow-x-auto border border-graphite/20">
            <table className="w-full text-left text-[0.84rem]">
              <thead><tr className="border-b border-ink-900/80">{[t('Event', 'Подія'), t('Owner', 'Власник'), t('Meaning', 'Значення'), t('Forms', 'Формує')].map((h) => <th key={h} className="annot px-3 py-2 text-[0.56rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
              <tbody>{factCatalogue.filter((d) => d.webhook).map((d) => <tr key={d.type} className="border-b border-graphite/15"><td className="px-3 py-1.5 font-mono text-[0.76rem] text-ink-900">{d.type}</td><td className="px-3 py-1.5 text-ink-700">{pickText(projectionLabels[d.owner], locale)}</td><td className="px-3 py-1.5 text-ink-700">{pickText(d.meaning, locale)}</td><td className="px-3 py-1.5 text-[0.75rem] text-ink-500">{d.forms.map((f) => pickText(projectionLabels[f], locale)).join(', ')}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">{t('Assembled from modules', 'Зібрано з модулів')}</h2>
          <p className="mt-3 max-w-3xl text-ink-700">{t('The platform is a set of packages, each behind one gate. The five boundaries depend on the vocabulary and nothing else — the build refuses anything more; the other modules assemble the structures around them; the surface reads; the runtime wires an assembly, like the two stands of this demo.', 'Платформа — набір пакетів, кожен за одним гейтом. П’ять меж залежать лише від словника — збірка відхиляє будь-що більше; інші модулі збирають структури довкола них; поверхня читає; runtime збирає конкретну збірку, як два стенди цього демо.')}</p>
          <div className="mt-5 overflow-x-auto border border-graphite/20">
            <table className="w-full text-left text-[0.84rem]">
              <tbody>{modules.map(([name, kind, en, uk]) => <tr key={name} className="border-b border-graphite/15"><td className="px-3 py-1.5 font-mono text-[0.78rem] text-ink-900">{name}</td><td className={`annot px-3 py-1.5 text-[0.55rem] ${kind === 'boundary' ? 'text-sunrise-600' : 'text-ink-500'}`}>{kind}</td><td className="px-3 py-1.5 text-ink-700">{t(en, uk)}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-6"><Link href={href(locale, '/demo')} className="font-semibold text-river-700 underline">{t('Open the integrator’s cabinet: connections, keys, webhooks, the API log and a sandbox', 'Відкрийте кабінет інтегратора: підключення, ключі, вебхуки, журнал API і пісочниця')}</Link></p>
        </section>
      </Container>
    </>
  );
}
