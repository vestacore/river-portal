import { oblasts } from './data/oblasts.ts';

/** True when `id` is a known oblast identifier. */
export function isOblast(id: string): boolean {
  return oblasts.some((o) => o.id === id);
}
