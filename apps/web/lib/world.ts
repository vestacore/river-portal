import { getWorld, invoiceByPayKey, tickWorld, type StandId, type World } from '@river/psp-runtime';

/**
 * The world of one stand for this request, after its clock has had its turn. The retail group's stand is
 * the platform's first: its showcase reads it unless a page says otherwise.
 */
export function world(stand: StandId = 'retail'): World {
  const w = getWorld(stand);
  tickWorld(w, new Date().toISOString());
  return w;
}

/** The stand a demo person belongs to: the retail group's people are `r-…`, the PSP's `p-…`. */
export function standOfPerson(personId: string): StandId {
  return personId.startsWith('r-') ? 'retail' : 'psp';
}

/** The stand whose invoice a pay key opens — the payer's only authority — or the retail one if none does. */
export function worldOfPayKey(payKey: string): World {
  const retail = world('retail');
  if (invoiceByPayKey(retail, payKey)) return retail;
  const psp = world('psp');
  return invoiceByPayKey(psp, payKey) ? psp : retail;
}
