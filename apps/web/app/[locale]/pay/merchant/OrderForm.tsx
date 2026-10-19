'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { CopyLink } from '@/components/pay/CopyLink';
import { Field, inputClass } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import type { Dictionary } from '@/lib/dictionary/types';
import { placeOrderAction } from '@/lib/pay/actions';
import type { PlaceState } from '@/lib/pay/types';

type Props = { t: Dictionary['pay']['merchant']; currencies: readonly string[]; payers: Array<{ ref: string; name: string }>; feePct: string; localeSegment: string };

/**
 * A merchant asks for a payment: what for, how much, from whom. The answer is the pay link, shown
 * once — the form then gives way to it, because handing that link over is the merchant's next step.
 */
export function OrderForm({ t, currencies, payers, feePct, localeSegment }: Props) {
  const [state, action, pending] = useActionState<PlaceState, FormData>(placeOrderAction, { placed: null, errors: {}, values: {} });
  const err = (field: 'title' | 'amount' | 'currency' | 'payerRef' | 'merchant') => {
    const code = state.errors[field];
    return code ? (t.errors[field] as Record<string, string>)[code] ?? t.errors.general : undefined;
  };
  if (state.placed) {
    return (
      <div className="chamfer animate-rise p-7 [--cut:20px] [--fill:var(--color-teal-100)]">
        <Icon name="check" className="size-9 text-teal-600" />
        <h2 className="mt-3 text-2xl font-semibold">{t.placedTitle}</h2>
        <p className="mb-5 mt-2 text-ink-700">{t.placedText}</p>
        <CopyLink path={state.placed.payPath} label={t.copy} done={t.copied} />
        <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <Link href={state.placed.payPath} target="_blank" className="inline-flex items-center gap-1.5 underline decoration-sunrise-500 decoration-2 underline-offset-4">{t.openAsPayer}<Icon name="external" className="size-4" /></Link>
          <a href="" className="underline decoration-graphite/40 underline-offset-4">{t.another}</a>
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="localeSegment" value={localeSegment} />
      <Field label={t.what} hint={t.whatHint} error={err('title') ?? err('merchant')} htmlFor="title">
        <input id="title" name="title" maxLength={120} defaultValue={state.values.title} className={inputClass} aria-invalid={Boolean(state.errors.title)} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
        <Field label={t.amount} error={err('amount')} htmlFor="amount">
          <input id="amount" name="amount" inputMode="decimal" placeholder="120.00" defaultValue={state.values.amount} className={`${inputClass} tabular-nums`} aria-invalid={Boolean(state.errors.amount)} />
        </Field>
        <Field label={t.currency} error={err('currency')} htmlFor="currency">
          <select id="currency" name="currency" defaultValue={state.values.currency ?? currencies[0]} className={inputClass}>
            {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label={t.payer} hint={t.payerHint} error={err('payerRef')} htmlFor="payerRef">
        <input id="payerRef" name="payerRef" list="payers" autoCapitalize="none" spellCheck={false} defaultValue={state.values.payerRef} className={`${inputClass} font-mono`} aria-invalid={Boolean(state.errors.payerRef)} />
        <datalist id="payers">{payers.map((p) => <option key={p.ref} value={p.ref}>{p.name}</option>)}</datalist>
      </Field>
      <p className="flex items-start gap-2 text-sm text-ink-500"><Icon name="coins" className="mt-0.5 size-4 shrink-0 text-sunrise-600" />{t.feeNote.replace('{pct}', feePct)}</p>
      <button type="submit" disabled={pending} className="chamfer inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold text-paper transition-colors [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)] disabled:opacity-60">
        {pending ? t.placing : t.submit}<Icon name="arrow" className="size-4" />
      </button>
    </form>
  );
}
