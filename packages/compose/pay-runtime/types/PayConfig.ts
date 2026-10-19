import type { RoutingRule } from '@river/pay-flow';
import type { Merchant } from './Merchant.ts';
import type { ProviderMode } from './ProviderMode.ts';

/**
 * The settings of one payment river, read from the environment (set by Pulumi in the cloud).
 * `carry` says who carries intentions across the bank: this process, right after each wave
 * ('inline'), or the functions woken by the outbox ('outbox'). `door` says where gestures enter:
 * in this process, or at the door function, which alone may write. `bankUrls` is given to the clock
 * only: where to wake a bank whose intention has waited too long. `sessionTtlMinutes` is how long a
 * provider's page may stay open before the attempt is closed as not completed.
 * Every process is given only the secrets it uses; the others are empty strings.
 */
export type PayConfig = {
  orgId: string;
  root: string;
  store: 'memory' | 'firestore';
  projectId: string | null;
  database: string;
  seed: 'demo' | 'none';
  feeBps: number;
  invoiceTtlHours: number;
  sessionTtlMinutes: number;
  routing: RoutingRule[];
  carry: 'inline' | 'outbox';
  door: { at: 'here' } | { at: 'remote'; url: string };
  bankUrls: Record<string, string>;
  publicUrl: string;
  merchants: Merchant[];
  stripe: { mode: ProviderMode; secretKey: string; webhookSecret: string };
  paypal: { mode: ProviderMode; clientId: string; secret: string; webhookId: string; apiBase: string };
};
