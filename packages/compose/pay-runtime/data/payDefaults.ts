/** Defaults and bounds of the payment river's settings. The commission is in basis points (250 = 2.5%). */
export const payDefaults = {
  feeBps: 250,
  maxFeeBps: 2_000,
  invoiceTtlHours: 72,
  maxInvoiceTtlHours: 720,
  sessionTtlMinutes: 180,
  sessionGraceMinutes: 5,
  carryRounds: 8,
  staleMinutes: 5,
  paypalSandbox: 'https://api-m.sandbox.paypal.com',
} as const;
