/** ISO instant `hours` after `iso` (negative values go back in time). */
export function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}
