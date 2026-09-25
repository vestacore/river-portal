'use client';

import { useActionState } from 'react';
import { CheckRow } from '../ui/CheckRow';
import { Field, inputClass } from '../ui/Field';
import { Icon } from '../ui/Icon';
import type { Dictionary } from '@/lib/dictionary/types';

export type ConfirmState = { done: boolean; error?: string };

/**
 * Confirmation of receipt with optional thanks; each use of the thanks is a separate consent. Used
 * through the private tracking link and in "My river"; `action` decides which need is confirmed.
 */
export function ConfirmForm({ action: confirm, localeSegment, t }: { action: (prev: ConfirmState, form: FormData) => Promise<ConfirmState>; localeSegment: string; t: Dictionary['track'] }) {
  const [state, action, pending] = useActionState(confirm, { done: false });
  if (state.done) {
    return (
      <div className="chamfer p-7 text-center [--cut:24px] [--fill:var(--color-teal-100)]">
        <Icon name="heart" className="mx-auto size-10 text-teal-600" />
        <h2 className="mt-3 text-2xl font-bold">{t.confirmedTitle}</h2>
        <p className="mt-2 text-ink-700">{t.confirmedText}</p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="localeSegment" value={localeSegment} />
      <h2 className="text-2xl font-bold">{t.confirmTitle}</h2>
      <CheckRow name="received" invalid={state.error === 'received'}>{t.received}</CheckRow>
      <Field label={t.thanks} hint={t.thanksHint} htmlFor="thanks">
        <textarea id="thanks" name="thanks" rows={4} className={inputClass} />
      </Field>
      <div className="space-y-3">
        <CheckRow name="shareWithParticipants">{t.shareWithParticipants}</CheckRow>
        <CheckRow name="showOnWall">{t.showOnWall}</CheckRow>
      </div>
      <Field label={t.note} htmlFor="note"><input id="note" name="note" className={inputClass} /></Field>
      <button type="submit" disabled={pending} className="chamfer inline-flex items-center gap-2 px-7 py-3.5 font-bold text-white transition-colors [--fill:var(--color-teal-600)] hover:[--fill:var(--color-teal-500)] disabled:opacity-60">
        <Icon name="check" />{t.confirm}
      </button>
    </form>
  );
}
