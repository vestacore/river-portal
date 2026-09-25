import type { ReactNode } from 'react';

/** Label–value rows ruled like a drawing's title block. Empty values are left out. */
export function FactTable({ rows, className = '' }: { rows: Array<[string, ReactNode]>; className?: string }) {
  const shown = rows.filter(([, v]) => v !== '' && v !== null && v !== undefined);
  return (
    <dl className={`border-t border-graphite/60 ${className}`}>
      {shown.map(([label, value]) => (
        <div key={label} className="grid gap-1 border-b border-graphite/20 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="annot pt-0.5 text-ink-500">{label}</dt>
          <dd className="text-ink-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
