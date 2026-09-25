import { cookies } from 'next/headers';
import { readConfig } from '@river/runtime';
import { getStaff } from './getStaff';

/** In-place editing is on for staff who switched it on; never on the public surface. */
export async function isEditMode(): Promise<boolean> {
  if (readConfig().surface === 'public') return false;
  if (!(await getStaff())) return false;
  return (await cookies()).get('river-edit')?.value === '1';
}
