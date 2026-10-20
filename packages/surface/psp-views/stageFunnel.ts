import { stages, type Stage } from '@river/psp-facts';
import type { SessionView } from '@river/psp-session';

/** How many sessions reached each stage of the river: the funnel from the source to the mouth. */
export function stageFunnel(sessions: readonly SessionView[]): Array<{ stage: Stage; reached: number }> {
  return stages.map((stage) => ({ stage, reached: sessions.filter((s) => s.reached.includes(stage)).length }));
}
