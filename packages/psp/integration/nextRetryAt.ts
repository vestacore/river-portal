const minutes = [1, 5, 30, 120, 720, 1_440];

/** When a failed delivery is tried again: 1, 5, 30 minutes, 2 and 12 hours, a day — then never. */
export function nextRetryAt(attempt: number, at: string): string | null {
  const wait = minutes[attempt - 1];
  return wait === undefined ? null : new Date(Date.parse(at) + wait * 60_000).toISOString();
}
