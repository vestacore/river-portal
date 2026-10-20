import type { FactType, InstrumentId } from '@river/psp-facts';
import { findInstrument } from '@river/psp-instruments';

/**
 * The bridges an attempt will cross after screening and routing, for its instrument: the instrument's
 * own course, where a card passed without a challenge goes straight to `authentication.Passed`.
 */
export function courseFor(instrument: InstrumentId, challenge: boolean): FactType[] {
  const course = [...findInstrument(instrument).course];
  if (instrument === 'card' && !challenge) return course.filter((type) => type !== 'authentication.Challenged');
  return course;
}
