import Link from 'next/link';
import { formatDate, oblastName, pickText } from '@river/i18n';
import { readReports } from '@river/reports';
import { getRuntime } from '@river/runtime';
import { Badge } from '@/components/ui/Badge';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { resolveLocale } from '@/lib/resolveLocale';

/** Reports: private drafts and published ones. */
export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = getDictionary(locale).studio;
  const runtime = await getRuntime();
  const reports = await readReports(runtime.store, runtime.config.orgId);
  return (
    <ul className="grid gap-3">
      {reports.map((r) => (
        <li key={r.id}>
          <Link href={href(locale, `/studio/reports/${r.id}`)} className="flex flex-wrap items-center gap-3 border-t border-graphite/60 pt-3 hover:ring-teal-500">
            <b className="text-ink-900">{pickText(r.title, locale)}</b>
            <Badge tone={r.status === 'published' ? 'teal' : r.status === 'draft' ? 'sunrise' : 'ink'}>{t.reportStatus[r.status]}</Badge>
            <span className="ml-auto text-sm text-ink-500">{oblastName(r.facts.oblastId, locale)} · {formatDate(r.createdAt, locale)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
