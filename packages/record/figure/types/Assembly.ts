import type { Controller } from './Controller.ts';
import type { JoinerUnit } from './JoinerUnit.ts';
import type { ListenerUnit } from './ListenerUnit.ts';
import type { Reading } from './Reading.ts';

/** The declared record of what one river mounts: every function it runs is named here, once. */
export type Assembly = {
  listeners: readonly ListenerUnit[];
  joiners: readonly JoinerUnit[];
  controllers: readonly Controller[];
  readings: readonly Reading[];
};
