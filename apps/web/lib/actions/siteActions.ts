'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { editContentBlock } from '@river/content';
import { localeFromSegment } from '@river/i18n';
import { commandEnv, getRuntime, staffActor } from '@river/runtime';
import { requireStaff } from '@/lib/requireStaff';

/** Saves an in-place edit of a site block (ADR-0006). */
export async function editBlockAction(blockId: string, localeSegment: string, doc: unknown): Promise<{ ok: boolean }> {
  const staff = await requireStaff();
  const locale = localeFromSegment(localeSegment);
  if (!locale) return { ok: false };
  try {
    const runtime = await getRuntime();
    await editContentBlock(commandEnv(runtime, staffActor(staff.email, staff.role)), { blockId, locale, doc });
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('editBlockAction', error);
    return { ok: false };
  }
}

/** Switches in-place editing on or off for this staff member's browser. */
export async function setEditModeAction(form: FormData): Promise<void> {
  await requireStaff();
  const jar = await cookies();
  if (form.get('mode') === 'on') jar.set('river-edit', '1', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' });
  else jar.delete('river-edit');
  revalidatePath('/', 'layout');
}
