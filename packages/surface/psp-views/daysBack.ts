/** The last `days` calendar days up to `now` (UTC), oldest first, as YYYY-MM-DD. */
export function daysBack(days: number, now: string): string[] {
  const end = Date.parse(now.slice(0, 10));
  return Array.from({ length: days }, (_, i) => new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10));
}
