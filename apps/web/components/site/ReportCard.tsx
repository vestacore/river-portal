import Link from 'next/link';
import { formatDate, oblastName, pickText, type Locale } from '@river/i18n';
import type { ReportCard as Report } from '@river/pages';
import type { Dictionary } from '@/lib/dictionary/types';
import { href } from '@/lib/href';
import { Icon } from '../ui/Icon';

/** A published report as a row in a register. */
export function ReportCard({ report, locale, dict }: { report: Report; locale: Locale; dict: Dictionary }) {
  return (
    <Link href={href(locale, `/reports/${report.id}`)} className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-graphite/25 py-5 first:border-t">
      <span className="min-w-0">
        <span className="annot block text-ink-500">{dict.report.kicker} · {oblastName(report.oblastId, locale)} · {formatDate(report.publishedAt, locale)}</span>
        <span className="mt-1.5 block text-lg font-semibold text-ink-900 group-hover:text-river-700">{pickText(report.title, locale)}</span>
      </span>
      <Icon name="arrow" className="size-5 text-ink-900 transition group-hover:translate-x-1" />
    </Link>
  );
}
