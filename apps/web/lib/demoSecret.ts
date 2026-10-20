/**
 * The secret that signs demo sessions. A deployment sets `RIVER_SESSION_SECRET`; a development run
 * falls back to a local one. A production build without a secret has no demo sign-in at all.
 */
export function demoSecret(): string {
  return process.env.RIVER_SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'river-local-demo-secret');
}
