import type { SessionView } from './types/SessionView.ts';

/** Whether an attempt has ended — reached the mouth, failed, was left, or outlived its time. */
export function isSessionClosed(view: SessionView): boolean {
  return view.outcome === 'succeeded' || view.outcome === 'failed' || view.outcome === 'abandoned' || view.outcome === 'expired';
}
