'use client';

import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

export type EditorLabels = { save: string; saving: string; cancel: string; saved: string; failed: string; bold: string; italic: string; list: string; heading: string };

type Props = {
  initialDoc: object;
  mode: 'inline' | 'rich';
  labels: EditorLabels;
  onSave: (doc: object) => Promise<boolean>;
  onCancel?: () => void;
  contentClassName?: string;
  saveLabel?: string;
};

/** Headless Tiptap editor with a small toolbar; only the node types the server renders are enabled. */
export default function TiptapEditor({ initialDoc, mode, labels, onSave, onCancel, contentClassName = '', saveLabel }: Props) {
  const rich = mode === 'rich';
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: rich ? { levels: [2, 3] } : false,
        bulletList: rich ? {} : false,
        orderedList: rich ? {} : false,
        listItem: rich ? {} : false,
        listKeymap: rich ? {} : false,
        blockquote: rich ? {} : false,
        link: rich ? { openOnClick: false, autolink: true, protocols: ['https', 'mailto'] } : false,
        code: false, codeBlock: false, horizontalRule: false, strike: false, underline: false,
      }),
    ],
    content: initialDoc,
    immediatelyRender: false,
    autofocus: 'end',
    editorProps: { attributes: { class: `tiptap min-h-[1.5em] ${contentClassName}` } },
  });
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({ bold: e?.isActive('bold') ?? false, italic: e?.isActive('italic') ?? false, list: e?.isActive('bulletList') ?? false, heading: e?.isActive('heading') ?? false }),
  });

  async function save() {
    if (!editor) return;
    setStatus('saving');
    const ok = await onSave(editor.getJSON());
    setStatus(ok ? 'saved' : 'failed');
  }

  const tool = (label: string, on: boolean | undefined, run: () => void, text: string) => (
    <button type="button" onClick={run} aria-pressed={on} aria-label={label} title={label}
      className={`min-w-8 rounded-lg px-2 py-1 text-sm font-semibold transition ${on ? 'bg-river-700 text-white' : 'text-river-800 hover:bg-river-100'}`}>{text}</button>
  );

  return (
    <div className="bg-white text-left ring-2 ring-sunrise-500">
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
        {tool(labels.bold, active?.bold, () => editor?.chain().focus().toggleBold().run(), 'B')}
        {tool(labels.italic, active?.italic, () => editor?.chain().focus().toggleItalic().run(), 'I')}
        {rich ? tool(labels.heading, active?.heading, () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), 'H') : null}
        {rich ? tool(labels.list, active?.list, () => editor?.chain().focus().toggleBulletList().run(), '•') : null}
        <span className="ml-auto flex items-center gap-2 pl-2">
          {status === 'saved' ? <span className="text-xs font-medium text-teal-600">{labels.saved}</span> : null}
          {status === 'failed' ? <span className="text-xs font-medium text-attention-500">{labels.failed}</span> : null}
          {onCancel ? <button type="button" onClick={onCancel} className="px-3 py-1 text-sm font-medium text-ink-500 hover:text-ink-900">{labels.cancel}</button> : null}
          <button type="button" onClick={save} disabled={status === 'saving'} className="chamfer px-4 py-1 text-sm font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)] disabled:opacity-60">
            {status === 'saving' ? labels.saving : (saveLabel ?? labels.save)}
          </button>
        </span>
      </div>
      <div className="px-4 py-3"><EditorContent editor={editor} /></div>
    </div>
  );
}
