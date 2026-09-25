import type { ReactNode } from 'react';

/** Section title with a numbered annotation (§ 02 ———), an optional lead and an action. */
export function SectionHeading({ index, kicker, title, lead, action }: { index?: string; kicker?: ReactNode; title: ReactNode; lead?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        {index || kicker ? (
          <p className="annot mb-4 flex items-center gap-3 text-ink-500">
            {index ? <span className="text-sunrise-600">§ {index}</span> : null}
            <span className="h-px w-12 bg-graphite/40" aria-hidden="true" />
            {kicker ? <span>{kicker}</span> : null}
          </p>
        ) : null}
        <div className="text-3xl font-semibold leading-tight text-ink-900 sm:text-[2.6rem]">{title}</div>
        {lead ? <div className="mt-4 text-lg text-ink-500">{lead}</div> : null}
      </div>
      {action}
    </div>
  );
}
