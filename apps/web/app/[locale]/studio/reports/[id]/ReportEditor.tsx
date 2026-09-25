'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { EditorLabels } from '@/components/edit/TiptapEditor';
import { reviseReportAction } from '../../actions';

const TiptapEditor = dynamic(() => import('@/components/edit/TiptapEditor'), { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-2xl bg-white" /> });

type Version = { segment: string; label: string; title: string; doc: object };

/** Edits a report's title and body per locale, in place, with Tiptap. */
export function ReportEditor({ reportId, versions, labels, titleLabel, saveLabel }: { reportId: string; versions: Version[]; labels: EditorLabels; titleLabel: string; saveLabel: string }) {
  const [active, setActive] = useState(versions[0]?.segment ?? 'en-gb');
  const [titles, setTitles] = useState(Object.fromEntries(versions.map((v) => [v.segment, v.title])));
  const router = useRouter();
  const version = versions.find((v) => v.segment === active);
  return (
    <div>
      <div className="mb-5 flex gap-6 border-b border-graphite/25" role="tablist">
        {versions.map((v) => (
          <button key={v.segment} type="button" role="tab" aria-selected={active === v.segment} onClick={() => setActive(v.segment)}
            className={`-mb-px border-b-2 px-1 py-3 text-sm font-semibold ${active === v.segment ? 'border-sunrise-500 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-900'}`}>{v.label}</button>
        ))}
      </div>
      {version ? (
        <div key={version.segment} className="space-y-3">
          <label className="block text-sm font-semibold">{titleLabel}
            <input value={titles[version.segment] ?? ''} onChange={(e) => setTitles({ ...titles, [version.segment]: e.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 font-display text-xl font-bold text-river-900 ring-1 ring-line focus:ring-2 focus:ring-teal-500" />
          </label>
          <TiptapEditor
            initialDoc={version.doc}
            mode="rich"
            labels={labels}
            saveLabel={saveLabel}
            contentClassName="prose-river min-h-64"
            onSave={async (doc) => {
              const { ok } = await reviseReportAction(reportId, version.segment, titles[version.segment] ?? '', doc);
              if (ok) router.refresh();
              return ok;
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
