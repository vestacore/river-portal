import type { ReactNode } from 'react';
import { Sparkline } from '../charts/Sparkline';
import { toneText, type Tone } from './Value';

/** A dashboard tile: what is measured, the figure, a note under it, and its last days as a sparkline. */
export function Metric({ label, value, note, tone, spark, href }: { label: string; value: ReactNode; note?: ReactNode; tone?: Tone; spark?: number[]; href?: string }) {
  const body = (
    <>
      <p className="annot text-[0.62rem] text-ink-500">{label}</p>
      <p className={`mt-2 text-[1.45rem] font-semibold leading-tight tabular-nums ${tone ? toneText[tone] : 'text-ink-900'}`}>{value}</p>
      {note ? <p className="mt-1 text-[0.8rem] text-ink-500">{note}</p> : null}
      {spark && spark.length > 1 ? <div className="mt-3"><Sparkline values={spark} /></div> : null}
    </>
  );
  return href ? <a href={href} className="block border border-graphite/25 bg-paper p-4 hover:bg-paper-deep">{body}</a> : <div className="border border-graphite/25 bg-paper p-4">{body}</div>;
}
