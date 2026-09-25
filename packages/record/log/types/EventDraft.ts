import type { Visibility } from '@river/privacy';

/** What a command proposes; `commit` turns drafts into log events. */
export type EventDraft = {
  type: string;
  aggregate: { kind: string; id: string };
  payload: Record<string, unknown>;
  visibility: Visibility;
  occurredAt?: string;
};
