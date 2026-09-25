/** Kinds of public feed item. */
export const snippetKinds = ['delivery', 'thanks', 'costs', 'milestone', 'update'] as const;
export type SnippetKind = (typeof snippetKinds)[number];
