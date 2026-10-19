/** A provider's decimal string ("120.00") as minor units; null when it is not a plain two-place amount. */
export function toMinor(decimal: unknown): number | null {
  const match = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(String(decimal ?? ''));
  return match ? Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0')) : null;
}
