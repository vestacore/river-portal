import type { Fact } from '@river/stream';
import type { FactType, PayloadMap } from './PayloadMap.ts';

/**
 * One fact of the PSP: the record layer's `Fact` (stream, dense seq, wave, origin, causedBy, at) with a
 * typed payload. `PspFact<'capture.Completed'>` is exactly that fact; `PspFact` is any of them.
 */
export type PspFact<T extends FactType = FactType> = T extends FactType ? Fact<PayloadMap[T]> & { type: T } : never;

/** A fact before it enters a stream: its type and payload. */
export type PspDraft<T extends FactType = FactType> = T extends FactType ? { type: T; payload: PayloadMap[T] } : never;
