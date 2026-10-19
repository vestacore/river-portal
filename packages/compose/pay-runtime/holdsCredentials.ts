import type { PayConfig } from './types/PayConfig.ts';

/**
 * Whether this process can carry a controller's intentions across: a stand-in needs nothing; a
 * connected provider needs its API credentials, which only its own function is given. Asked before
 * an attempt is counted, so a misplaced message never turns into a failed payment.
 */
export function holdsCredentials(config: PayConfig, controller: string): boolean {
  if (controller === 'stripe') return config.stripe.mode === 'simulated' || (config.stripe.mode === 'connected' && config.stripe.secretKey !== '');
  if (controller === 'paypal') return config.paypal.mode === 'simulated' || (config.paypal.mode === 'connected' && config.paypal.clientId !== '' && config.paypal.secret !== '');
  return false;
}
