import { cache } from 'react';
import { headers } from 'next/headers';
import type { Identity } from '@river/identity';
import type { Locale } from '@river/i18n';
import { personaIdentity } from '@river/runtime';
import { loadSettings } from './loadSettings';
import { staffRolesFor } from './staffRolesFor';

/**
 * Who is acting on this request (adr/records/ADR-0021), from the header that proxy.ts sets after
 * verifying IAP or a signed demo session; null for anonymous visitors.
 */
export const getIdentity = cache(async (locale: Locale = 'en-GB'): Promise<Identity | null> => {
  const raw = (await headers()).get('x-river-auth');
  if (!raw) return null;
  try {
    const auth = JSON.parse(raw) as { via: 'iap'; email: string } | { via: 'demo'; personaId: string };
    if (auth.via === 'iap') return { personId: null, name: auth.email, email: auth.email, roles: staffRolesFor(auth.email), via: 'iap' };
    const settings = await loadSettings();
    return personaIdentity(auth.personaId, settings.profileId, locale);
  } catch {
    return null;
  }
});
