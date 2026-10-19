import type { Doc } from '@river/store';
import type { Joiner } from './types/Joiner.ts';
import type { JoinerUnit } from './types/JoinerUnit.ts';

/** Declares a joiner with a typed scope: each demand names the listener whose state it gathers. */
export function defineJoiner<Scope extends Record<string, Doc>>(joiner: Joiner<Scope>): JoinerUnit {
  return joiner as unknown as JoinerUnit;
}
