import type { Doc } from '@river/store';
import type { FactDraft } from '@river/stream';

/** A joiner as the wave sees it: its scope is a record of listener states. Made by `defineJoiner`. */
export type JoinerUnit = {
  id: string;
  demands: Readonly<Record<string, string>>;
  round?: (scope: Readonly<Record<string, Doc>>) => string;
  emit: (scope: Readonly<Record<string, Doc>>) => readonly FactDraft[];
};
