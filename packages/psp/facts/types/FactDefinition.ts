import type { LocalisedText } from '@river/i18n';
import type { Boundary, Projection } from './Boundary.ts';
import type { FactType } from './PayloadMap.ts';
import type { Speaker } from './Speaker.ts';
import type { Stage } from './Stage.ts';

/**
 * The contract of one fact type — the documented boundary in data:
 * - `owner`: the one boundary whose stream holds it and who alone may write it;
 * - `stage`: for a session's bridges, the section of the river it stands in;
 * - `speaker`: who gives it (door, figure, world);
 * - `forms`: the projections that change when it arrives — a bridge where information forms views;
 * - `ends`: for a session's bridges, the outcome it ends the attempt with;
 * - `webhook`: released to integrators as an event.
 */
export type FactDefinition = {
  type: FactType;
  owner: Boundary;
  stage: Stage | null;
  speaker: Speaker;
  forms: readonly Projection[];
  ends: 'succeeded' | 'failed' | 'abandoned' | 'expired' | null;
  webhook: boolean;
  label: LocalisedText;
  meaning: LocalisedText;
};
