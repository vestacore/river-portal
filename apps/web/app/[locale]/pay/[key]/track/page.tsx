import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pickText } from '@river/i18n';
import { factCatalogue, factDefinition, stageCatalogue } from '@river/psp-facts';
import { checkoutFor, invoiceByPayKey, riverOfSession } from '@river/psp-runtime';
import { DeltaDrawing } from '@/components/river/DeltaDrawing';
import { SessionRiver } from '@/components/river/SessionRiver';
import { exact, money } from '@/lib/format';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import { worldOfPayKey } from '@/lib/world';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: lt(resolveLocale((await params).locale))('Follow your payment', 'Простежте свій платіж'), robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

/**
 * The payer's own view of their payment: the events their attempt passed, in plain words; for an order
 * captured after picking, what was held, what was charged and what was released; and, where the merchant
 * shows it, where the money went. The pay key is the only authority.
 */
export default async function Track({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale: segment, key } = await params;
  const locale = resolveLocale(segment);
  const t = lt(locale);
  const w = worldOfPayKey(key);
  const invoice = invoiceByPayKey(w, key);
  if (!invoice) notFound();
  const sessions = invoice.sessionIds.map((id) => w.views.sessions.get(id)).filter((s) => s !== undefined);
  const session = sessions.find((s) => s.outcome === 'succeeded') ?? sessions.at(-1);
  const river = session ? riverOfSession(w, session.sessionId) : null;
  const config = checkoutFor(w, invoice.unitId, invoice.currency);
  const payment = session?.paymentId ? w.views.payments.get(session.paymentId) : undefined;
  const labels = Object.fromEntries(factCatalogue.map((d) => [d.type, pickText(d.label, locale)]));
  const stageLabels = { ...Object.fromEntries(stageCatalogue.map((x) => [x.stage, pickText(x.label, locale)])), after: t('closing', 'завершення') };
  const unitName = (id: string) => pickText(w.units.find((u) => u.id === id)?.name, locale);
  const order = w.views.orders.get(invoice.orderId);
  const paid = [...w.views.payments.values()].filter((p) => p.orderId === invoice.orderId && p.capturedAt);
  const card = paid.find((p) => p.captureMode === 'manual' && p.instrument !== 'bonus_points');
  const points = paid.filter((p) => p.instrument === 'bonus_points').reduce((s, p) => s + p.capturedMinor, 0);
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-graphite/20 bg-paper-deep">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4 sm:px-8">
          <span className="flex size-10 items-center justify-center font-semibold text-white" style={{ background: config.accent }}>{config.monogram}</span>
          <span className="text-xl font-semibold text-ink-900">{pickText(config.merchantName, locale)}</span>
          <a href={href(locale, `/pay/${key}`)} className="annot ml-auto text-river-700 hover:text-ink-900">← {t('Back to the pay page', 'До сторінки оплати')}</a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <p className="annot text-sunrise-600">{t('Invoice', 'Рахунок')} {invoice.number} · {money(invoice.amountMinor, invoice.currency, locale)}</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink-900">{t('Your payment, step by step', 'Ваш платіж, крок за кроком')}</h1>
        <p className="mt-2 max-w-3xl text-ink-700">{t('Every step your payment took is an event recorded when it happened, and the record cannot be rewritten afterwards. Only the last four digits of a card were ever kept.', 'Кожен крок вашого платежу — подія, записана в мить, коли вона сталася, і цей запис неможливо переписати згодом. Від картки збережено лише останні чотири цифри.')}</p>
        {order?.picked && card ? (
          <section className="mt-8 max-w-3xl border border-graphite/25 bg-paper-deep p-5">
            <h2 className="text-lg font-semibold text-ink-900">{t('Your order was picked', 'Ваше замовлення скомплектовано')}</h2>
            <p className="mt-2 text-[0.95rem] text-ink-700">{t('Weighed goods are charged by their actual weight, and missing items are not charged. That is why the amount held on your card when you paid can differ from the amount charged: the rest of the hold is released, and your bank returns it to your available balance.', 'Ваговий товар оплачується за фактичною вагою, а відсутні позиції не оплачуються. Тому сума, заблокована на картці під час оплати, може відрізнятися від списаної: залишок блокування розблоковано, і банк повертає його на ваш доступний баланс.')}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[[t('Ordered', 'Замовлено'), money(order.totalMinor, order.currency, locale)], [t('Picked', 'Скомплектовано'), money(order.picked.totalMinor, order.currency, locale)], [t('Held on your card', 'Заблоковано на картці'), money(card.amountMinor, card.currency, locale)], [t('Charged to your card', 'Списано з картки'), money(card.capturedMinor, card.currency, locale)], ...(card.amountMinor > card.capturedMinor ? [[t('Released', 'Розблоковано'), money(card.amountMinor - card.capturedMinor, card.currency, locale)]] : []), ...(points > 0 ? [[t('Paid with bonus points', 'Сплачено бонусними балами'), money(points, card.currency, locale)]] : [])].map(([k, v]) => <div key={k} className="border-t border-graphite/30 pt-2"><dt className="annot text-[0.6rem] text-ink-500">{k}</dt><dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink-900">{v}</dd></div>)}
            </dl>
          </section>
        ) : null}
        {river && session ? (
          <>
            <div className="mt-8 overflow-x-auto border border-graphite/25 bg-paper p-3">
              <SessionRiver bridges={river.bridges} labels={labels} stageLabels={stageLabels} ended={session.outcome === 'succeeded' ? 'succeeded' : session.outcome === 'failed' || session.outcome === 'abandoned' || session.outcome === 'expired' ? 'failed' : 'open'}
                legend={{ session: t('the attempt', 'спроба'), order: t('the order', 'замовлення'), invoice: t('the invoice', 'рахунок'), payment: t('the payment', 'платіж'), ledger: t('the ledger', 'облік'), door: t('you or the merchant', 'ви або мерчант'), figure: t('the platform', 'платформа'), world: t('your bank, the clock', 'ваш банк, годинник') }} />
            </div>
            <ol className="mt-8 divide-y divide-graphite/15 border-y border-graphite/15">
              {river.bridges.map((b) => (
                <li key={b.seq} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[10rem_1fr]">
                  <span className="font-mono text-[0.8rem] text-ink-500">{exact(b.at, locale)}</span>
                  <span><b className="font-semibold text-ink-900">{labels[b.type]}</b><span className="block text-[0.9rem] text-ink-700">{pickText(factDefinition(b.type).meaning, locale)}</span></span>
                </li>
              ))}
            </ol>
          </>
        ) : <p className="mt-8 text-ink-500">{t('No attempt yet.', 'Спроб ще немає.')}</p>}
        {config.showSplit && payment && payment.allocations.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-ink-900">{t('Where your money went', 'Куди пішли ваші гроші')}</h2>
            <div className="mt-4 max-w-4xl"><DeltaDrawing total={[t('You paid', 'Ви сплатили'), money(payment.capturedMinor, payment.currency, locale)]} streams={payment.allocations.map((a) => ({ label: a.role === 'psp_fee' ? 'River Pay' : unitName(a.recipientUnitId), role: a.role, amount: money(a.amountMinor, a.currency, locale), share: a.amountMinor, tone: a.role === 'seller' ? 'seller' : a.role === 'charity' ? 'charity' : a.role === 'psp_fee' ? 'fee' : a.role === 'reserve' ? 'reserve' : 'merchant' }))} /></div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
