'use client';

import { useActionState } from 'react';
import { inputClass } from '@/components/ui/Field';
import { dispatchAction } from '../../actions';

type Labels = { dispatch: string; carrier: string; carrierName: string; fromLabel: string; costs: string; costNote: string; costAmount: string; currency: string; approvalNote: string };

/** Dispatch: carrier and up to three cost lines, each in its own currency. */
export function DispatchForm({ flowId, t, carrierKinds, costKinds, currencies }: {
  flowId: string; t: Labels; carrierKinds: Array<[string, string]>; costKinds: Array<[string, string]>; currencies: string[];
}) {
  const [state, action, pending] = useActionState(dispatchAction, {});
  const small = `${inputClass} py-2`;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="flowId" value={flowId} />
      <div className="grid gap-3">
        <label className="text-sm font-semibold">{t.carrier}<select name="carrierKind" className={`${small} mt-1`}>{carrierKinds.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="text-sm font-semibold">{t.carrierName}<input name="carrierName" required className={`${small} mt-1`} /></label>
        <label className="text-sm font-semibold">{t.fromLabel}<input name="fromLabel" required defaultValue="Lviv hub" className={`${small} mt-1`} /></label>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">{t.costs}</legend>
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid grid-cols-[1fr_6rem_5.5rem] gap-2 border border-graphite/15 bg-paper-deep/60 p-2">
            <select name={`cost${i}Kind`} aria-label={t.costs} className={small}>{costKinds.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <input name={`cost${i}Amount`} inputMode="decimal" placeholder={t.costAmount} aria-label={t.costAmount} className={small} />
            <select name={`cost${i}Currency`} aria-label={t.currency} className={small}>{currencies.map((c) => <option key={c}>{c}</option>)}</select>
            <input name={`cost${i}Note`} placeholder={t.costNote} aria-label={t.costNote} className={`${small} col-span-3`} />
          </div>
        ))}
        <p className="text-xs text-ink-500">{t.approvalNote}</p>
      </fieldset>
      {state.error ? <p className="text-sm font-medium text-attention-500" role="alert">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="chamfer px-5 py-2.5 font-semibold text-paper [--cut:8px] [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)] disabled:opacity-60">{t.dispatch}</button>
    </form>
  );
}
