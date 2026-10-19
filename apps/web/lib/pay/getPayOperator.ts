import { cache } from 'react';
import { hasRole } from '@river/identity';
import type { Locale } from '@river/i18n';
import { hashToken } from '@river/kernel';
import { getIdentity } from '../getIdentity';
import type { PayOperator } from './types';

/**
 * The steward of the payment river, from the portal's own identity (IAP in the cloud, a demo persona
 * locally): a Finance Steward or an Administrator acts; an Auditor sees everything and changes nothing.
 * `id` is what enters a stream when a steward acts. A stream is append-only, so it must hold no
 * personal data: a member of staff is named there by a fingerprint of their e-mail address — enough
 * to tell who acted, for someone who knows the staff list — never by the address itself.
 */
export const getPayOperator = cache(async (locale: Locale = 'en-GB'): Promise<PayOperator | null> => {
  const identity = await getIdentity(locale);
  if (!identity || !hasRole(identity, 'finance_steward', 'administrator', 'auditor')) return null;
  const id = identity.personaId ?? `staff-${hashToken((identity.email ?? identity.name).toLowerCase()).slice(0, 12)}`;
  return { id, name: identity.name, canAct: hasRole(identity, 'finance_steward', 'administrator') };
});
