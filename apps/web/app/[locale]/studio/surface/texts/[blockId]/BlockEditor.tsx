'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { EditorLabels } from '@/components/edit/TiptapEditor';
import { editBlockAction } from '../../../actions';

const TiptapEditor = dynamic(() => import('@/components/edit/TiptapEditor'), { ssr: false, loading: () => <div className="h-40 animate-pulse bg-paper-deep" /> });

type Version = { segment: string; label: string; doc: object };

/** Edits one site text in both languages with Tiptap; the server renders and stores the HTML. */
export function BlockEditor({ blockId, mode, versions, labels }: { blockId: string; mode: 'inline' | 'rich'; versions: Version[]; labels: EditorLabels }) {
  const [active, setActive] = useState(versions[0]?.segment ?? 'en-gb');
  const router = useRouter();
  const version = versions.find((v) => v.segment === active);
  return (
    <div>
      <div className="mb-4 flex gap-6 border-b border-graphite/25" role="tablist">
        {versions.map((v) => (
          <button key={v.segment} type="button" role="tab" aria-selected={active === v.segment} onClick={() => setActive(v.segment)}
            className={`-mb-px border-b-2 px-1 py-2.5 text-sm font-semibold ${active === v.segment ? 'border-sunrise-500 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-900'}`}>{v.label}</button>
        ))}
      </div>
      {version ? (
        <TiptapEditor
          key={version.segment}
          initialDoc={version.doc}
          mode={mode}
          labels={labels}
          contentClassName={mode === 'rich' ? 'prose-river min-h-48' : 'text-2xl font-semibold'}
          onSave={async (doc) => {
            const { ok } = await editBlockAction(blockId, version.segment, doc);
            if (ok) router.refresh();
            return ok;
          }}
        />
      ) : null}
    </div>
  );
}
