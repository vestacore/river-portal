import type { Rail } from '@river/psp-facts';
import { acquirers } from './data/acquirers.ts';
import type { Acquirer } from './types/Instrument.ts';

/** The acquirers that carry a rail in a region, best approval first. */
export function acquirersFor(rail: Rail, region: 'UA' | 'EU'): Acquirer[] {
  return acquirers.filter((a) => a.rails.includes(rail) && a.regions.includes(region)).sort((a, b) => b.approvalBps - a.approvalBps);
}
