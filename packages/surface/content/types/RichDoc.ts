/** Tiptap / ProseMirror JSON. Only the node and mark types in `renderRichText` are ever rendered. */
export type RichMark = { type: string; attrs?: Record<string, unknown> };
export type RichNode = { type: string; attrs?: Record<string, unknown>; content?: RichNode[]; text?: string; marks?: RichMark[] };
export type RichDoc = { type: 'doc'; content: RichNode[] };
