'use client';

import { useActionState } from 'react';
import { publishReportAction } from '../../actions';

type Labels = { publish: string; safetyTitle: string; safetyText: string; safetyAck: string };

/** Publishes a report; inside the safety delay it asks for an explicit, logged acknowledgement. */
export function PublishPanel({ reportId, t }: { reportId: string; t: Labels }) {
  const [state, action, pending] = useActionState(publishReportAction, {});
  const needsAck = state.outcome === 'safety_delay';
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="reportId" value={reportId} />
      {needsAck ? (
        <div className="border-l-2 border-attention-500 bg-attention-100 p-4 text-sm text-attention-500" role="alert">
          <p className="font-bold">{t.safetyTitle}</p>
          <p className="mt-1">{t.safetyText.replace('{days}', String(state.days ?? 0))}</p>
          <label className="mt-3 flex items-start gap-2 text-ink-900"><input type="checkbox" name="acknowledge" className="mt-0.5 size-4 accent-attention-500" />{t.safetyAck}</label>
        </div>
      ) : null}
      <button type="submit" disabled={pending} className="chamfer w-full px-5 py-3 font-bold text-white [--fill:var(--color-teal-600)] hover:[--fill:var(--color-teal-500)] disabled:opacity-60">{t.publish}</button>
    </form>
  );
}
