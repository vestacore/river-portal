'use client';

import { useActionState, useState } from 'react';
import { ChoiceCards } from '@/components/ui/ChoiceCards';
import { CheckRow } from '@/components/ui/CheckRow';
import { Field, inputClass } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import type { Dictionary } from '@/lib/dictionary/types';
import { pledgeAction, type GiveState } from './actions';

/** The giving form: what, how much or what exactly, towards which campaign, and who you are. */
export function GiveForm({ t, campaigns, campaignId }: { t: Dictionary['give']; campaigns: Array<{ id: string; title: string }>; campaignId?: string }) {
  const [state, action, pending] = useActionState<GiveState, FormData>(pledgeAction, { done: false, errors: {}, values: {} });
  const [kind, setKind] = useState(state.values.kind ?? 'money');
  const [amount, setAmount] = useState(state.values.amount ?? '25');
  const err = (f: string) => (state.errors[f] ? (t.errors as Record<string, string>)[state.errors[f] as string] ?? t.errors.general : undefined);
  if (state.done) {
    return (
      <div className="chamfer animate-rise p-8 text-center [--cut:24px] [--fill:var(--color-sunrise-100)]">
        <Icon name="heart" className="mx-auto size-12 text-sunrise-500" />
        <h2 className="mt-3 text-3xl font-extrabold">{t.thanksTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-700">{t.thanksText}</p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-7" noValidate onChange={(e) => { const el = e.target as HTMLInputElement; if (el.name === 'kind') setKind(el.value); }}>
      <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <Field label={t.kind} error={err('kind')}>
        <ChoiceCards name="kind" columns={3} defaultValue={kind} options={(['money', 'goods', 'transport', 'service', 'time'] as const).map((k) => ({ value: k, label: t.kinds[k], icon: { money: 'coins', goods: 'basket', transport: 'van', service: 'hand', time: 'heart' }[k] }))} />
      </Field>
      {kind === 'money' ? (
        <Field label={t.amount} error={err('amount')} htmlFor="amount">
          <div className="flex flex-wrap gap-2">
            {['10', '25', '50', '100'].map((a) => (
              <button key={a} type="button" onClick={() => setAmount(a)} className={`px-5 py-2.5 font-semibold tabular-nums ring-1 transition ${amount === a ? 'bg-ink-900 text-paper ring-ink-900' : 'bg-white text-ink-900 ring-graphite/30 hover:ring-graphite'}`}>£{a}</button>
            ))}
            <input id="amount" name="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputClass} max-w-[9rem]`} aria-invalid={Boolean(state.errors.amount)} />
          </div>
        </Field>
      ) : (
        <Field label={t.description} hint={t.descriptionHint} error={err('description')} htmlFor="description">
          <textarea id="description" name="description" rows={3} defaultValue={state.values.description} className={inputClass} />
        </Field>
      )}
      <Field label={t.campaign} htmlFor="campaignId">
        <select id="campaignId" name="campaignId" defaultValue={state.values.campaignId ?? campaignId ?? ''} className={inputClass}>
          <option value="">{t.anyCampaign}</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.name} error={err('name')} htmlFor="gname"><input id="gname" name="name" defaultValue={state.values.name} className={inputClass} autoComplete="name" /></Field>
        <Field label={t.email} error={err('email')} htmlFor="gemail"><input id="gemail" name="email" type="email" defaultValue={state.values.email} className={inputClass} autoComplete="email" /></Field>
      </div>
      <CheckRow name="showFirstName">{t.showFirstName}</CheckRow>
      <p className="flex items-start gap-2 text-sm text-ink-500"><Icon name="shield" className="mt-0.5 size-4 shrink-0 text-teal-600" />{t.promise}</p>
      <button type="submit" disabled={pending} className="chamfer inline-flex w-full items-center justify-center gap-2 px-7 py-4 text-lg font-bold text-paper transition-colors [--cut:12px] [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)] disabled:opacity-60 sm:w-auto">
        <Icon name="heart" />{pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
