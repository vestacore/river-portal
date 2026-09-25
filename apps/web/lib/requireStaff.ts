import { getStaff, type Staff } from './getStaff';

/** Defence in depth for Server Actions: refuses to run without a verified staff identity. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) throw new Error('Forbidden');
  return staff;
}
