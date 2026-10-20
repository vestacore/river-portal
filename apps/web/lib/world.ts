import { getPspWorld, tickWorld, type World } from '@river/psp-runtime';

/** The demo world for this request, after the clock has had its turn. */
export function world(): World {
  const w = getPspWorld();
  tickWorld(w, new Date().toISOString());
  return w;
}
