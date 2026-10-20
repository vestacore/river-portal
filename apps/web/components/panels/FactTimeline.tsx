import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { factDefinition, projectionLabels } from '@river/psp-facts';
import { when } from '@/lib/format';

const pathOf = (stream: string, seq: number) => (stream.startsWith('ps_') ? `/sessions/${stream}#b-${seq}` : stream.startsWith('pay_') ? `/payments/${stream}` : stream.startsWith('inv_') ? `/invoices/${stream}` : `/orders/${stream}`);

/**
 * The facts that formed a view, in order, whichever stream wrote them — an order hears its own stream,
 * its invoices', its sessions' bridges and its payments'. Each links to the stream it came from.
 */
export function FactTimeline({ entries, locale, link }: { entries: Array<{ at: string; type: string; stream: string; seq: number }>; locale: Locale; link: (path: string) => string }) {
  return (
    <ol className="relative space-y-0 border-l border-graphite/35 pl-5">
      {entries.map((e) => {
        const d = factDefinition(e.type);
        return (
          <li key={`${e.stream}${e.seq}`} className="relative py-1.5">
            <span className={`absolute -left-[1.62rem] top-3 size-2.5 rotate-45 border border-ink-900 ${d.speaker === 'door' ? 'bg-sunrise-500' : d.speaker === 'world' ? 'bg-teal-500' : 'bg-paper'}`} aria-hidden="true" />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="font-mono text-[0.72rem] text-ink-500">{when(e.at, locale)}</span>
              <Link href={link(pathOf(e.stream, e.seq))} className="text-[0.88rem] text-ink-900 hover:underline hover:decoration-sunrise-500">{pickText(d.label, locale)}</Link>
              <span className="annot text-[0.55rem] text-ink-500">{pickText(projectionLabels[d.owner], locale)} · {e.stream}#{e.seq}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
