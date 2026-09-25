import type { DocTransaction } from '@river/store';
import type { LogEvent } from './LogEvent.ts';

/**
 * Pure read-model builder: given one event, updates documents in the transaction.
 * The same function can later run in a Cloud Function (ADR-0011).
 */
export type Projector = {
  name: string;
  handles: readonly string[];
  project: (event: LogEvent, tx: DocTransaction) => Promise<void>;
};
