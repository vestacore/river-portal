const day = 86_400_000;

/** The Monday that starts the week of a moment, as an ISO date (`2026-09-21`), in UTC. */
export function weekOf(iso: string): string {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - ((d.getUTCDay() + 6) % 7) * day).toISOString().slice(0, 10);
}
