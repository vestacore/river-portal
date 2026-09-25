import { notFound } from 'next/navigation';
import { hasRole, type Identity } from '@river/identity';
import type { Locale } from '@river/i18n';
import { getIdentity } from './getIdentity';
import { studioStages, type StageKey } from './studioStages';

/** A studio page: the identity must see this stage (otherwise 404); `canAct` says whether they may change anything. */
export async function requireStage(key: StageKey, locale: Locale): Promise<{ identity: Identity; canAct: boolean }> {
  const identity = await getIdentity(locale);
  const stage = studioStages.find((s) => s.key === key);
  if (!identity || !stage || !hasRole(identity, ...stage.see)) notFound();
  return { identity, canAct: hasRole(identity, ...stage.act) };
}
