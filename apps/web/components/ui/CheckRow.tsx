import type { ReactNode } from 'react';

/** A checkbox with a readable, wrapping label. */
export function CheckRow({ name, children, defaultChecked, invalid }: { name: string; children: ReactNode; defaultChecked?: boolean; invalid?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ${invalid ? 'ring-attention-500' : 'ring-line'} has-[:checked]:bg-teal-100/40`}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-5 shrink-0 rounded accent-teal-600" />
      <span className="text-[0.95rem] leading-snug text-ink-700">{children}</span>
    </label>
  );
}
