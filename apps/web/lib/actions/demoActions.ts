'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { signSession } from '@river/identity';
import { findPersona, getRuntime, resetDemo } from '@river/runtime';
import { findProfile } from '@river/settings';

async function demoOnly() {
  const runtime = await getRuntime();
  if (runtime.config.auth !== 'demo') throw new Error('Demo sign-in is not enabled');
  return runtime;
}

const safeNext = (next: string, fallback: string) => (/^\/(en-gb|uk)(\/[\w\-/.?=&%]*)?$/.test(next) ? next : fallback);

/** Demo only: act as a persona (signed, httpOnly session cookie), then go to `next` or the persona's home. */
export async function actAsAction(form: FormData): Promise<void> {
  const runtime = await demoOnly();
  const persona = findPersona(String(form.get('personaId')));
  const segment = String(form.get('localeSegment') ?? 'en-gb') === 'uk' ? 'uk' : 'en-gb';
  if (!persona) return;
  const token = signSession({ personaId: persona.id, iat: Math.floor(Date.now() / 1000) }, runtime.config.sessionSecret);
  (await cookies()).set('river-session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 43_200 });
  redirect(safeNext(String(form.get('next') ?? ''), `/${segment}${persona.home}`));
}

/** Demo only: stop acting as a persona. */
export async function signOutAction(form: FormData): Promise<void> {
  await demoOnly();
  (await cookies()).delete('river-session');
  redirect(`/${String(form.get('localeSegment') ?? 'en-gb') === 'uk' ? 'uk' : 'en-gb'}/demo`);
}

/** Demo only (memory store): start again with a profile's demo organisation and data. */
export async function switchProfileAction(form: FormData): Promise<void> {
  const runtime = await demoOnly();
  await resetDemo(runtime, findProfile(String(form.get('profileId'))).id);
  revalidatePath('/', 'layout');
  redirect(`/${String(form.get('localeSegment') ?? 'en-gb') === 'uk' ? 'uk' : 'en-gb'}/demo`);
}
