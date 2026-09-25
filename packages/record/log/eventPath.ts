/** Firestore path of a log event. */
export function eventPath(orgId: string, eventId: string): string {
  return `orgs/${orgId}/events/${eventId}`;
}
