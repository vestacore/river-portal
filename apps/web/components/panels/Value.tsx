import Link from 'next/link';
import type { Locale } from '@river/i18n';
import { ago, count, day, money, percent, when } from '@/lib/format';
import { Icon } from '../ui/Icon';

/**
 * One value, shown the same way everywhere — in a table cell, a field of a panel, a dashboard tile.
 * Every panel speaks this one grammar of kinds, so an order's amount, a payment's status or a unit's
 * name look alike in every cabinet.
 */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';
export type Cell =
  | { kind: 'text'; value: string; sub?: string }
  | { kind: 'mono'; value: string; href?: string }
  | { kind: 'money'; minor: number; currency: string; signed?: boolean; muted?: boolean }
  | { kind: 'status'; label: string; tone: Tone }
  | { kind: 'date'; iso: string | null }
  | { kind: 'datetime'; iso: string | null }
  | { kind: 'ago'; iso: string | null; now: string }
  | { kind: 'percent'; bps: number }
  | { kind: 'count'; n: number }
  | { kind: 'unit'; name: string; href?: string; sub?: string }
  | { kind: 'instrument'; label: string; icon: string; detail?: string }
  | { kind: 'link'; label: string; href: string; sub?: string }
  | { kind: 'bar'; share: number; label: string; tone?: Tone }
  | { kind: 'tags'; items: Array<{ label: string; tone?: Tone }> }
  | { kind: 'bool'; value: boolean; yes: string; no: string }
  | { kind: 'empty' };

export const toneText: Record<Tone, string> = {
  success: 'text-teal-600', warning: 'text-sunrise-600', danger: 'text-attention-500', info: 'text-river-700', neutral: 'text-ink-500', accent: 'text-sunrise-600',
};
const toneSwatch: Record<Tone, string> = {
  success: 'bg-teal-500', warning: 'bg-sunrise-500', danger: 'bg-attention-500', info: 'bg-river-600', neutral: 'bg-ink-300', accent: 'bg-sunrise-500',
};

export function Status({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={`annot inline-flex max-w-full items-start gap-1.5 text-[0.66rem] text-ink-700 ${label.length > 24 ? '' : 'whitespace-nowrap'}`}>
      <span className={`mt-[0.42em] size-1.5 shrink-0 ${toneSwatch[tone]}`} aria-hidden="true" />{label}
    </span>
  );
}

export function Value({ cell, locale }: { cell: Cell; locale: Locale }) {
  switch (cell.kind) {
    case 'text': return <span className="min-w-0">{cell.value}{cell.sub ? <span className="annot mt-0.5 block text-[0.62rem] text-ink-500">{cell.sub}</span> : null}</span>;
    case 'mono': return cell.href ? <Link href={cell.href} className="font-mono text-[0.8rem] text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700">{cell.value}</Link> : <span className="font-mono text-[0.8rem] text-ink-700">{cell.value}</span>;
    case 'money': return <span className={`whitespace-nowrap tabular-nums ${cell.muted ? 'text-ink-500' : cell.signed && cell.minor < 0 ? 'text-attention-500' : 'text-ink-900'}`}>{cell.signed && cell.minor > 0 ? '+' : ''}{money(cell.minor, cell.currency, locale)}</span>;
    case 'status': return <Status label={cell.label} tone={cell.tone} />;
    case 'date': return cell.iso ? <span className="whitespace-nowrap tabular-nums text-ink-700">{day(cell.iso, locale)}</span> : <span className="text-ink-300">—</span>;
    case 'datetime': return cell.iso ? <span className="whitespace-nowrap tabular-nums text-ink-700">{when(cell.iso, locale)}</span> : <span className="text-ink-300">—</span>;
    case 'ago': return cell.iso ? <span className="whitespace-nowrap text-ink-700" title={when(cell.iso, locale)}>{ago(cell.iso, cell.now, locale)}</span> : <span className="text-ink-300">—</span>;
    case 'percent': return <span className="tabular-nums text-ink-900">{percent(cell.bps, locale)}</span>;
    case 'count': return <span className="tabular-nums text-ink-900">{count(cell.n, locale)}</span>;
    case 'unit': return (
      <span className="min-w-0">
        {cell.href ? <Link href={cell.href} className="text-ink-900 underline decoration-graphite/30 underline-offset-2 hover:decoration-sunrise-500">{cell.name}</Link> : <span className="text-ink-900">{cell.name}</span>}
        {cell.sub ? <span className="annot mt-0.5 block text-[0.62rem] text-ink-500">{cell.sub}</span> : null}
      </span>
    );
    case 'instrument': return <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 text-ink-900"><Icon name={cell.icon} className="size-4 shrink-0 text-ink-500" /><span className="whitespace-nowrap">{cell.label}</span>{cell.detail ? <span className="min-w-0 truncate font-mono text-[0.75rem] text-ink-500">{cell.detail}</span> : null}</span>;
    case 'link': return <span><Link href={cell.href} className="text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700">{cell.label}</Link>{cell.sub ? <span className="annot mt-0.5 block text-[0.62rem] text-ink-500">{cell.sub}</span> : null}</span>;
    case 'bar': return (
      <span className="flex min-w-[6rem] items-center gap-2">
        <span className="h-1.5 flex-1 bg-graphite/10"><span className={`block h-full ${toneSwatch[cell.tone ?? 'info']}`} style={{ width: `${Math.max(1, Math.min(100, cell.share * 100))}%` }} /></span>
        <span className="tabular-nums text-[0.8rem] text-ink-700">{cell.label}</span>
      </span>
    );
    case 'tags': return <span className="flex flex-wrap gap-1.5">{cell.items.map((i) => <span key={i.label} className={`annot border border-graphite/25 px-1.5 py-0.5 text-[0.6rem] ${i.tone ? toneText[i.tone] : 'text-ink-700'}`}>{i.label}</span>)}</span>;
    case 'bool': return <Status label={cell.value ? cell.yes : cell.no} tone={cell.value ? 'success' : 'neutral'} />;
    case 'empty': return <span className="text-ink-300">—</span>;
  }
}
