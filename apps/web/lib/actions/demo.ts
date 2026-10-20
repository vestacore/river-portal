'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { signSession } from '@river/identity';
import { getPspWorld, personaActor } from '@river/psp-runtime';
import { demoSecret } from '@/lib/demoSecret';

const segmentOf = (form: FormData) => (String(form.get('locale') ?? 'en-gb') === 'uk' ? 'uk' : 'en-gb');
const safeNext = (next: string, fallback: string) => (/^\/(en-gb|uk)\/cabinet(\/[\w\-/.?=&%]*)?$/.test(next) ? next : fallback);

/** Demo: act as one of the cabinets' people (a signed, httpOnly session), in their first profile or the one asked for. */
export async function actAs(form: FormData): Promise<void> {
  const secret = demoSecret();
  if (!secret) throw new Error('Demo sign-in is not enabled on this deployment');
  const personId = String(form.get('personId') ?? '');
  const world = getPspWorld();
  const actor = personaActor(world, personId, String(form.get('grantId') ?? '') || null, new Date().toISOString());
  if (!actor) return;
  const jar = await cookies();
  jar.set('river-session', signSession({ personaId: personId, iat: Math.floor(Date.now() / 1000) }, secret), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 43_200 });
  jar.set('psp-profile', actor.grantId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 43_200 });
  redirect(safeNext(String(form.get('next') ?? ''), `/${segmentOf(form)}/cabinet`));
}

/** Demo: switch to another profile of the same person (another grant: another role or unit). */
export async function switchProfile(form: FormData): Promise<void> {
  (await cookies()).set('psp-profile', String(form.get('grantId') ?? ''), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 43_200 });
  redirect(`/${segmentOf(form)}/cabinet`);
}

/** Demo: stop acting as anyone. */
export async function signOut(form: FormData): Promise<void> {
  const jar = await cookies();
  jar.delete('river-session');
  jar.delete('psp-profile');
  redirect(`/${segmentOf(form)}/demo`);
}

/** Demo: start the stand again — a fresh history, every change made in the cabinets forgotten. */
export async function resetStand(form: FormData): Promise<void> {
  getPspWorld(true);
  revalidatePath('/', 'layout');
  redirect(`/${segmentOf(form)}/demo?reset=1`);
}
