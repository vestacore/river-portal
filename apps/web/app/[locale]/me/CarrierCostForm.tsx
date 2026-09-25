'use client';

import { useActionState } from 'react';
import { inputClass } from '@/components/ui/Field';
import { carrierCostAction, type CarrierCostState } from './actions';

type Labels = { addCost: string; costSent: string; costAmount: string; currency: string; costNote: string; kind: string; error: string };

/** A carrier's cost on the way: kind, amount and currency, with a short note. */
export function CarrierCostForm({ flowId, t, kinds, currencies }: { flowId: string; t: Labels; kinds: Array<[string, string]>; currencies: string[] }) {
  const [state, action, pending] = useActionState<CarrierCostState, FormData>(carrierCostAction, { sent: false });
  const small = `${inputClass} py-2`;
  return (
    <form action={action} className="space-y-2 border border-graphite/20 bg-paper-deep/50 p-3">
      <input type="hidden" name="flowId" value={flowId} />
      <p className="annot text-ink-700">{t.addCost}</p>
      <div className="grid grid-cols-[1fr_6.5rem_5.5rem] gap-2">
        <select name="kind" aria-label={t.kind} className={small}>{kinds.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <input name="amount" inputMode="decimal" required placeholder={t.costAmount} aria-label={t.costAmount} className={small} />
        <select name="currency" aria-label={t.currency} className={small}>{currencies.map((c) => <option key={c}>{c}</option>)}</select>
        <input name="note" placeholder={t.costNote} aria-label={t.costNote} className={`${small} col-span-3`} />
      </div>
      {state.error ? <p className="text-sm font-medium text-attention-500" role="alert">{t.error}</p> : null}
      {state.sent ? <p className="text-sm font-medium text-teal-600" role="status">{t.costSent}</p> : null}
      <button type="submit" disabled={pending} className="chamfer px-4 py-2 text-sm font-semibold text-paper [--cut:6px] [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)] disabled:opacity-60">{t.addCost}</button>
    </form>
  );
}
