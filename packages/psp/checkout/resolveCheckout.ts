import type { LocalisedText, Locale } from '@river/i18n';
import type { Currency, InstrumentId } from '@river/psp-facts';
import { instrumentsFor } from '@river/psp-instruments';
import { policyValue, type EffectivePolicy } from '@river/psp-units';
import type { CheckoutConfig } from './types/Checkout.ts';

const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

/**
 * The pay page of a unit for one invoice: instruments its effective policy allows, carried in the
 * invoice's currency and region, in its preferred order; its accent, languages and session time; and
 * whether it shows the payer where the money goes.
 */
export function resolveCheckout(input: {
  unitId: string; merchantName: LocalisedText; supportEmail: string; supportPhone: string; returnUrl: string;
  effective: readonly EffectivePolicy[]; currency: Currency; region: 'UA' | 'EU';
}): CheckoutConfig {
  const allowed = list(policyValue(input.effective, 'instruments.allowed'));
  const order = list(policyValue(input.effective, 'checkout.instrumentOrder'));
  const languages = list(policyValue(input.effective, 'checkout.languages')).filter((l): l is Locale => l === 'uk' || l === 'en-GB');
  const name = input.merchantName['en-GB'] || input.merchantName.uk;
  return {
    unitId: input.unitId,
    merchantName: input.merchantName,
    monogram: name.split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase(),
    supportEmail: input.supportEmail,
    supportPhone: input.supportPhone,
    accent: String(policyValue(input.effective, 'checkout.accent') ?? '#0d378c'),
    instruments: instrumentsFor(allowed, order, input.currency, input.region).map((d) => d.id as InstrumentId).filter((id) => id !== 'bonus_points'),
    collectEmail: policyValue(input.effective, 'checkout.collect.email') !== false,
    sessionMinutes: Number(policyValue(input.effective, 'checkout.session.minutes') ?? 30),
    showSplit: policyValue(input.effective, 'checkout.showSplit') === true,
    loyalty: policyValue(input.effective, 'checkout.loyalty') === true && allowed.includes('bonus_points'),
    languages: languages.length > 0 ? languages : ['uk', 'en-GB'],
    returnUrl: input.returnUrl,
  };
}
