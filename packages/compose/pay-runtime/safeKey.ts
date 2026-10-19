/** A reference from outside — a provider's event id, a session — as one safe document-path segment. */
export function safeKey(prefix: string, value: string): string {
  return `${prefix}-${value.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 180)}`;
}
