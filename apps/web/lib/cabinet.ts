import { notFound } from 'next/navigation';
import { pickText, type Locale } from '@river/i18n';
import { can, type Permission } from '@river/psp-access';
import { visibleUnits, type Actor, type World } from '@river/psp-runtime';
import { href } from './href';
import { lt } from './lt';
import { requireActor } from './session';
import { standOfPerson, world } from './world';

type PersonActor = Extract<Actor, { kind: 'person' }>;

/**
 * Everything a cabinet page needs to know about who looks and what they may see: the actor in their
 * profile, the world at this moment, the units of their reach (or of a narrower unit they focused on),
 * and small helpers for names and links. A page that needs a permission checks it here.
 */
export async function cabinet(locale: Locale, focusUnitId?: string | null, permission?: Permission) {
  const actor: PersonActor = await requireActor(locale);
  const stand = standOfPerson(actor.personId);
  const w: World = world(stand);
  const now = new Date().toISOString();
  const visible = visibleUnits(w, actor, focusUnitId);
  const focus = focusUnitId && visible.has(focusUnitId) ? focusUnitId : actor.unitId;
  const may = (p: Permission, unitId: string = focus) => can(w.units, w.grants.filter((g) => g.id === actor.grantId), actor.personId, p, unitId, now);
  if (permission && !may(permission, actor.unitId)) notFound();
  const unitName = (id: string) => pickText(w.units.find((u) => u.id === id)?.name, locale) || id;
  const personName = (id: string) => pickText(w.people.find((p) => p.id === id)?.name, locale) || (id === 'policy' ? lt(locale)('the unit’s policy', 'політика одиниці') : id);
  const link = (path: string) => href(locale, `/cabinet${path}`);
  return { actor, stand, w, now, visible, focus, may, unitName, personName, link, t: lt(locale) };
}
