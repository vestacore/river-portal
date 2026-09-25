/** A stored document: plain JSON-compatible data (no Dates, no class instances). */
export type Doc = Record<string, unknown>;

/** A document returned from a collection query, with its id. */
export type StoredDoc<T extends Doc = Doc> = T & { id: string };
