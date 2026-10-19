/**
 * Reads a decimal amount ("120", "120.5", "120.50") as minor units, without floating point.
 * Returns null for anything else — more than two decimals, signs, separators, letters.
 */
export function parseAmount(text: string): number | null {
  const match = /^(\d{1,9})(?:[.,](\d{1,2}))?$/.exec(text.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}
