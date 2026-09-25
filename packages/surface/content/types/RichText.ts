import type { RichDoc } from './RichDoc.ts';

/** Editable text: the structured document plus its server-rendered, sanitised HTML. */
export type RichText = { doc: RichDoc; html: string };
