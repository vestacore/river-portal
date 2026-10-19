import type { Doc } from '@river/store';
import type { Listener } from './types/Listener.ts';
import type { ListenerUnit } from './types/ListenerUnit.ts';

/** Declares a listener with a typed state; the wave stores that state as a plain document. */
export function defineListener<S extends Doc>(listener: Listener<S>): ListenerUnit {
  return listener as unknown as ListenerUnit;
}
