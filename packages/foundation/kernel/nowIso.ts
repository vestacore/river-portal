/** Current instant as an ISO 8601 string (UTC). */
export function nowIso(): string {
  return new Date().toISOString();
}
