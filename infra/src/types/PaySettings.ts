import type * as pulumi from '@pulumi/pulumi';

/**
 * Settings of the payment river (adr/records/ADR-0025), read from Pulumi config. The river is
 * created only when `enabled`. Secrets are Pulumi config secrets, set by the owner with
 * `pulumi config set --secret`; each reaches only the one function that uses it.
 */
export type PaySettings = {
  enabled: boolean;
  database: string;
  feeBps: number;
  invoiceTtlHours: number;
  sessionTtlMinutes: number;
  stripeMode: 'off' | 'simulated' | 'connected';
  paypalMode: 'off' | 'simulated' | 'connected';
  paypalApiBase: string;
  merchants: string;
  routing: string | undefined;
  allowSimulated: boolean;
  allowLive: boolean;
  tickSchedule: string;
  secrets: {
    stripeSecretKey: pulumi.Output<string> | undefined;
    stripeWebhookSecret: pulumi.Output<string> | undefined;
    paypalClientId: pulumi.Output<string> | undefined;
    paypalSecret: pulumi.Output<string> | undefined;
    paypalWebhookId: pulumi.Output<string> | undefined;
  };
};
