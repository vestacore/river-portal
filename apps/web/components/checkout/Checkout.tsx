'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { cardBrand, cardErrors, formatCardNumber, testCardOf, type CheckoutTexts } from '@river/psp-checkout';
import type { InstrumentId } from '@river/psp-facts';
import type { PayerGesture } from '@river/psp-runtime';
import { payGesture, payStart, payStatus } from '@/lib/actions/pay';
import type { PayState } from '@/lib/payState';
import { Icon } from '../ui/Icon';
import { FakeQr } from './FakeQr';

export type CheckoutInstrument = { id: InstrumentId; label: string; hint: string; icon: string };
export type CheckoutProps = {
  locale: 'uk' | 'en-GB';
  payKey: string;
  texts: CheckoutTexts;
  merchant: { name: string; monogram: string; email: string; phone: string; accent: string };
  invoice: { number: string; amount: string; dueBy: string; paymentFor: string; lines: Array<{ title: string; quantity: number; amount: string; seller: string | null }>; total: string; paid: { label: string; amount: string; rest: string } | null };
  split: Array<{ label: string; role: string; amount: string }> | null;
  instruments: CheckoutInstrument[];
  testCards: Array<{ number: string; label: string }>;
  collectEmail: boolean;
  initial: PayState;
  trackHref: string;
  returnUrl: string;
  languages: Array<{ href: string; label: string; current: boolean }>;
  preview?: boolean;
};

const wallets: InstrumentId[] = ['apple_pay', 'google_pay'];

/**
 * The hosted pay page, embedded in the demo. It follows the shape of the earlier pay page — the merchant's
 * bar, the invoice on the left, the instruments on the right, results in place of the form — and drives
 * one attempt down the river through server actions that hold only the pay key. Card numbers are checked
 * here, in the browser, and never sent: only the brand, the first six and the last four digits leave it.
 */
export function Checkout(props: CheckoutProps) {
  const { texts: x, merchant, invoice, instruments } = props;
  const [state, setState] = useState<PayState>(props.initial);
  const [pending, start] = useTransition();
  const [chosen, setChosen] = useState<InstrumentId | null>(instruments.find((i) => i.id === 'card')?.id ?? instruments.find((i) => !wallets.includes(i.id))?.id ?? null);
  const [details, setDetails] = useState(false);
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' });
  const [showCvc, setShowCvc] = useState(false);
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [tried, setTried] = useState(false);
  const [bank, setBank] = useState(x.bank.banks[0] ?? '');
  const [parts, setParts] = useState(4);
  const [iban, setIban] = useState('DE89 3704 0044 0532 0130 00');
  const [mandate, setMandate] = useState(false);
  const accent = { ['--accent' as string]: merchant.accent } as React.CSSProperties;

  // While the world decides (a review, pushed money), the page asks again every few seconds.
  useEffect(() => {
    if (props.preview || state.state !== 'review') return;
    const timer = setInterval(() => { void payStatus(props.payKey).then(setState); }, 2_500);
    return () => clearInterval(timer);
  }, [state.state, props.payKey, props.preview]);

  const errors = useMemo(() => cardErrors(card, new Date()), [card]);
  const brand = cardBrand(card.number);
  const emailBad = props.collectEmail && email !== '' && !/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(email);

  const run = (fn: () => Promise<PayState>) => { if (props.preview) return; start(async () => setState(await fn())); };
  const pay = (instrument: InstrumentId) => {
    setTried(true);
    if (instrument === 'card' && (errors.length > 0 || !agreed || emailBad)) return;
    if (instrument !== 'card' && !wallets.includes(instrument) && !agreed) return;
    if (instrument === 'direct_debit' && !mandate) return;
    run(() => payStart(props.payKey, instrument, instrument === 'card' ? { testNumber: card.number } : instrument === 'pay_by_bank' ? { bank } : instrument === 'installments' || instrument === 'bnpl' ? { parts: instrument === 'bnpl' ? 3 : parts } : instrument === 'direct_debit' ? { iban } : {}, props.locale));
  };
  const gesture = (g: PayerGesture) => state.sessionId && run(() => payGesture(props.payKey, state.sessionId!, g));
  const again = () => { setTried(false); setState({ ...state, state: 'choose', sessionId: null }); };
  const fill = (n: string) => setCard({ number: formatCardNumber(n), expiry: '12/29', cvc: '123' });
  const label = (id: InstrumentId | null) => instruments.find((i) => i.id === id)?.label ?? '';
  const t = (s: string, vars: Record<string, string>) => Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, v), s);

  const input = 'w-full border border-[#bac3d4] bg-white px-3 py-2.5 text-[0.95rem] text-ink-900 placeholder:text-ink-300 focus:border-[var(--accent)] focus:outline-none';
  const payButton = 'flex w-full items-center justify-center gap-2 bg-[var(--accent)] px-4 py-3 text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50';
  const firstError = tried && chosen === 'card' ? errors[0] : undefined;

  const result = (() => {
    switch (state.state) {
      case 'done':
      case 'capture':
        return (
          <div className="text-center">
            <span className="mx-auto flex size-14 items-center justify-center border-2 border-teal-600 text-teal-600"><Icon name="check" className="size-8" /></span>
            <h2 className="mt-4 text-2xl font-semibold text-teal-600">{x.success}</h2>
            <p className="mt-1 text-ink-700">{state.state === 'capture' ? (props.locale === 'uk' ? 'Кошти заблоковано; мерчант спише їх при відвантаженні.' : 'The funds are held; the merchant takes them when the goods ship.') : x.successText}</p>
            <dl className="mx-auto mt-6 max-w-sm divide-y divide-graphite/15 border-y border-graphite/15 text-left text-[0.9rem]">
              {[[x.paymentMethod, label(state.instrument)], [x.invoiceNumber, invoice.number], [x.paymentId, state.paymentId ?? '—'], [x.receipt, state.receiptId ?? '—']].map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-ink-500">{k}</dt><dd className="font-mono text-[0.82rem] text-ink-900">{v}</dd></div>)}
            </dl>
            <p className="mx-auto mt-5 max-w-sm bg-paper-deep px-4 py-3 text-[0.9rem] text-ink-900">{x.thanks}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <a href={props.trackHref} className={`${payButton} sm:w-auto`}>{x.river}<Icon name="arrow" className="size-4" /></a>
              <a href={props.returnUrl} className="flex items-center justify-center border border-[#bac3d4] px-4 py-3 text-[0.95rem] font-semibold text-ink-900 hover:border-ink-900">{x.returnToStore}</a>
            </div>
          </div>
        );
      case 'failed': {
        const known: Record<string, [string, string]> = {
          do_not_honour: ['The issuer declined the payment.', 'Емітент відхилив платіж.'], insufficient_funds: ['Insufficient funds on the card.', 'Недостатньо коштів на картці.'],
          authentication_failed: ['The payment was not confirmed with the bank.', 'Платіж не підтверджено в банку.'], credit_declined: ['The lender declined credit.', 'Кредитор відмовив у кредиті.'],
          blocked: ['The payment was refused by the merchant’s rules.', 'Платіж відхилено правилами мерчанта.'], rejected: ['The payment was stopped after a check.', 'Платіж зупинено після перевірки.'],
          not_a_test_card: ['Only demo test cards are accepted.', 'Приймаються лише тестові картки демо.'], abandoned: ['The attempt was left unfinished.', 'Спробу не завершено.'], expired: ['The attempt outlived its time.', 'Час спроби вичерпано.'],
          not_payable: [x.expiredText, x.expiredText], not_found: [x.notFoundText, x.notFoundText],
        };
        const why = known[state.failure ?? ''] ?? [state.failure ?? '', state.failure ?? ''];
        const final = state.failure === 'not_payable' || state.failure === 'not_found';
        return (
          <div className="text-center">
            <span className="mx-auto flex size-14 items-center justify-center border-2 border-attention-500 text-attention-500"><Icon name="close" className="size-8" /></span>
            <h2 className="mt-4 text-2xl font-semibold text-attention-500">{final ? (state.failure === 'not_found' ? x.notFound : x.expired) : x.declined}</h2>
            <p className="mt-1 text-ink-700">{final ? '' : `${x.declinedText} ${invoice.number}.`} {props.locale === 'uk' ? why[1] : why[0]}</p>
            {!final ? <button type="button" onClick={again} className={`${payButton} mx-auto mt-6 max-w-xs`}>{x.tryAgain}</button> : null}
          </div>
        );
      }
      case 'review':
        return <Waiting title={props.locale === 'uk' ? 'Платіж перевіряється' : 'The payment is being checked'} text={props.locale === 'uk' ? 'Фахівець перевіряє спробу. Сторінка оновиться сама.' : 'A specialist is checking the attempt. This page updates itself.'} />;
      default:
        return null;
    }
  })();

  return (
    <div style={accent} className={`${props.preview ? '' : 'min-h-dvh'} bg-[#f1f4f8] text-ink-900`}>
      <header className="border-b border-[#e6e9ef] bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4 sm:px-8">
          <span className="flex size-10 items-center justify-center bg-[var(--accent)] font-semibold text-white">{merchant.monogram}</span>
          <span className="text-xl font-semibold">{merchant.name}</span>
          <span className="ml-auto hidden text-right text-[0.8rem] text-ink-500 sm:block">{merchant.phone}<br />{merchant.email}</span>
          <nav aria-label={x.language} className="flex border border-[#e6e9ef] text-[0.75rem] font-semibold">
            {props.languages.map((l) => (props.preview
              ? <span key={l.href} className={`px-2.5 py-1.5 ${l.current ? 'bg-ink-900 text-white' : 'text-ink-700'}`}>{l.label}</span>
              : <a key={l.href} href={l.href} aria-current={l.current ? 'true' : undefined} className={`px-2.5 py-1.5 ${l.current ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-[#f1f4f8]'}`}>{l.label}</a>))}
          </nav>
        </div>
      </header>
      <p className="annot bg-sunrise-100 px-4 py-2 text-center text-[0.62rem] text-ink-900">{x.demo}</p>
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-8 lg:grid-cols-[1fr_1.05fr]">
        <section className="h-fit border border-[#e6e9ef] bg-white p-5">
          <p className="font-semibold">{x.invoice} {invoice.number}</p>
          <p className="mt-1 text-[0.85rem] text-ink-500">{x.paymentFor} <span className="text-ink-900">{invoice.paymentFor}</span></p>
          <p className="mt-1 text-[0.8rem] text-ink-500">{x.dueBy} {invoice.dueBy}</p>
          <button type="button" onClick={() => setDetails(!details)} className={`mt-4 flex items-center gap-1.5 border px-2.5 py-1.5 text-[0.8rem] ${details ? 'border-ink-900 bg-[#f1f4f8] text-ink-900' : 'border-[#e6e9ef] text-ink-500'}`}>{details ? x.hideDetails : x.viewDetails}<Icon name={details ? 'minus' : 'plus'} className="size-3.5" /></button>
          {details ? (
            <ul className="mt-3 divide-y divide-[#e6e9ef] text-[0.88rem]">
              {invoice.lines.map((l) => <li key={l.title} className="flex justify-between gap-3 py-2"><span>{l.title}{l.quantity > 1 ? ` × ${l.quantity}` : ''}{l.seller ? <span className="block text-[0.75rem] text-ink-500">{l.seller}</span> : null}</span><span className="tabular-nums">{l.amount}</span></li>)}
            </ul>
          ) : null}
          {invoice.paid ? <div className="mt-4 flex items-baseline justify-between border-t border-[#e6e9ef] pt-4 text-[0.9rem] text-[#5b6472]"><span>{invoice.paid.label}</span><span className="tabular-nums">{invoice.paid.amount}</span></div> : null}
          <div className={`${invoice.paid ? 'mt-2' : 'mt-4 border-t border-[#e6e9ef] pt-4'} flex items-baseline justify-between`}><span className="font-semibold">{invoice.paid?.rest ?? x.total}</span><span className="text-xl font-semibold tabular-nums">{invoice.total}</span></div>
          {props.split ? (
            <div className="mt-5 border-t border-[#e6e9ef] pt-4">
              <p className="flex items-center gap-2 font-semibold"><Icon name="split" className="size-4 text-[var(--accent)]" />{x.whereMoneyGoes}</p>
              <p className="mt-1 text-[0.78rem] text-ink-500">{x.whereMoneyGoesText}</p>
              <ul className="mt-3 space-y-1.5 text-[0.85rem]">
                {props.split.map((s) => <li key={`${s.label}${s.role}`} className="flex justify-between gap-3"><span>{s.label} <span className="text-[0.72rem] text-ink-500">· {s.role}</span></span><span className="tabular-nums">{s.amount}</span></li>)}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="border border-[#e6e9ef] bg-white p-5">
          {result ?? (
            <>
              <p className="font-semibold">{x.selectMethod}</p>
              {instruments.some((i) => wallets.includes(i.id)) ? (
                <div className="mt-4 grid gap-2">
                  {instruments.filter((i) => wallets.includes(i.id)).map((i) => (
                    <button key={i.id} type="button" disabled={pending} onClick={() => { setChosen(i.id); pay(i.id); }}
                      className={`flex h-11 items-center justify-center gap-2 text-[0.95rem] font-semibold ${i.id === 'apple_pay' ? 'bg-black text-white' : 'border border-ink-900 bg-white text-ink-900'}`}>
                      <Icon name="phone" className="size-4" />{i.id === 'apple_pay' ? 'Pay' : 'G Pay'} <span className="sr-only">{i.label}</span>
                    </button>
                  ))}
                  <p className="my-2 flex items-center gap-3 text-[0.75rem] text-ink-500"><span className="h-px flex-1 bg-[#e6e9ef]" />{x.or}<span className="h-px flex-1 bg-[#e6e9ef]" /></p>
                </div>
              ) : null}
              <ul className="mt-2 grid gap-1.5" role="radiogroup" aria-label={x.selectMethod}>
                {instruments.filter((i) => !wallets.includes(i.id)).map((i) => (
                  <li key={i.id}>
                    <button type="button" role="radio" aria-checked={chosen === i.id} onClick={() => { setChosen(i.id); setTried(false); }}
                      className={`flex w-full items-center gap-3 border px-3 py-2.5 text-left ${chosen === i.id ? 'border-[var(--accent)] bg-[#f6f8fb]' : 'border-[#e6e9ef] hover:border-[#bac3d4]'}`}>
                      <Icon name={i.icon} className={`size-5 shrink-0 ${chosen === i.id ? 'text-[var(--accent)]' : 'text-ink-500'}`} />
                      <span className="min-w-0"><span className="block text-[0.92rem] font-semibold">{i.label}</span>{chosen === i.id ? <span className="block text-[0.78rem] text-ink-500">{i.hint}</span> : null}</span>
                    </button>
                  </li>
                ))}
              </ul>

              {chosen === 'card' ? (
                <div className="mt-5 grid gap-3">
                  <label className="text-[0.82rem] font-semibold">{x.cardNumber}
                    <span className="relative mt-1 block">
                      <input inputMode="numeric" autoComplete="off" value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} placeholder="1234 1234 1234 1234" className={`${input} pr-24 font-mono`} aria-invalid={Boolean(firstError?.startsWith('number') || firstError === 'brand_unsupported' || firstError === 'not_a_test_card')} />
                      <span className="annot absolute right-3 top-1/2 -translate-y-1/2 text-[0.6rem] text-ink-500">{brand ?? ''}</span>
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-[0.82rem] font-semibold">{x.expiry}<input inputMode="numeric" value={card.expiry} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setCard({ ...card, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }); }} placeholder={props.locale === 'uk' ? 'ММ/РР' : 'MM/YY'} className={`${input} mt-1 font-mono`} /></label>
                    <label className="text-[0.82rem] font-semibold">{x.cvc}
                      <span className="relative mt-1 block"><input inputMode="numeric" type={showCvc ? 'text' : 'password'} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="123" className={`${input} font-mono`} />
                        <button type="button" onClick={() => setShowCvc(!showCvc)} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-500" aria-label={x.showCvc}><Icon name="eye" className="size-4" /></button></span>
                    </label>
                  </div>
                  {props.collectEmail ? <label className="text-[0.82rem] font-semibold">{x.email}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={`${input} mt-1`} /><span className="mt-1 block text-[0.75rem] font-normal text-ink-500">{x.emailHint}</span></label> : null}
                  {firstError ? <p role="alert" className="text-[0.85rem] text-attention-500">{x.errors[firstError]}</p> : null}
                  {tried && emailBad ? <p role="alert" className="text-[0.85rem] text-attention-500">{x.errors.emailInvalid}</p> : null}
                </div>
              ) : null}
              {chosen === 'pay_by_bank' ? (
                <div className="mt-5"><p className="text-[0.85rem] font-semibold">{x.bank.choose}</p><div className="mt-2 grid grid-cols-2 gap-2">{x.bank.banks.map((b) => <button key={b} type="button" onClick={() => setBank(b)} className={`border px-3 py-2 text-left text-[0.85rem] ${bank === b ? 'border-[var(--accent)] bg-[#f6f8fb]' : 'border-[#e6e9ef]'}`}>{b}</button>)}</div><p className="mt-2 text-[0.78rem] text-ink-500">{x.bank.text}</p></div>
              ) : null}
              {chosen === 'installments' ? (
                <div className="mt-5"><p className="text-[0.85rem] font-semibold">{x.credit.parts}</p><div className="mt-2 flex gap-2">{[3, 4, 6, 10].map((n) => <button key={n} type="button" onClick={() => setParts(n)} className={`border px-3 py-2 text-[0.9rem] ${parts === n ? 'border-[var(--accent)] bg-[#f6f8fb] font-semibold' : 'border-[#e6e9ef]'}`}>{n}</button>)}</div></div>
              ) : null}
              {chosen === 'bnpl' ? <p className="mt-5 text-[0.85rem] text-ink-700">{x.credit.later}</p> : null}
              {chosen === 'direct_debit' ? (
                <div className="mt-5 grid gap-2">
                  <label className="text-[0.82rem] font-semibold">{x.debit.iban}<input value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} className={`${input} mt-1 font-mono`} /></label>
                  <label className="flex items-start gap-2 text-[0.82rem]"><input type="checkbox" checked={mandate} onChange={(e) => setMandate(e.target.checked)} className="mt-0.5 accent-[var(--accent)]" />{t(x.debit.mandate, { merchant: merchant.name })}</label>
                </div>
              ) : null}

              {chosen ? (
                <>
                  <label className="mt-5 flex items-center gap-2 text-[0.82rem]"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-[var(--accent)]" />{x.agree} <a href="#privacy" className="text-[#c24400] underline">{x.privacy}</a></label>
                  {tried && !agreed ? <p role="alert" className="mt-1 text-[0.82rem] text-attention-500">{x.errors.privacy}</p> : null}
                  <button type="button" disabled={pending} onClick={() => pay(chosen)} className={`${payButton} mt-4`}>{pending ? <Icon name="refresh" className="size-4 animate-spin" /> : <Icon name="lock" className="size-4" />}{t(x.pay, { amount: invoice.amount })}</button>
                </>
              ) : null}
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-[0.7rem] text-ink-700">
                <span className="flex items-center gap-1.5 bg-[#f1f4f8] px-2.5 py-1"><Icon name="lock" className="size-3.5 text-[#16ac1e]" />{x.secured}</span>
                <span className="flex items-center gap-1.5 bg-[#f1f4f8] px-2.5 py-1"><Icon name="shield" className="size-3.5" />{x.threeDs}</span>
              </div>
              <p className="mt-3 text-center text-[0.72rem] text-[#9aa1a6]">{x.poweredBy}</p>
              {chosen === 'card' ? (
                <div className="mt-5 border-t border-dashed border-[#bac3d4] pt-4">
                  <p className="annot text-[0.6rem] text-ink-500">{x.testCards}</p>
                  <ul className="mt-2 space-y-1">{props.testCards.map((c) => <li key={c.number} className="flex items-center justify-between gap-3 text-[0.78rem]"><span><span className="font-mono">{formatCardNumber(c.number)}</span> <span className="text-ink-500">· {c.label}</span></span><button type="button" onClick={() => fill(c.number)} className="annot shrink-0 border border-[#bac3d4] px-2 py-0.5 text-[0.58rem] hover:border-ink-900">{x.useCard}</button></li>)}</ul>
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>

      {state.state === 'challenge' && state.sessionId ? (
        <Modal title={x.challenge.title} bank={x.challenge.bank}>
          <p className="text-[0.95rem]">{t(x.challenge.text, { amount: invoice.amount, merchant: merchant.name })}</p>
          <p className="mt-2 font-mono text-[0.8rem] text-ink-500">{props.locale === 'uk' ? 'Картка' : 'Card'} •••• {testCardOf(card.number)?.number.slice(-4) ?? ''}</p>
          <div className="mt-5 flex gap-2"><button type="button" disabled={pending} onClick={() => gesture({ kind: 'challenge', pass: true })} className={payButton}>{x.challenge.confirm}</button><button type="button" disabled={pending} onClick={() => gesture({ kind: 'challenge', pass: false })} className="border border-[#bac3d4] px-4 py-3 font-semibold">{x.challenge.cancel}</button></div>
        </Modal>
      ) : null}
      {state.state === 'device' && state.sessionId ? (
        <Modal title={t(x.wallet.title, { wallet: label(state.instrument) })} bank={label(state.instrument)}>
          <p className="text-[0.9rem] text-ink-700">{x.wallet.text}</p>
          <p className="mt-3 text-2xl font-semibold">{invoice.amount}</p>
          <button type="button" disabled={pending} onClick={() => gesture({ kind: 'device' })} className={`${payButton} mt-5`}><Icon name="phone" className="size-4" />{x.wallet.confirm}</button>
        </Modal>
      ) : null}
      {state.state === 'consent' && state.sessionId ? (
        <Modal title={state.instrument === 'pay_by_bank' ? bank : label(state.instrument)} bank={props.locale === 'uk' ? 'Застосунок банку (демо)' : 'Bank app (demo)'}>
          <p className="text-[0.95rem]">{t(x.challenge.text, { amount: invoice.amount, merchant: merchant.name })}</p>
          {state.instrument === 'installments' ? <p className="mt-2 text-[0.85rem] text-ink-500">{t(x.credit.perMonth, { n: String(parts), amount: invoice.amount })}</p> : null}
          <div className="mt-5 flex gap-2"><button type="button" disabled={pending} onClick={() => gesture({ kind: 'consent', approve: true })} className={payButton}>{state.instrument === 'pay_by_bank' ? x.bank.approve : x.credit.approve}</button><button type="button" disabled={pending} onClick={() => gesture({ kind: 'consent', approve: false })} className="border border-[#bac3d4] px-4 py-3 font-semibold">{x.challenge.cancel}</button></div>
        </Modal>
      ) : null}
      {state.state === 'funds' && state.sessionId ? (
        <Modal title={state.instrument === 'qr_nbu' ? x.qr.title : state.instrument === 'voucher' ? x.voucher.title : state.instrument === 'stablecoin' ? x.chain.title : state.instrument === 'direct_debit' ? x.waitingFunds : x.transfer.title} bank={label(state.instrument)}>
          {state.instrument === 'qr_nbu' ? <div className="flex flex-col items-center gap-3"><FakeQr seed={state.instructions.reference ?? state.sessionId} /><p className="text-[0.85rem] text-ink-700">{x.qr.text}</p></div> : null}
          {state.instrument === 'bank_transfer' ? (
            <dl className="divide-y divide-[#e6e9ef] text-[0.88rem]">{[[x.transfer.recipient, merchant.name], [x.transfer.iban, state.instructions.iban ?? ''], [x.transfer.purpose, state.instructions.reference ?? ''], [x.transfer.amount, invoice.amount]].map(([k, v]) => <div key={k} className="flex justify-between gap-3 py-2"><dt className="text-ink-500">{k}</dt><dd className="font-mono text-ink-900">{v}</dd></div>)}</dl>
          ) : null}
          {state.instrument === 'voucher' ? <div className="text-center"><p className="font-mono text-3xl tracking-widest">{state.instructions.code}</p><p className="mt-2 text-[0.85rem] text-ink-700">{x.voucher.text}</p></div> : null}
          {state.instrument === 'stablecoin' ? <dl className="divide-y divide-[#e6e9ef] text-[0.88rem]">{[[x.chain.network, state.instructions.network ?? ''], [x.chain.address, state.instructions.address ?? ''], [x.chain.exact, invoice.amount]].map(([k, v]) => <div key={k} className="flex justify-between gap-3 py-2"><dt className="text-ink-500">{k}</dt><dd className="break-all font-mono text-ink-900">{v}</dd></div>)}</dl> : null}
          {state.instrument === 'direct_debit' ? <p className="text-[0.9rem] text-ink-700">{x.waitingFundsText}</p> : null}
          {state.instrument === 'bank_transfer' ? <p className="mt-3 text-[0.8rem] text-ink-500">{x.transfer.text}</p> : null}
          <button type="button" disabled={pending} onClick={() => gesture({ kind: 'funds' })} className={`${payButton} mt-5`}>
            {state.instrument === 'qr_nbu' ? x.qr.simulate : state.instrument === 'voucher' ? x.voucher.simulate : state.instrument === 'stablecoin' ? x.chain.simulate : state.instrument === 'direct_debit' ? (props.locale === 'uk' ? 'Імітувати списання банком' : 'Simulate the bank’s collection') : x.transfer.simulate}
          </button>
        </Modal>
      ) : null}
    </div>
  );
}

function Waiting({ title, text }: { title: string; text: string }) {
  return (
    <div className="py-6 text-center">
      <Icon name="refresh" className="mx-auto size-10 animate-spin text-[var(--accent)]" />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-ink-700">{text}</p>
    </div>
  );
}

function Modal({ title, bank, children }: { title: string; bank: string; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4">
      <div className="w-full max-w-md border border-ink-900 bg-white">
        <p className="annot border-b border-[#e6e9ef] bg-[#f1f4f8] px-5 py-2.5 text-[0.6rem] text-ink-700">{bank}</p>
        <div className="p-5"><h2 className="mb-3 text-lg font-semibold">{title}</h2>{children}</div>
      </div>
    </div>
  );
}
