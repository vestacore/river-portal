import type { Doc } from '@river/store';
import type { Fact } from '@river/stream';

/**
 * A surface (NestVM: a reading): a pure fold of a stream into one view document. It is written in
 * the same transaction as the facts it folds and can always be rebuilt from the stream.
 */
export type Reading = {
  id: string;
  hears: readonly string[];
  path: (root: string, stream: string) => string;
  project: (view: Doc | null, fact: Fact) => Doc | null;
};
