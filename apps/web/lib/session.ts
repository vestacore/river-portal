import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { segmentForLocale, type Locale } from '@river/i18n';
import { personaActor, type Actor } from '@river/psp-runtime';
import { world } from './world';

type PersonActor = Extract<Actor, { kind: 'person' }>;

/** The person acting on this request, in the profile they chose (a cookie naming one of their grants), or null. */
export const currentActor = cache(async (): Promise<PersonActor | null> => {
  const raw = (await headers()).get('x-river-auth');
  if (!raw) return null;
  try {
    const auth = JSON.parse(raw) as { personaId?: string };
    if (!auth.personaId) return null;
    const grantId = (await cookies()).get('psp-profile')?.value ?? null;
    return personaActor(world(), auth.personaId, grantId, new Date().toISOString());
  } catch {
    return null;
  }
});

/** The actor of a cabinet page; without one the visitor is sent to choose a demo profile. */
export async function requireActor(locale: Locale): Promise<PersonActor> {
  const actor = await currentActor();
  if (!actor) redirect(`/${segmentForLocale(locale)}/demo`);
  return actor;
}
