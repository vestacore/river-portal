import type { Assembly, Controller } from '@river/figure';
import { payFigure } from '@river/pay-flow';
import { paypalProvider, simulatedProvider, stripeProvider, type FetchLike } from '@river/pay-providers';
import { orderReading } from '@river/pay-views';
import type { PayConfig } from './types/PayConfig.ts';

/**
 * The declared record of what this payment river mounts: the figure, the banks and the surface.
 * A provider is mounted as itself or as its stand-in, under the same name, so the figure and the
 * outbox cannot tell them apart; a provider that is off is not mounted at all.
 */
export function payAssembly(config: PayConfig, fetch?: FetchLike): Assembly {
  const returnUrl = (orderId: string) => `${config.publicUrl}/pay/return/${orderId}`;
  const sessionUrl = (sessionRef: string) => `${config.publicUrl}/pay/sim/${encodeURIComponent(sessionRef)}`;
  const merchant = (id: string) => config.merchants.find((m) => m.id === id);
  const wire = fetch ? { fetch } : {};
  const controllers: Controller[] = [];

  if (config.stripe.mode === 'connected') controllers.push(stripeProvider({ secretKey: config.stripe.secretKey, returnUrl, accountFor: (id) => merchant(id)?.stripeAccount ?? null, sessionTtlMinutes: config.sessionTtlMinutes, ...wire }));
  else if (config.stripe.mode === 'simulated') controllers.push(simulatedProvider('stripe', sessionUrl));

  if (config.paypal.mode === 'connected') controllers.push(paypalProvider({ clientId: config.paypal.clientId, secret: config.paypal.secret, apiBase: config.paypal.apiBase, returnUrl, payeeFor: (id) => merchant(id)?.paypalMerchantId ?? null, ...wire }));
  else if (config.paypal.mode === 'simulated') controllers.push(simulatedProvider('paypal', sessionUrl));

  // The figure routes only to what is mounted here, so it never writes an intention that no bank would carry.
  const mounted = (['stripe', 'paypal'] as const).filter((name) => config[name].mode !== 'off');
  return { ...payFigure({ feeBps: config.feeBps, invoiceTtlHours: config.invoiceTtlHours, routing: config.routing, mounted }), controllers, readings: [orderReading] };
}
