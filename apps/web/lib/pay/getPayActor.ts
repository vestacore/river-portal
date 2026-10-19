import { cache } from 'react';
import { cookies } from 'next/headers';
import { verifySession } from '@river/identity';
import { pickText, type Locale } from '@river/i18n';
import { getPayRuntime, listPayPersonas } from '@river/pay-runtime';
import { getRuntime } from '@river/runtime';
import type { PayActor } from './types';

/**
 * Who is acting in a merchant or payer cabinet: a demo persona from the signed `river-pay` cookie.
 * Where demo sign-in is off there are no such accounts yet, and nobody is acting (adr/records/ADR-0025).
 */
export const getPayActor = cache(async (locale: Locale = 'en-GB'): Promise<PayActor | null> => {
  const portal = await getRuntime();
  if (portal.config.auth !== 'demo') return null;
  const claims = verifySession((await cookies()).get('river-pay')?.value, portal.config.sessionSecret);
  if (!claims) return null;
  const persona = listPayPersonas((await getPayRuntime()).config).find((p) => p.id === claims.personaId);
  return persona ? { role: persona.role, ref: persona.ref, name: pickText(persona.name, locale), personaId: persona.id } : null;
});
