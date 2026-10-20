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
  ['@river/psp-facts', 'vocabulary', 'The shared vocabulary: boundaries, stages, every fact type with its owner and the views it forms.', 'Спільний словник: межі, стадії, кожен тип факту з власником і проєкціями.'],
  ['@river/psp-order', 'boundary', 'The order: lines, split plan, fulfilment; its view.', 'Замовлення: позиції, план розщеплення, виконання; його проєкція.'],
  ['@river/psp-invoice', 'boundary', 'The invoice: the claim, what is due, attempts, reminders.', 'Інвойс: вимога, борг, спроби, нагадування.'],
  ['@river/psp-session', 'boundary', 'The payment session: one attempt, the river and its bridges.', 'Платіжна сесія: одна спроба, ріка та її мости.'],
  ['@river/psp-payment', 'boundary', 'The payment: secured money, its delta, refunds, disputes, payouts.', 'Платіж: забезпечені гроші, дельта, повернення, спори, виплати.'],
  ['@river/psp-units', 'assembly', 'The hierarchy and its policies, resolved down the tree.', 'Ієрархія та її політики, розв’язані донизу деревом.'],
  ['@river/psp-instruments', 'assembly', 'Twelve instruments, their courses, the acquirers of each rail.', 'Дванадцять інструментів, їх русла, еквайри кожної рейки.'],
  ['@river/psp-split', 'assembly', 'Split plans and the allocation that always sums to the amount.', 'Плани розщеплення й розподіл, що завжди дорівнює сумі.'],
  ['@river/psp-ledger', 'assembly', 'The ledger as a projection: balanced entries, balances.', 'Облік як проєкція: збалансовані записи, залишки.'],
  ['@river/psp-flow', 'assembly', 'The figure of an attempt: screening, routing, consent, course.', 'Фігура спроби: перевірка, маршрут, згода, русло.'],
  ['@river/psp-risk', 'assembly', 'Scores, rules down the tree, alerts, onboarding cases.', 'Бали, правила деревом, сповіщення, справи онбордингу.'],
  ['@river/psp-access', 'assembly', 'Roles, grants scoped to units, separation of duties.', 'Ролі, доступи в межах одиниць, розподіл обов’язків.'],
  ['@river/psp-contracts', 'assembly', 'Contracts, tariffs, the fee of one payment.', 'Договори, тарифи, комісія одного платежу.'],
  ['@river/psp-checkout', 'assembly', 'The pay page: config from policies, card checks, texts.', 'Сторінка оплати: конфігурація з політик, перевірки картки, тексти.'],
  ['@river/psp-integration', 'assembly', 'Keys, webhook endpoints and deliveries, the API log.', 'Ключі, вебхуки й доставки, журнал API.'],
  ['@river/psp-agents', 'assembly', 'The swarm: insights and proposals, never facts.', 'Рій: висновки й пропозиції, ніколи не факти.'],
  ['@river/psp-views', 'surface', 'Readings for cabinets: the river of a session, figures, series.', 'Читання для кабінетів: ріка сесії, показники, ряди.'],
  ['@river/psp-runtime', 'compose', 'The stand wired: the one writer, stand-in banks, commands, clock.', 'Стенд у зборі: єдиний писач, банки-імітатори, команди, годинник.'],
];

/**
 * For developers: the four entities and the shape of their views (real objects of the stand, trimmed),
 * the calls a merchant's server makes, webhooks as released facts, and the modules the platform is
 * assembled from — each behind one gate.
 */
export default async function Developers({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = lt(locale);
  const w = world();
  const payment = [...w.views.payments.values()].findLast((p) => p.status === 'captured' && p.allocations.length >= 4);
  const session = payment ? w.views.sessions.get(payment.sessionId) : undefined;
  const invoice = payment ? w.views.invoices.get(payment.invoiceId) : undefined;
  const order = payment ? w.views.orders.get(payment.orderId) : undefined;
  const trim = (o: unknown, keep: string[]) => JSON.stringify(Object.fromEntries(Object.entries(o as Record<string, unknown>).filter(([k]) => keep.includes(k))), null, 2);
  const captureFact = payment ? (w.streams.get(payment.sessionId) ?? []).find((f) => f.type === 'capture.Completed') : undefined;
  const event = captureFact ? webhookEventOf(captureFact) : null;
  const code = 'max-w-full overflow-x-auto bg-ink-900 p-4 font-mono text-[0.76rem] leading-relaxed text-paper';
  return (
    <>
      <PageHead sheet={`${t('Sheet', 'Аркуш')} RP-10`} title={t('Four entities, released facts', 'Чотири сутності, випущені факти')} lead={t('Your server creates an order and its invoice; the payer pays through the pay link; every step comes back to you as a fact. The objects below are real views of the demo stand, trimmed.', 'Ваш сервер створює замовлення та інвойс; платник сплачує за платіжним посиланням; кожен крок повертається до вас як факт. Об’єкти нижче — справжні проєкції демо-стенда, скорочені.')} />
      <Container className="space-y-14 py-14">
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-ink-900">{t('Create an order and its invoice', 'Створіть замовлення та інвойс')}</h2>
            <p className="mt-3 text-ink-700">{t('The order carries its lines (with their sellers) and, if you want, its own split; otherwise it takes the plan your unit’s policies give it. The response holds the pay link — its key is the payer’s only authority and is shown once.', 'Замовлення містить позиції (з продавцями) і, за бажання, власне розщеплення; інакше бере план, який дають політики вашої одиниці. Відповідь містить платіжне посилання — його ключ є єдиним повноваженням платника й показується один раз.')}</p>
            <pre className={`mt-4 ${code}`}>{`POST /v1/orders
Authorization: Bearer rp_live_sk_…
Idempotency-Key: order-2026-00717

{
  "unit": "ou-kvitka-web",
  "reference": "KVM-2026-00717",
  "currency": "UAH",
  "lines": [
    { "sku": "HNY-ACACIA", "quantity": 1, "unitMinor": 45000, "seller": "ou-seller-honey" },
    { "sku": "CER-JUG",    "quantity": 1, "unitMinor": 168000, "seller": "ou-seller-ceramics" }
  ],
  "payer": "py_7f3a",
  "invoice": { "dueDays": 1 }
}

201 Created
{ "orderId": "ord_…", "invoiceId": "inv_…", "payLink": "https://pay.river-pay.example/uk/pay/…" }`}</pre>
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-ink-900">{t('Read the views', 'Читайте проєкції')}</h2>
            <p className="mt-3 text-ink-700">{t('Each entity is a view formed from facts. You never update one; you read it, or you listen to the facts that form it.', 'Кожна сутність — проєкція, сформована з фактів. Ви ніколи її не оновлюєте; ви її читаєте або слухаєте факти, що її формують.')}</p>
            {order && invoice && session && payment ? (
              <div className="mt-4 grid gap-3">
                <pre className={code}>{`GET /v1/sessions/${session.sessionId}\n${trim(session, ['sessionId', 'invoiceId', 'stage', 'outcome', 'instrument', 'risk', 'route', 'paymentId', 'bridges'])}`}</pre>
                <pre className={code}>{`GET /v1/payments/${payment.paymentId}\n${trim(payment, ['paymentId', 'status', 'capturedMinor', 'feeMinor', 'currency', 'allocations'])}`}</pre>
              </div>
            ) : null}
          </div>
        </section>
        <section id="events">
          <h2 className="text-2xl font-semibold text-ink-900">{t('Webhooks are released facts', 'Вебхуки — це випущені факти')}</h2>
          <p className="mt-3 max-w-3xl text-ink-700">{t('A webhook is a fact of the river, sent as it was written. Its id names one fact in one stream, so delivering it twice delivers the same event: deduplicate on the id. Verify the signature — HMAC-SHA256, with your endpoint’s secret, of the timestamp, a full stop and the raw body — refuse a timestamp older than five minutes, and reply 200 at once.', 'Вебхук — це факт ріки, надісланий таким, яким його записано. Його id називає один факт в одному потоці, тож повторна доставка — та сама подія: дедуплікуйте за id. Перевіряйте підпис — HMAC-SHA256 із секретом вашої кінцевої точки від мітки часу, крапки й сирого тіла, — відхиляйте мітку, старшу за п’ять хвилин, і одразу відповідайте 200.')}</p>
          {event ? <pre className={`mt-4 ${code}`}>{`POST https://api.your-shop.example/webhooks/river
River-Signature: t=1760900000,v1=5f2c…

${JSON.stringify(event, null, 2)}`}</pre> : null}
          <div className="mt-6 overflow-x-auto border border-graphite/20">
            <table className="w-full text-left text-[0.84rem]">
              <thead><tr className="border-b border-ink-900/80">{[t('Event', 'Подія'), t('Owner', 'Власник'), t('Meaning', 'Значення'), t('Forms', 'Формує')].map((h) => <th key={h} className="annot px-3 py-2 text-[0.56rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
              <tbody>{factCatalogue.filter((d) => d.webhook).map((d) => <tr key={d.type} className="border-b border-graphite/15"><td className="px-3 py-1.5 font-mono text-[0.76rem] text-ink-900">{d.type}</td><td className="px-3 py-1.5 text-ink-700">{pickText(projectionLabels[d.owner], locale)}</td><td className="px-3 py-1.5 text-ink-700">{pickText(d.meaning, locale)}</td><td className="px-3 py-1.5 text-[0.75rem] text-ink-500">{d.forms.map((f) => pickText(projectionLabels[f], locale)).join(', ')}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">{t('Assembled from modules', 'Зібрано з модулів')}</h2>
          <p className="mt-3 max-w-3xl text-ink-700">{t('The platform is a set of packages, each behind one gate. The four boundaries depend on the vocabulary and nothing else — the build refuses anything more; the other modules assemble the structures around them; the surface reads; the runtime wires a stand like this one.', 'Платформа — набір пакетів, кожен за одним гейтом. Чотири межі залежать лише від словника — збірка відхиляє будь-що більше; інші модулі збирають структури довкола них; поверхня читає; runtime збирає стенд, як цей.')}</p>
          <div className="mt-5 overflow-x-auto border border-graphite/20">
            <table className="w-full text-left text-[0.84rem]">
              <tbody>{modules.map(([name, kind, en, uk]) => <tr key={name} className="border-b border-graphite/15"><td className="px-3 py-1.5 font-mono text-[0.78rem] text-ink-900">{name}</td><td className={`annot px-3 py-1.5 text-[0.55rem] ${kind === 'boundary' ? 'text-sunrise-600' : 'text-ink-500'}`}>{kind}</td><td className="px-3 py-1.5 text-ink-700">{t(en, uk)}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-6"><Link href={href(locale, '/demo')} className="font-semibold text-river-700 underline">{t('Open the integrator’s cabinet: keys, webhooks, the API log and a sandbox', 'Відкрийте кабінет інтегратора: ключі, вебхуки, журнал API і пісочниця')}</Link></p>
        </section>
      </Container>
    </>
  );
}
