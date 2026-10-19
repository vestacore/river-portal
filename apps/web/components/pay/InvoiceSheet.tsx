import { formatDate, segmentForLocale, type Locale } from '@river/i18n';
import type { OrderView } from '@river/pay-views';
import type { Dictionary } from '@/lib/dictionary/types';
import { payAction } from '@/lib/pay/actions';
import { FactTable } from '../site/FactTable';
import { Icon } from '../ui/Icon';
import { AutoRefresh } from './AutoRefresh';
import { MoneySplit } from './MoneySplit';
import { OrderLine } from './OrderLine';
import { PayStatus } from './PayStatus';
import { SubmitButton } from './SubmitButton';
import { payMoney } from '@/lib/pay/payMoney';

/**
 * One invoice as its payer sees it, whatever way they came — by the pay link or as the signed-in
 * payer. The sheet always says where the order stands and what happens next; the one thing the
 * payer can do is offered once, and only where it can matter. A paid invoice is its own receipt.
 */
export function InvoiceSheet({ view, merchantName, access, locale, dict, now }: {
  view: OrderView; merchantName: string; access: { key: string } | { orderId: string }; locale: Locale; dict: Dictionary; now: string;
}) {
  const t = dict.pay;
  const i = t.invoice;
  const money = (minor: number, currency: string = view.currency) => payMoney(minor, currency, locale);
  const provider = view.route ? t.providers[view.route.provider] : '';
  const expired = view.invoice !== null && view.invoice.expiresAt <= now && (view.status === 'invoiced' || view.status === 'retry');
  const canPay = !expired && (view.status === 'invoiced' || view.status === 'retry');
  const by = view.cancelled ? (t.by as Record<string, string>)[view.cancelled.by] ?? view.cancelled.by : '';
  // A stand-in's page is this site's own: link to it by path, so it opens wherever the site is served from.
  const crossing = view.session?.simulated ? `/${segmentForLocale(locale)}${new URL(view.session.redirectUrl).pathname}` : view.session?.redirectUrl;

  const gate = (label: string) => (
    <form action={payAction} className="space-y-4">
      {'key' in access ? <input type="hidden" name="key" value={access.key} /> : <input type="hidden" name="orderId" value={access.orderId} />}
      <input type="hidden" name="localeSegment" value={segmentForLocale(locale)} />
      <SubmitButton size="lg" pending={i.paying}>{label}</SubmitButton>
      <ul className="space-y-1.5 text-sm text-ink-500">
        <li className="flex items-start gap-2"><Icon name="lock" className="mt-0.5 size-4 shrink-0 text-teal-600" />{i.safe}</li>
        <li className="flex items-start gap-2"><Icon name="shield" className="mt-0.5 size-4 shrink-0 text-teal-600" />{i.noCharge}</li>
      </ul>
    </form>
  );
  const notice = (tone: 'teal' | 'attention' | 'paper', icon: string, title: string, text?: string) => (
    <div className={`chamfer p-6 [--cut:18px] ${tone === 'teal' ? '[--fill:var(--color-teal-100)]' : tone === 'attention' ? '[--fill:var(--color-attention-100)]' : '[--fill:var(--color-paper-deep)]'}`}>
      <Icon name={icon} className={`size-8 ${tone === 'attention' ? 'text-attention-500' : 'text-teal-600'}`} />
      <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
      {text ? <p className="mt-2 text-ink-700">{text}</p> : null}
    </div>
  );

  return (
    <article className="sketch bg-paper p-6 sm:p-9">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <p className="annot text-ink-500">{i.title} <span className="text-ink-900">{view.invoice?.invoiceId ?? view.orderId}</span></p>
        <PayStatus status={view.status} t={t} />
      </header>
      <p className="mt-6 text-lg text-ink-700">{(view.status === 'paid' ? i.paidTo : canPay || view.status === 'routing' || view.status === 'open' || view.status === 'approved' ? i.asks : i.asked).replace('{merchant}', merchantName)}</p>
      <p className="mt-1 font-display text-5xl font-semibold tabular-nums text-ink-900 sm:text-6xl">{money(view.amountMinor)}</p>
      <p className="mt-4 text-lg"><span className="annot mr-2 text-ink-500">{i.forWhat}</span><span className="text-ink-900">{view.title}</span></p>

      <div className="mt-8"><OrderLine status={view.status} t={t} /></div>

      {view.invoice ? (
        <div className="mt-8">
          <MoneySplit amountMinor={view.amountMinor} feeMinor={view.invoice.feeMinor} netMinor={view.invoice.netMinor} feeBps={view.invoice.feeBps} currency={view.currency} locale={locale}
            labels={{ total: t.money.youPay, net: t.money.receives.replace('{merchant}', merchantName), fee: t.money.riverKeeps, rate: t.money.rate }} />
        </div>
      ) : null}

      <div className="mt-8 space-y-5">
        {view.status === 'retry' && view.lastFailure && !expired ? notice('attention', 'close', i.retryTitle, `${i.retryText.replace('{provider}', view.lastFailure.provider ? t.providers[view.lastFailure.provider] : '—').replace('{reason}', view.lastFailure.reason)} ${i.tryOther}`) : null}
        {expired && view.invoice ? notice('paper', 'close', i.expiredTitle, i.expiredText.replace('{date}', formatDate(view.invoice.expiresAt, locale, true)).replace('{merchant}', merchantName)) : null}
        {canPay && view.invoice ? (
          <>
            <p className="annot text-ink-500">{i.validUntil} <span className="text-ink-900">{formatDate(view.invoice.expiresAt, locale, true)}</span></p>
            {gate(view.status === 'retry' ? i.tryAgain : i.pay.replace('{amount}', money(view.amountMinor)))}
          </>
        ) : null}

        {view.status === 'routing' ? (
          <div className="space-y-3">
            <AutoRefresh />
            <p className="flex items-center gap-3 text-lg text-ink-900"><span className="size-2.5 animate-glow bg-sunrise-500" aria-hidden="true" />{i.routing.replace('{provider}', provider)}</p>
            {view.route ? <p className="text-sm text-ink-500">{i.why}: {view.route.reason}.</p> : null}
            <p><a className="text-sm font-semibold underline decoration-graphite/40 underline-offset-4" href="">{i.checkAgain}</a></p>
          </div>
        ) : null}

        {view.status === 'open' && view.session ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">{i.gateOpen}</h2>
            <a href={crossing} rel="noreferrer" className="chamfer inline-flex items-center gap-2.5 px-8 py-4 text-lg font-semibold text-ink-900 [--cut:12px] [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)]">
              {i.continueTo.replace('{provider}', provider)}{view.session.simulated ? <span className="annot">({t.standIn})</span> : null}<Icon name="arrow" className="size-5" />
            </a>
            <p className="text-sm text-ink-500">{i.leaving.replace('{provider}', provider)} {i.safe}</p>
            {view.route ? <p className="text-sm text-ink-500">{i.why}: {view.route.reason}.</p> : null}
          </div>
        ) : null}

        {view.status === 'approved' && view.attempts.open?.capture === 'pending' ? (
          <div className="space-y-3">
            <p className="flex items-start gap-3 text-lg text-ink-900"><span className="mt-2 size-2.5 shrink-0 bg-teal-500" aria-hidden="true" />{i.pending.replace('{provider}', provider)}</p>
            <p><a className="text-sm font-semibold underline decoration-graphite/40 underline-offset-4" href="">{i.checkAgain}</a></p>
          </div>
        ) : view.status === 'approved' ? (
          <div className="space-y-3">
            <AutoRefresh />
            <p className="flex items-center gap-3 text-lg text-ink-900"><span className="size-2.5 animate-glow bg-teal-500" aria-hidden="true" />{i.approved}</p>
            <p><a className="text-sm font-semibold underline decoration-graphite/40 underline-offset-4" href="">{i.checkAgain}</a></p>
          </div>
        ) : null}

        {view.status === 'paid' && view.paid ? (
          <>
            {notice('teal', 'check', i.paidTitle, i.keep)}
            <FactTable rows={[
              [i.receipt, <span key="r" className="font-mono text-sm">{view.receiptId}</span>],
              [t.money.amount, <b key="a" className="tabular-nums">{money(view.amountMinor)}</b>],
              [i.paidOn, formatDate(view.paid.at, locale, true)],
              [i.carriedBy, t.providers[view.paid.provider]],
              [i.reference, <span key="p" className="break-all font-mono text-sm">{view.paid.providerRef}</span>],
            ]} />
            {view.paid.simulated ? <p className="annot text-attention-500">{i.simulated}</p> : null}
          </>
        ) : null}

        {view.status === 'refused' ? notice('attention', 'close', i.refusedTitle, i.refusedText.replaceAll('{merchant}', merchantName)) : null}
        {view.status === 'flagged' ? notice('attention', 'shield', i.flaggedTitle, i.flaggedText) : null}
        {view.status === 'cancelled' && view.cancelled ? notice('paper', 'close', i.cancelledTitle, i.cancelledText.replace('{by}', by).replace('{reason}', view.cancelled.reason)) : null}
      </div>
    </article>
  );
}
