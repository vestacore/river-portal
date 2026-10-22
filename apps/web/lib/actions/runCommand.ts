import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { CommandResult, World } from '@river/psp-runtime';
import { currentActor } from '../session';
import { standOfPerson, world } from '../world';

type PersonActor = NonNullable<Awaited<ReturnType<typeof currentActor>>>;

/**
 * Runs a cabinet command as the current actor, in the world of the actor's stand, and returns to the page the form came from (`back`), with
 * what happened in `done` or `error`. A secret shown once — an API key, a sandbox pay key — travels in a
 * short-lived httpOnly cookie (`psp-flash`), never in a URL. Used by every server action of the cabinets.
 */
export async function runCommand(form: FormData, command: (actor: PersonActor, w: World) => CommandResult<Record<string, unknown>>, done: string): Promise<never> {
  const actor = await currentActor();
  const back = String(form.get('back') ?? '') || '/';
  if (!actor) redirect(back);
  const result = command(actor, world(standOfPerson(actor.personId)));
  revalidatePath('/', 'layout');
  const url = new URL(back, 'http://local');
  url.searchParams.delete('done');
  url.searchParams.delete('error');
  if (result.ok) url.searchParams.set('done', done);
  else url.searchParams.set('error', result.error.slice(0, 160));
  const once = Object.fromEntries(Object.entries(result.ok ? result.value : {}).filter(([k, v]) => typeof v === 'string' && (k === 'secret' || k === 'payKey')));
  if (Object.keys(once).length > 0) (await cookies()).set('psp-flash', JSON.stringify(once), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 120 });
  redirect(`${url.pathname}${url.search}${url.hash}`);
}
