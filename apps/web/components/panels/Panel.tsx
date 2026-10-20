import type { ReactNode } from 'react';

/**
 * The frame every panel sits in: a hairline box with a lettered title strip, an optional note and the
 * panel's actions on the right. `tone` tints the background for panels that wait for a decision.
 */
export function Panel({ title, note, actions, children, tone = 'plain', className = '', id, flush = false }: { title?: ReactNode; note?: ReactNode; actions?: ReactNode; children: ReactNode; tone?: 'plain' | 'deep' | 'attention' | 'ink'; className?: string; id?: string; flush?: boolean }) {
  const bg = { plain: 'bg-paper', deep: 'bg-paper-deep', attention: 'bg-sunrise-100', ink: 'bg-ink-900 text-paper' }[tone];
  return (
    <section id={id} className={`min-w-0 border border-graphite/25 ${bg} ${className}`}>
      {title || actions ? (
        <header className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b ${tone === 'ink' ? 'border-paper/15' : 'border-graphite/20'} px-4 py-2.5`}>
          <div className="min-w-0">
            {title ? <h2 className={`annot text-[0.7rem] ${tone === 'ink' ? 'text-paper' : 'text-ink-900'}`}>{title}</h2> : null}
            {note ? <p className={`mt-0.5 text-[0.82rem] ${tone === 'ink' ? 'text-paper/70' : 'text-ink-500'}`}>{note}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={flush ? '' : 'p-4'}>{children}</div>
    </section>
  );
}
