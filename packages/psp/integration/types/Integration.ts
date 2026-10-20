import type { FactType } from '@river/psp-facts';

/** An API key of a unit. Only a prefix and the last four are ever shown after creation. */
export type ApiKey = {
  id: string;
  unitId: string;
  label: string;
  mode: 'test' | 'live';
  kind: 'secret' | 'publishable';
  prefix: string;
  last4: string;
  createdAt: string;
  createdBy: string;
  lastUsedAt: string | null;
  status: 'active' | 'revoked';
};

/** Where a unit wants to hear about facts. `events` are fact types released as webhooks, or `*` for all of them. */
export type WebhookEndpoint = {
  id: string;
  unitId: string;
  url: string;
  events: ReadonlyArray<FactType | '*'>;
  status: 'enabled' | 'disabled';
  secretHint: string;
  createdAt: string;
  description: string;
};

/** One attempt to deliver one event to one endpoint. */
export type WebhookDelivery = {
  id: string;
  endpointId: string;
  eventId: string;
  type: FactType;
  subjectId: string;
  at: string;
  attempt: number;
  status: 'delivered' | 'failed' | 'pending';
  httpStatus: number | null;
  durationMs: number;
  error: string | null;
  nextRetryAt: string | null;
};

/** A released fact: what an integrator receives. The id names the fact in its stream exactly. */
export type WebhookEvent = {
  id: string;
  type: FactType;
  created: string;
  stream: string;
  data: Record<string, unknown>;
};

/** One call to the API. Bodies are not kept; a summary is. */
export type ApiLogEntry = {
  id: string;
  at: string;
  unitId: string;
  keyId: string;
  mode: 'test' | 'live';
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  status: number;
  durationMs: number;
  idempotencyKey: string | null;
  summary: string;
};
