import { resolveCheckout, type CheckoutConfig } from '@river/psp-checkout';
import type { Currency } from '@river/psp-facts';
import { effectiveFor } from './effectiveFor.ts';
import { merchantOf } from './merchantOf.ts';
import { regionOf } from './regionOf.ts';
import type { World } from './types/World.ts';

/** The pay page of a unit for an invoice in a currency, as the unit's effective policies make it. */
export function checkoutFor(world: World, unitId: string, currency: Currency): CheckoutConfig {
  const merchantId = merchantOf(world, unitId);
  const merchant = world.units.find((u) => u.id === merchantId);
  const profile = world.profiles[merchantId] ?? world.profiles[unitId];
  return resolveCheckout({
    unitId, merchantName: merchant?.name ?? { 'en-GB': unitId, uk: unitId }, supportEmail: profile?.supportEmail ?? 'support@river-pay.example',
    supportPhone: profile?.supportPhone ?? '', returnUrl: profile?.website ? `https://${profile.website}` : '/',
    effective: effectiveFor(world, unitId), currency, region: regionOf(world, unitId),
  });
}
