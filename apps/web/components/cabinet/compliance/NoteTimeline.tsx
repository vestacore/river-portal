import type { Locale } from '@river/i18n';
import { when } from '@/lib/format';

/**
 * A record's own log in order — the notes on an alert, the steps of a contract — each line with its
 * moment and who wrote it, drawn like the facts of a stream.
 */
export function NoteTimeline({ entries, locale, empty }: { entries: Array<{ at: string; by: string; text: string }>; locale: Locale; empty: string }) {
  if (entries.length === 0) return <p className="text-ink-500">{empty}</p>;
  return (
    <ol className="relative space-y-0 border-l border-graphite/35 pl-5">
      {entries.map((e, i) => (
        <li key={`${e.at}${i}`} className="relative py-1.5">
          <span className="absolute -left-[1.62rem] top-3 size-2.5 rotate-45 border border-ink-900 bg-sunrise-500" aria-hidden="true" />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="font-mono text-[0.72rem] text-ink-500">{when(e.at, locale)}</span>
            <span className="text-[0.88rem] text-ink-900">{e.text}</span>
            <span className="annot text-[0.55rem] text-ink-500">{e.by}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
