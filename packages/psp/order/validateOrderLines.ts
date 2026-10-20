import type { OrderLine } from '@river/psp-facts';

/**
 * What is wrong with an order's lines, or an empty list. A line's total is its quantity times its
 * unit price — stated, not trusted; an order has at least one line and a positive total.
 */
export function validateOrderLines(lines: readonly OrderLine[]): string[] {
  const errors: string[] = [];
  if (lines.length === 0) errors.push('lines: an order has at least one line');
  lines.forEach((line, i) => {
    if (!line.sku) errors.push(`lines[${i}].sku: required`);
    if (!Number.isInteger(line.quantity) || line.quantity < 1) errors.push(`lines[${i}].quantity: a whole number from 1`);
    if (!Number.isInteger(line.unitMinor) || line.unitMinor < 1) errors.push(`lines[${i}].unitMinor: a positive whole number of minor units`);
    if (line.totalMinor !== line.quantity * line.unitMinor) errors.push(`lines[${i}].totalMinor: must equal quantity × unitMinor`);
  });
  return errors;
}
