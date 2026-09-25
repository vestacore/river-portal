import type { ReactNode } from 'react';

/** Label, hint and error around a form control. */
export function Field({ label, hint, error, children, htmlFor, optional }: { label: ReactNode; hint?: ReactNode; error?: string; children: ReactNode; htmlFor?: string; optional?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block font-semibold text-ink-900">
        {label} {optional ? <span className="text-sm font-normal text-ink-500">({optional})</span> : null}
      </label>
      {hint ? <p className="text-sm text-ink-500">{hint}</p> : null}
      {children}
      {error ? <p className="text-sm font-medium text-attention-500" role="alert">{error}</p> : null}
    </div>
  );
}

export const inputClass =
  'w-full border-0 bg-white px-4 py-3 text-ink-900 ring-1 ring-graphite/30 placeholder:text-ink-300 focus:ring-2 focus:ring-ink-900 aria-[invalid=true]:ring-attention-500';
