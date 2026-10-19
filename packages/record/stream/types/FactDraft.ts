/** What a door, a figure or a controller proposes; the stream turns drafts into facts. */
export type FactDraft = {
  type: string;
  payload: Record<string, unknown>;
};
