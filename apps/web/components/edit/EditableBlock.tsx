'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { createElement, useState } from 'react';
import { editBlockAction } from '@/lib/actions/siteActions';
import type { EditorLabels } from './TiptapEditor';

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false });

type Props = {
  blockId: string;
  localeSegment: string;
  mode: 'inline' | 'rich';
  html: string;
  doc: object;
  as: string;
  className: string;
  labels: EditorLabels;
};

/** An editable region in edit mode: static until clicked, then an inline Tiptap editor. */
export function EditableBlock({ blockId, localeSegment, mode, html, doc, as, className, labels }: Props) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  if (editing) {
    return (
      <div className="relative z-10 my-1">
        <TiptapEditor
          initialDoc={doc}
          mode={mode}
          labels={labels}
          contentClassName={className}
          onCancel={() => setEditing(false)}
          onSave={async (next) => {
            const { ok } = await editBlockAction(blockId, localeSegment, next);
            if (ok) { setEditing(false); router.refresh(); }
            return ok;
          }}
        />
      </div>
    );
  }
  return createElement(as, {
    className: `${className} cursor-text rounded-lg outline-2 outline-dashed outline-offset-4 outline-sunrise-500/60 transition hover:bg-sunrise-100/40 hover:outline-sunrise-500`,
    role: 'button',
    tabIndex: 0,
    title: blockId,
    onClick: () => setEditing(true),
    onKeyDown: (e: { key: string }) => { if (e.key === 'Enter') setEditing(true); },
    dangerouslySetInnerHTML: { __html: html },
  });
}
