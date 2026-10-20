import type { ReactNode } from 'react';

/** The head of a cabinet page: a kicker (where in the river), the title, a lead, and actions on the right. */
export function CabinetHead({ kicker, title, lead, actions, children }: { kicker?: ReactNode; title: ReactNode; lead?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 border-b border-graphite/20 pb-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          {kicker ? <p className="annot mb-2 flex items-center gap-2 text-[0.62rem] text-sunrise-600">{kicker}</p> : null}
          <h1 className="text-[1.75rem] font-semibold leading-tight text-ink-900">{title}</h1>
          {lead ? <div className="mt-2 text-[0.95rem] text-ink-500">{lead}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}
