import type { Visibility } from '@river/privacy';
import type { Actor } from './Actor.ts';

/**
 * Immutable record of something that happened (spec: 02-entities/system/Log Event).
 * `type` follows `aggregate.PastTense` (spec: Canonical Parameters). Payloads hold no plaintext PII.
 */
export type LogEvent<P extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  type: string;
  aggregate: { kind: string; id: string };
  orgId: string;
  actor: Actor;
  occurredAt: string;
  recordedAt: string;
  payload: P;
  visibility: Visibility;
  correlationId: string;
  causationId: string | null;
  schemaVersion: number;
};
