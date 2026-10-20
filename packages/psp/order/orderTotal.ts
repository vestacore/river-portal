import type { OrderLine } from '@river/psp-facts';

/** The total of an order's lines, in minor units. Integer arithmetic only. */
export function orderTotal(lines: readonly OrderLine[]): number {
  return lines.reduce((sum, line) => sum + line.totalMinor, 0);
}
