'use client';

import { useActionState } from 'react';
import { ChoiceCards } from '@/components/ui/ChoiceCards';
import { CheckRow } from '@/components/ui/CheckRow';
import { Field, inputClass } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import type { Dictionary } from '@/lib/dictionary/types';
import { submitNeedAction } from './actions';
import type { AskState } from './types';

type Props = {
  localeSegment: string;
  t: Dictionary['ask'];
  categories: Array<{ id: string; icon: string; label: string }>;
  oblasts: Array<{ id: string; label: string }>;
};

/** The help-seeker form: five short steps on one page; works without JavaScript. */
export function AskForm({ localeSegment, t, categories, oblasts }: Props) {
  const [state, action, pending] = useActionState<AskState, FormData>(submitNeedAction, { errors: {}, values: {} });
  const e = state.errors;
  const v = state.values;
  const err = (field: string) => (e[field] ? (t.errors as Record<string, string>)[e[field] as string] ?? t.errors.general : undefined);
  const step = (n: number, title: string) => (
    <h2 className="flex items-center gap-3 text-xl font-bold"><span className="grid size-8 place-items-center bg-ink-900 font-mono text-sm text-paper">{n}</span>{title}</h2>
  );
  return (
    <form action={action} className="space-y-10" noValidate>
      <input type="hidden" name="localeSegment" value={localeSegment} />
      <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {Object.keys(e).length > 0 ? <p role="alert" className="rounded-2xl bg-attention-100 px-4 py-3 font-medium text-attention-500">{t.errors.general}</p> : null}

      <section className="space-y-5">
        {step(1, t.steps.what)}
        <Field label={t.category} error={err('categoryId')}>
          <ChoiceCards name="categoryId" columns={3} defaultValue={v.categoryId} invalid={Boolean(e.categoryId)} options={categories.map((c) => ({ value: c.id, label: c.label, icon: c.icon }))} />
        </Field>
        <Field label={t.form} error={err('form')}>
          <ChoiceCards name="form" columns={4} defaultValue={v.form ?? 'goods'} options={(['goods', 'money', 'service', 'transport'] as const).map((f) => ({ value: f, label: t.forms[f] }))} />
        </Field>
        <Field label={t.description} hint={t.descriptionHint} error={err('description')} htmlFor="description">
          <textarea id="description" name="description" rows={5} defaultValue={v.description} aria-invalid={Boolean(e.description)} className={inputClass} />
        </Field>
      </section>

      <section className="space-y-5">
        {step(2, t.steps.where)}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.oblast} error={err('oblastId')} htmlFor="oblastId">
            <select id="oblastId" name="oblastId" defaultValue={v.oblastId ?? ''} aria-invalid={Boolean(e.oblastId)} className={inputClass}>
              <option value="" disabled>{t.oblastPlaceholder}</option>
              {oblasts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label={t.settlement} hint={<><Icon name="lock" className="mr-1 inline size-3.5" />{t.settlementHint}</>} error={err('settlement')} htmlFor="settlement">
            <input id="settlement" name="settlement" defaultValue={v.settlement} aria-invalid={Boolean(e.settlement)} className={inputClass} autoComplete="address-level2" />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        {step(3, t.steps.who)}
        <ChoiceCards name="forWhom" defaultValue={v.forWhom ?? 'self'} options={(['self', 'family', 'neighbours', 'institution'] as const).map((k) => ({ value: k, label: t.forWhom[k] }))} />
        <div className="max-w-xs">
          <Field label={t.householdSize} error={err('householdSize')} htmlFor="householdSize">
            <input id="householdSize" name="householdSize" type="number" inputMode="numeric" min={1} max={500} defaultValue={v.householdSize ?? '1'} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        {step(4, t.steps.when)}
        <ChoiceCards name="urgency" columns={4} defaultValue={v.urgency ?? 'this_week'} options={(['today', 'this_week', 'this_month', 'when_possible'] as const).map((k) => ({ value: k, label: t.urgency[k] }))} />
      </section>

      <section className="space-y-5">
        {step(5, t.steps.contact)}
        <Field label={t.name} hint={t.nameHint} error={err('name')} htmlFor="name">
          <input id="name" name="name" defaultValue={v.name} aria-invalid={Boolean(e.name)} className={inputClass} autoComplete="given-name" />
        </Field>
        <Field label={t.channel} error={err('contactChannel')}>
          <ChoiceCards name="contactChannel" columns={3} defaultValue={v.contactChannel ?? 'phone'} options={(['phone', 'messenger', 'email'] as const).map((k) => ({ value: k, label: t.channels[k] }))} />
        </Field>
        <Field label={t.contactValue} error={err('contactValue')} htmlFor="contactValue">
          <input id="contactValue" name="contactValue" defaultValue={v.contactValue} aria-invalid={Boolean(e.contactValue)} className={inputClass} autoComplete="tel" />
        </Field>
        <div className="space-y-3">
          <CheckRow name="consentToContact" defaultChecked={v.consentToContact === 'on'} invalid={Boolean(e.consentToContact)}>{t.consentToContact}</CheckRow>
          {err('consentToContact') ? <p className="text-sm font-medium text-attention-500">{err('consentToContact')}</p> : null}
          <CheckRow name="consentToStory" defaultChecked={v.consentToStory === 'on'}>{t.consentToStory}</CheckRow>
        </div>
      </section>

      <div className="rounded-3xl bg-river-100/70 p-5 text-[0.95rem] text-river-900"><Icon name="shield" className="mr-2 inline size-5 text-river-700" />{t.privacy}</div>
      <button type="submit" disabled={pending} className="chamfer inline-flex w-full items-center justify-center gap-2 px-7 py-4 text-lg font-bold text-ink-900 transition-colors [--cut:12px] [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)] disabled:opacity-60 sm:w-auto">
        {pending ? t.sending : t.submit}<Icon name="arrow" />
      </button>
    </form>
  );
}
